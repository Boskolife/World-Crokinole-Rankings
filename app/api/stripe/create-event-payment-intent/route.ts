import { NextRequest, NextResponse } from "next/server";
import Stripe from "stripe";

const stripe = new Stripe(process.env.STRIPE_SECRET_KEY || "", {
    apiVersion: "2026-01-28.clover",
});

export async function POST(request: NextRequest) {
    try {
        const body = await request.json();
        const { eventId, userId, fee, heatIndex, title, customerEmail } = body;

        if (!eventId || !userId || fee == null || fee <= 0) {
            return NextResponse.json(
                { error: "Missing or invalid required fields (eventId, userId, fee)" },
                { status: 400 }
            );
        }

        const amountCents = Math.round(Number(fee) * 100);
        if (amountCents <= 0) {
            return NextResponse.json(
                { error: "Fee must be greater than 0" },
                { status: 400 }
            );
        }

        const paymentIntent = await stripe.paymentIntents.create({
            amount: amountCents,
            currency: "usd",
            payment_method_types: ["card"],
            metadata: {
                type: "event_registration",
                eventId: String(eventId),
                userId,
                heatIndex: heatIndex != null ? String(heatIndex) : "",
            },
            ...(customerEmail && typeof customerEmail === "string" && customerEmail.trim()
                ? { receipt_email: customerEmail.trim() }
                : {}),
        });

        return NextResponse.json({ clientSecret: paymentIntent.client_secret });
    } catch (error: unknown) {
        console.error("Stripe create event payment intent error:", error);
        return NextResponse.json(
            { error: error instanceof Error ? error.message : "Failed to create payment intent" },
            { status: 500 }
        );
    }
}
