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

        const session = await stripe.checkout.sessions.create({
            payment_method_types: ["card"],
            line_items: [
                {
                    price: priceId,
                    quantity: 1,
                },
            ],
            mode: "subscription",
            success_url: `${process.env.NEXT_PUBLIC_BASE_URL || "http://localhost:3000"}/membership-plans?success=true`,
            cancel_url: `${process.env.NEXT_PUBLIC_BASE_URL || "http://localhost:3000"}/membership-plans?canceled=true`,
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

