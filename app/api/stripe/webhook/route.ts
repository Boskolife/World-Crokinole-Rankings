import { NextRequest, NextResponse } from "next/server";
import Stripe from "stripe";
import { createClient } from "@supabase/supabase-js";

const stripe = new Stripe(process.env.STRIPE_SECRET_KEY || "", {
    apiVersion: "2026-01-28.clover",
});

const supabase = createClient(
    process.env.NEXT_PUBLIC_SUPABASE_URL || "",
    process.env.SUPABASE_SERVICE_ROLE_KEY || ""
);

const webhookSecret = process.env.STRIPE_WEBHOOK_SECRET || "";

// Конфигурация для вебхука - отключаем body parsing
export const runtime = 'nodejs';
export const dynamic = 'force-dynamic';

export async function POST(request: NextRequest) {
    try {
        const body = await request.text();
        const signature = request.headers.get("stripe-signature");
        
        console.log('[WEBHOOK] POST request received', {
            url: request.url,
            hasSignature: !!signature,
            bodyLength: body.length,
        });

        if (!signature) {
            console.error('Webhook called without signature header');
            return NextResponse.json(
                { error: "No signature" },
                { status: 400 }
            );
        }

        let event: Stripe.Event;

        try {
            event = stripe.webhooks.constructEvent(body, signature, webhookSecret);
        } catch (err: any) {
            console.error("Webhook signature verification failed:", err.message);
            return NextResponse.json(
                { error: `Webhook Error: ${err.message}` },
                { status: 400 }
            );
        }

        const planMap: Record<string, string> = {
            "2": "premium",
            "3": "administrator",
        };

        const updateSubscription = async (
            subscription: Stripe.Subscription,
            userId: string
        ) => {
        const planId = subscription.metadata?.planId || "1";
        const planName = planMap[planId] || "standard";
        const billingPeriod = subscription.items.data[0]?.price?.recurring?.interval === "month" 
            ? (subscription.items.data[0]?.price?.recurring?.interval_count === 12 ? "annual" : "monthly")
            : "monthly";

        // Правильно извлекаем current_period_start и current_period_end из Stripe subscription
        // Stripe возвращает эти значения как числа (Unix timestamp в секундах)
        const subscriptionAny = subscription as any;
        const periodStart = subscriptionAny.current_period_start;
        const periodEnd = subscriptionAny.current_period_end;

        console.log('Subscription periods:', {
            subscriptionId: subscription.id,
            periodStart,
            periodEnd,
            periodStartType: typeof periodStart,
            periodEndType: typeof periodEnd,
            hasPeriodStart: periodStart !== undefined && periodStart !== null,
            hasPeriodEnd: periodEnd !== undefined && periodEnd !== null,
        });

        // Конвертируем Unix timestamp в ISO строку для базы данных
        const periodStartISO = periodStart && typeof periodStart === 'number' 
            ? new Date(periodStart * 1000).toISOString() 
            : null;
        const periodEndISO = periodEnd && typeof periodEnd === 'number' 
            ? new Date(periodEnd * 1000).toISOString() 
            : null;

        console.log('Converted periods:', {
            periodStartISO,
            periodEndISO,
        });

        const { error: subscriptionError } = await supabase.from("subscriptions").upsert(
            {
                user_id: userId,
                stripe_subscription_id: subscription.id,
                stripe_customer_id: typeof subscription.customer === "string" ? subscription.customer : subscription.customer.id,
                plan_id: parseInt(planId),
                plan_name: planName,
                status: subscription.status,
                billing_period: billingPeriod,
                current_period_start: periodStartISO,
                current_period_end: periodEndISO,
                cancel_at_period_end: subscription.cancel_at_period_end || false,
            },
            { onConflict: "stripe_subscription_id" }
        );

        if (subscriptionError) {
            console.error("Failed to upsert subscription:", subscriptionError);
            throw new Error(`Failed to update subscription: ${subscriptionError.message}`);
        }

        if (subscription.status === "active" || subscription.status === "trialing") {
            const { error: profileError } = await supabase
                .from("profiles")
                .update({ subscription_plan: planName })
                .eq("id", userId);

            if (profileError) {
                console.error("Failed to update profile:", profileError);
                throw new Error(`Failed to update profile: ${profileError.message}`);
            }
        } else if (subscription.status === "canceled" || subscription.status === "unpaid" || subscription.status === "past_due") {
            const { error: profileError } = await supabase
                .from("profiles")
                .update({ subscription_plan: "standard" })
                .eq("id", userId);

            if (profileError) {
                console.error("Failed to update profile:", profileError);
                throw new Error(`Failed to update profile: ${profileError.message}`);
            }
        }
        };

        try {
            console.log(`Processing webhook event: ${event.type}`);

            if (event.type === "checkout.session.completed") {
                const session = event.data.object as Stripe.Checkout.Session;
                const userId = session.metadata?.userId;
                const subscriptionId = session.subscription as string;

                console.log(`Checkout completed - userId: ${userId}, subscriptionId: ${subscriptionId}`);

                if (userId && subscriptionId) {
                    const subscription = await stripe.subscriptions.retrieve(subscriptionId);
                    await updateSubscription(subscription, userId);
                    console.log(`Subscription updated for user ${userId}`);
                } else {
                    console.warn("Missing userId or subscriptionId in checkout.session.completed");
                }
            }

            if (event.type === "customer.subscription.created" || event.type === "customer.subscription.updated") {
                const subscription = event.data.object as Stripe.Subscription;
                const userId = subscription.metadata?.userId;

                console.log(`Subscription ${event.type} - userId: ${userId}, subscriptionId: ${subscription.id}`);

                if (userId) {
                    await updateSubscription(subscription, userId);
                    console.log(`Subscription ${event.type} processed for user ${userId}`);
                } else {
                    console.warn(`Missing userId in subscription ${event.type}`);
                }
            }

            if (event.type === "customer.subscription.deleted") {
                const subscription = event.data.object as Stripe.Subscription;
                const userId = subscription.metadata?.userId;

                console.log(`Subscription deleted - userId: ${userId}, subscriptionId: ${subscription.id}`);

                if (userId) {
                    const { error: subscriptionError } = await supabase
                        .from("subscriptions")
                        .update({ 
                            status: "canceled",
                            cancel_at_period_end: true 
                        })
                        .eq("stripe_subscription_id", subscription.id);

                    if (subscriptionError) {
                        console.error("Failed to update subscription status:", subscriptionError);
                        throw new Error(`Failed to update subscription: ${subscriptionError.message}`);
                    }

                    const { error: profileError } = await supabase
                        .from("profiles")
                        .update({ subscription_plan: "standard" })
                        .eq("id", userId);

                    if (profileError) {
                        console.error("Failed to update profile:", profileError);
                        throw new Error(`Failed to update profile: ${profileError.message}`);
                    }

                    console.log(`Subscription canceled and profile updated for user ${userId}`);
                } else {
                    console.warn("Missing userId in subscription.deleted");
                }
            }

            console.log(`✅ Webhook event ${event.type} processed successfully`);
            return NextResponse.json({ 
                received: true, 
                event: event.type,
                eventId: event.id,
            });
        } catch (error: any) {
            console.error("❌ Webhook handler error:", {
                eventType: event?.type || 'unknown',
                error: error.message,
                stack: error.stack,
            });
            return NextResponse.json(
                { error: error.message, event: event?.type },
                { status: 500 }
            );
        }
    } catch (error: any) {
        console.error("❌ Webhook request error:", error.message);
        return NextResponse.json(
            { error: error.message || "Internal server error" },
            { status: 500 }
        );
    }
}

