"use client";

import React, { useState, useEffect, useCallback } from "react";
import { loadStripe } from "@stripe/stripe-js";
import { Elements, useStripe, useElements, PaymentElement } from "@stripe/react-stripe-js";
import { useRouter } from "next/navigation";
import css from "../styles.module.scss";
import { Icon } from "@/shared/ui/icons";
import { usePopup } from "@/shared/contexts/popup-context";
import { useAuth } from "@/shared/hooks/use-auth";
import cn from "classnames";

const stripePromise = loadStripe(process.env.NEXT_PUBLIC_STRIPE_PUBLISHABLE_KEY || "");

type PayEventFeePopupData = {
    eventId?: number;
    title?: string;
    fee?: string;
    heatIndex?: number;
    totalParticipants?: number;
};

function PayEventFeeForm({
    clientSecret,
    title,
    feeStr,
    onSuccess,
}: {
    clientSecret: string;
    title: string;
    feeStr: string;
    onSuccess: () => void;
}) {
    const router = useRouter();
    const stripe = useStripe();
    const elements = useElements();
    const { closePopup } = usePopup();
    const [isSubmitting, setIsSubmitting] = useState(false);
    const [error, setError] = useState<string | null>(null);

    const handleSubmit = useCallback(
        async (e: React.FormEvent) => {
            e.preventDefault();
            if (!stripe || !elements) return;
            setIsSubmitting(true);
            setError(null);
            const returnUrl =
                typeof window !== "undefined"
                    ? `${window.location.origin}${window.location.pathname}?payment=success`
                    : "";
            const result = await stripe.confirmPayment({
                elements,
                clientSecret,
                confirmParams: { return_url: returnUrl },
            });
            if (result.error) {
                setError(result.error.message ?? "Payment failed");
                setIsSubmitting(false);
                return;
            }
            const intent = (result as { paymentIntent?: { status: string } }).paymentIntent;
            if (intent?.status === "succeeded") {
                closePopup("pay-event-fee");
                onSuccess();
                router.refresh();
            }
            setIsSubmitting(false);
        },
        [stripe, elements, clientSecret, closePopup, onSuccess, router]
    );

    return (
        <form onSubmit={handleSubmit} className={css.popup_form}>
            <div className={css.pay_event_fee_element} id="payment-element-wrapper">
                <PaymentElement
                    options={{
                        layout: "tabs",
                    }}
                />
            </div>
            {error && <p className={css.join_tournament_error}>{error}</p>}
            <div className={css.popup_buttons}>
                <button
                    type="button"
                    className={cn(css.popup_button, css.popup_button_secondary)}
                    onClick={() => closePopup("pay-event-fee")}
                    disabled={isSubmitting}
                >
                    Cancel
                </button>
                <button
                    type="submit"
                    className={cn(css.popup_button, css.join_tournament_submit)}
                    disabled={!stripe || isSubmitting}
                >
                    {isSubmitting ? "Processing…" : `Pay $${feeStr} & Register`}
                </button>
            </div>
        </form>
    );
}

export const PayEventFeePopup: React.FC = () => {
    const { closePopup, getPopupData } = usePopup();
    const { user } = useAuth();
    const data = getPopupData("pay-event-fee") as PayEventFeePopupData | undefined;
    const [clientSecret, setClientSecret] = useState<string | null>(null);
    const [loadError, setLoadError] = useState<string | null>(null);
    const [isLoading, setIsLoading] = useState(false);
    const router = useRouter();

    const eventId = data?.eventId ?? 0;
    const title = data?.title ?? "Event";
    const feeStr = data?.fee?.trim() ?? "";
    const feeNum = parseFloat(feeStr);
    const isValidFee = !Number.isNaN(feeNum) && feeNum > 0;

    useEffect(() => {
        if (!data || !user?.id || !eventId || !isValidFee) return;
        let cancelled = false;
        setIsLoading(true);
        setLoadError(null);
        setClientSecret(null);
        fetch("/api/stripe/create-event-payment-intent", {
            method: "POST",
            headers: { "Content-Type": "application/json" },
            body: JSON.stringify({
                eventId,
                userId: user.id,
                fee: feeNum,
                heatIndex: data?.heatIndex,
                title: data?.title ?? "",
                customerEmail: user.email ?? undefined,
            }),
        })
            .then(async (res) => {
                const json = await res.json();
                if (cancelled) return;
                if (!res.ok) {
                    setLoadError(json.error ?? "Failed to initialize payment");
                    return;
                }
                if (json.clientSecret) setClientSecret(json.clientSecret);
                else setLoadError("Invalid response from server");
            })
            .catch((err) => {
                if (!cancelled) setLoadError(err instanceof Error ? err.message : "Failed to load");
            })
            .finally(() => {
                if (!cancelled) setIsLoading(false);
            });
        return () => {
            cancelled = true;
        };
    }, []);

    const handleSuccess = useCallback(() => {
        window.dispatchEvent(new CustomEvent("event-registration-updated", { detail: { eventId } }));
        router.refresh();
    }, [eventId, router]);

    if (!data) return null;

    return (
        <div className={css.popup}>
            <div className={css.popup_close}>
                <Icon
                    name="x"
                    className={css.popup_close_icon}
                    onClick={() => closePopup("pay-event-fee")}
                />
            </div>
            <div className={css.popup_content}>
                <h2 className={css.join_tournament_title}>{title}</h2>
                <p className={css.join_tournament_description}>
                    Registration fee: <strong>${feeStr}</strong>. Enter payment details below.
                </p>
                {isLoading && <p className={css.join_tournament_description}>Loading payment form…</p>}
                {loadError && <p className={css.join_tournament_error}>{loadError}</p>}
                {clientSecret && !loadError && (
                    <Elements
                        stripe={stripePromise}
                        options={{
                            clientSecret,
                            appearance: {
                                variables: { borderRadius: "8px" },
                            },
                        }}
                    >
                        <PayEventFeeForm
                            clientSecret={clientSecret}
                            title={title}
                            feeStr={feeStr}
                            onSuccess={handleSuccess}
                        />
                    </Elements>
                )}
                {!clientSecret && !isLoading && !loadError && isValidFee && (
                    <p className={css.join_tournament_description}>Preparing payment…</p>
                )}
            </div>
        </div>
    );
};
