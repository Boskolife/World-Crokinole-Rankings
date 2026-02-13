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

// Webhook configuration - disable body parsing
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
            userId: string,
            billingPeriodFromSession?: string
        ) => {
        const subId = subscription.id;
        const sub = await stripe.subscriptions.retrieve(subId, {
            expand: ["items.data.price", "latest_invoice"],
        });

        const planId = (sub.metadata?.planId ?? subscription.metadata?.planId) || "1";
        const planName = planMap[planId] || "standard";

        const billingPeriodFromMeta =
            (sub.metadata?.billingPeriod as string) ??
            (subscription.metadata?.billingPeriod as string) ??
            billingPeriodFromSession;
        const firstItem = sub.items?.data?.[0];
        const price = firstItem?.price;
        const recurring =
            typeof price === "object" && price && "recurring" in price
                ? (price as { recurring?: { interval?: string; interval_count?: number } }).recurring
                : undefined;
        const interval = recurring?.interval;
        const intervalCount = recurring?.interval_count ?? 1;
        const billingPeriodDerived =
            interval === "year" || (interval === "month" && intervalCount === 12)
                ? "annual"
                : "monthly";
        const billingPeriod =
            billingPeriodFromMeta === "annual" || billingPeriodFromMeta === "monthly"
                ? billingPeriodFromMeta
                : billingPeriodDerived;

        let periodStartISO: string | null = null;
        let periodEndISO: string | null = null;

        const latestInvoice = sub.latest_invoice;
        if (latestInvoice && typeof latestInvoice === "object") {
            const inv = latestInvoice as { period_start?: number; period_end?: number; lines?: { data?: Array<{ period?: { start: number; end: number } }> } };
            if (inv.period_start != null && inv.period_end != null) {
                periodStartISO = new Date(inv.period_start * 1000).toISOString();
                periodEndISO = new Date(inv.period_end * 1000).toISOString();
            }
            if ((!periodStartISO || !periodEndISO) && inv.lines?.data?.[0]?.period) {
                const p = inv.lines.data[0].period;
                if (p.start != null) periodStartISO = new Date(p.start * 1000).toISOString();
                if (p.end != null) periodEndISO = new Date(p.end * 1000).toISOString();
            }
        }
        if (!periodStartISO || !periodEndISO) {
            const item = firstItem as unknown as { current_period_start?: number; current_period_end?: number } | undefined;
            const raw = sub as unknown as { current_period_start?: number; current_period_end?: number };
            const ps = item?.current_period_start ?? raw?.current_period_start;
            const pe = item?.current_period_end ?? raw?.current_period_end;
            if (ps != null && typeof ps === "number") periodStartISO = new Date(ps * 1000).toISOString();
            if (pe != null && typeof pe === "number") periodEndISO = new Date(pe * 1000).toISOString();
        }

        const customerId = typeof sub.customer === "string" ? sub.customer : (sub.customer as { id: string })?.id;

        const { error: subscriptionError } = await supabase.from("subscriptions").upsert(
            {
                user_id: userId,
                stripe_subscription_id: sub.id,
                stripe_customer_id: customerId,
                plan_id: parseInt(planId),
                plan_name: planName,
                status: sub.status,
                billing_period: billingPeriod,
                current_period_start: periodStartISO,
                current_period_end: periodEndISO,
                cancel_at_period_end: sub.cancel_at_period_end ?? false,
            },
            { onConflict: "stripe_subscription_id" }
        );

        if (subscriptionError) {
            console.error("Failed to upsert subscription:", subscriptionError);
            throw new Error(`Failed to update subscription: ${subscriptionError.message}`);
        }

        if (sub.status === "active" || sub.status === "trialing") {
            const { error: profileError } = await supabase
                .from("profiles")
                .update({ subscription_plan: planName })
                .eq("id", userId);

            if (profileError) {
                console.error("Failed to update profile:", profileError);
                throw new Error(`Failed to update profile: ${profileError.message}`);
            }
        } else if (sub.status === "canceled" || sub.status === "unpaid" || sub.status === "past_due") {
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
                    const subscription = await stripe.subscriptions.retrieve(subscriptionId, {
                        expand: ["items.data.price"],
                    });
                    const billingPeriodFromSession = session.metadata?.billingPeriod as string | undefined;
                    await updateSubscription(subscription, userId, billingPeriodFromSession);
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

