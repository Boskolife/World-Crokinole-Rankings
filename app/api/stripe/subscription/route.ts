import { NextRequest, NextResponse } from "next/server";
import Stripe from "stripe";
import { createClient } from "@supabase/supabase-js";

const stripe = new Stripe(process.env.STRIPE_SECRET_KEY || "", {
    apiVersion: "2024-12-18.acacia",
});

const supabase = createClient(
    process.env.NEXT_PUBLIC_SUPABASE_URL || "",
    process.env.SUPABASE_SERVICE_ROLE_KEY || ""
);

export async function GET(request: NextRequest) {
    try {
        const { searchParams } = new URL(request.url);
        const userId = searchParams.get("userId");

        if (!userId) {
            return NextResponse.json(
                { error: "User ID is required" },
                { status: 400 }
            );
        }

        const { data: subscription, error } = await supabase
            .from("subscriptions")
            .select("*")
            .eq("user_id", userId)
            .eq("status", "active")
            .maybeSingle();

        if (error) {
            return NextResponse.json(
                { error: error.message },
                { status: 500 }
            );
        }

        if (!subscription) {
            return NextResponse.json({ subscription: null });
        }

        const stripeSubscription = await stripe.subscriptions.retrieve(
            subscription.stripe_subscription_id
        );

        return NextResponse.json({
            subscription: {
                ...subscription,
                stripeSubscription,
            },
        });
    } catch (error: any) {
        console.error("Get subscription error:", error);
        return NextResponse.json(
            { error: error.message || "Failed to get subscription" },
            { status: 500 }
        );
    }
}

export async function DELETE(request: NextRequest) {
    try {
        const body = await request.json();
        const { userId } = body;

        if (!userId) {
            return NextResponse.json(
                { error: "User ID is required" },
                { status: 400 }
            );
        }

        const { data: subscription, error: subError } = await supabase
            .from("subscriptions")
            .select("stripe_subscription_id")
            .eq("user_id", userId)
            .eq("status", "active")
            .maybeSingle();

        if (subError || !subscription) {
            return NextResponse.json(
                { error: "No active subscription found" },
                { status: 404 }
            );
        }

        await stripe.subscriptions.update(subscription.stripe_subscription_id, {
            cancel_at_period_end: true,
        });

        await supabase
            .from("subscriptions")
            .update({ cancel_at_period_end: true })
            .eq("stripe_subscription_id", subscription.stripe_subscription_id);

        return NextResponse.json({
            success: true,
            message: "Subscription will be canceled at the end of the billing period",
        });
    } catch (error: any) {
        console.error("Cancel subscription error:", error);
        return NextResponse.json(
            { error: error.message || "Failed to cancel subscription" },
            { status: 500 }
        );
    }
}

