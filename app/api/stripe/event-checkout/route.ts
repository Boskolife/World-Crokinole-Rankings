import { NextRequest, NextResponse } from "next/server";
import Stripe from "stripe";

const stripe = new Stripe(process.env.STRIPE_SECRET_KEY || "", {
    apiVersion: "2026-01-28.clover",
});

export async function POST(request: NextRequest) {
    try {
        const body = await request.json();
        const { eventId, userId, fee, heatIndex, title, successUrl, cancelUrl } = body;

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

        const baseUrl =
            process.env.NEXT_PUBLIC_BASE_URL ||
            (typeof process.env.VERCEL_URL === "string" ? `https://${process.env.VERCEL_URL}` : "http://localhost:3000");
        const eventPath = `/events/${eventId}`;
        const success = successUrl ?? `${baseUrl}${eventPath}?payment=success`;
        const cancel = cancelUrl ?? `${baseUrl}${eventPath}?payment=canceled`;

        const session = await stripe.checkout.sessions.create({
            payment_method_types: ["card"],
            line_items: [
                {
                    price_data: {
                        currency: "usd",
                        unit_amount: amountCents,
                        product_data: {
                            name: title ? `Event registration: ${title}` : "Event registration",
                        },
                    },
                    quantity: 1,
                },
            ],
            mode: "payment",
            success_url: success,
            cancel_url: cancel,
            client_reference_id: userId,
            metadata: {
                type: "event_registration",
                eventId: String(eventId),
                userId,
                heatIndex: heatIndex != null ? String(heatIndex) : "",
            },
        });

        return NextResponse.json({ sessionId: session.id, url: session.url });
    } catch (error: unknown) {
        console.error("Stripe event checkout error:", error);
        return NextResponse.json(
            { error: error instanceof Error ? error.message : "Failed to create checkout session" },
            { status: 500 }
        );
    }
}
