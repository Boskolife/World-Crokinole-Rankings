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

export async function POST(request: NextRequest) {
    try {
        const body = await request.json();
        const { planId, userId, billingPeriod } = body;

        if (!planId || !userId || !billingPeriod) {
            return NextResponse.json(
                { error: "Missing required fields" },
                { status: 400 }
            );
        }

        const priceMap: Record<string, { monthly: string; annual: string }> = {
            "2": {
                monthly: process.env.STRIPE_PRICE_PREMIUM_MONTHLY || "",
                annual: process.env.STRIPE_PRICE_PREMIUM_ANNUAL || "",
            },
            "3": {
                monthly: process.env.STRIPE_PRICE_ADMIN_MONTHLY || "",
                annual: process.env.STRIPE_PRICE_ADMIN_ANNUAL || "",
            },
        };

        const priceId =
            priceMap[planId]?.[billingPeriod as "monthly" | "annual"];

        if (!priceId) {
            return NextResponse.json(
                { error: "Invalid plan or billing period" },
                { status: 400 }
            );
        }

        const baseUrl =
            process.env.NEXT_PUBLIC_BASE_URL ||
            (process.env.VERCEL_URL ? `https://${process.env.VERCEL_URL}` : "http://localhost:3000");

        const { data: rawExisting } = await supabase
            .from("subscriptions")
            .select("stripe_subscription_id")
            .eq("user_id", userId)
            .eq("status", "active")
            .order("current_period_end", { ascending: false })
            .limit(1);

        const existingRow = Array.isArray(rawExisting) ? rawExisting[0] : rawExisting;
        const existingSubscriptionId = (existingRow as { stripe_subscription_id?: string } | null)?.stripe_subscription_id;

        if (existingSubscriptionId) {
            try {
                const sub = await stripe.subscriptions.retrieve(existingSubscriptionId, {
                    expand: ["items.data"],
                });
                const item = sub.items?.data?.[0];
                if (item?.id) {
                    await stripe.subscriptions.update(existingSubscriptionId, {
                        items: [{ id: item.id, price: priceId }],
                        proration_behavior: "always_invoice",
                        metadata: {
                            userId,
                            planId,
                            billingPeriod,
                        },
                    });
                    const updated = await stripe.subscriptions.retrieve(existingSubscriptionId, {
                        expand: ["latest_invoice"],
                    });
                    const invoice = updated.latest_invoice as Stripe.Invoice | null | undefined;
                    if (
                        invoice &&
                        typeof invoice === "object" &&
                        invoice.hosted_invoice_url
                    ) {
                        return NextResponse.json({ url: invoice.hosted_invoice_url });
                    }
                    return NextResponse.json({
                        url: `${baseUrl}/membership-plans?success=true`,
                    });
                }
            } catch (err: unknown) {
                const message = err instanceof Error ? err.message : "Subscription update failed";
                console.error("Checkout subscription update error:", err);
                return NextResponse.json({ error: message }, { status: 502 });
            }
        }

        const session = await stripe.checkout.sessions.create({
            payment_method_types: ["card"],
            line_items: [
                {
                    price: priceId,
                    quantity: 1,
                },
            ],
            mode: "subscription",
            success_url: `${baseUrl}/membership-plans?success=true`,
            cancel_url: `${baseUrl}/membership-plans?canceled=true`,
            client_reference_id: userId,
            metadata: {
                userId,
                planId,
                billingPeriod,
            },
            subscription_data: {
                metadata: {
                    userId,
                    planId,
                    billingPeriod,
                },
            },
        });

        return NextResponse.json({ sessionId: session.id, url: session.url });
    } catch (error: any) {
        console.error("Stripe checkout error:", error);
        return NextResponse.json(
            { error: error.message || "Failed to create checkout session" },
            { status: 500 }
        );
    }
}

