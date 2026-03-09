import { NextRequest, NextResponse } from "next/server";
import Stripe from "stripe";
import { applyEventRegistrationFromMetadata } from "../lib/event-registration";

const stripe = new Stripe(process.env.STRIPE_SECRET_KEY || "", {
    apiVersion: "2026-01-28.clover",
});

export async function POST(request: NextRequest) {
    try {
        const body = await request.json();
        const paymentIntentId = body?.paymentIntentId ?? body?.payment_intent;
        if (!paymentIntentId || typeof paymentIntentId !== "string") {
            return NextResponse.json(
                { error: "Missing paymentIntentId" },
                { status: 400 }
            );
        }

        const paymentIntent = await stripe.paymentIntents.retrieve(paymentIntentId);
        if (paymentIntent.status !== "succeeded") {
            return NextResponse.json(
                { error: "Payment not succeeded" },
                { status: 400 }
            );
        }

        const type = paymentIntent.metadata?.type;
        if (type !== "event_registration") {
            return NextResponse.json(
                { error: "Not an event registration payment" },
                { status: 400 }
            );
        }

        await applyEventRegistrationFromMetadata({
            eventId: paymentIntent.metadata?.eventId as string | undefined,
            userId: paymentIntent.metadata?.userId as string | undefined,
            heatIndex: paymentIntent.metadata?.heatIndex as string | undefined,
        });

        return NextResponse.json({ ok: true });
    } catch (error: unknown) {
        console.error("Confirm event registration error:", error);
        return NextResponse.json(
            {
                error:
                    error instanceof Error ? error.message : "Failed to confirm registration",
            },
            { status: 500 }
        );
    }
}
