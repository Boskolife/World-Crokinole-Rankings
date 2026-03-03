"use client";

import React, { useState } from "react";
import css from "../styles.module.scss";
import { Icon } from "@/shared/ui/icons";
import { usePopup } from "@/shared/contexts/popup-context";
import { useAuth } from "@/shared/hooks/use-auth";
import cn from "classnames";

type PayEventFeePopupData = {
    eventId?: number;
    title?: string;
    fee?: string;
    heatIndex?: number;
    totalParticipants?: number;
};

export const PayEventFeePopup: React.FC = () => {
    const { closePopup, getPopupData } = usePopup();
    const { user } = useAuth();
    const data = getPopupData("pay-event-fee") as PayEventFeePopupData | undefined;
    const [isLoading, setIsLoading] = useState(false);
    const [error, setError] = useState<string | null>(null);

    const eventId = data?.eventId ?? 0;
    const title = data?.title ?? "Event";
    const feeStr = data?.fee?.trim() ?? "";
    const feeNum = parseFloat(feeStr);
    const isValidFee = !Number.isNaN(feeNum) && feeNum > 0;

    const handlePayAndRegister = async () => {
        if (!user?.id || !eventId || !isValidFee) return;
        setIsLoading(true);
        setError(null);
        try {
            const path = typeof window !== "undefined" ? window.location.pathname : "";
            const res = await fetch("/api/stripe/event-checkout", {
                method: "POST",
                headers: { "Content-Type": "application/json" },
                body: JSON.stringify({
                    eventId,
                    userId: user.id,
                    fee: feeNum,
                    heatIndex: data?.heatIndex,
                    title: data?.title ?? "",
                    successUrl: path ? `${window.location.origin}${path}?payment=success` : undefined,
                    cancelUrl: path ? `${window.location.origin}${path}?payment=canceled` : undefined,
                }),
            });
            const json = await res.json();
            if (!res.ok) {
                setError(json.error ?? "Failed to create checkout");
                return;
            }
            if (json.url) {
                closePopup("pay-event-fee");
                window.location.href = json.url;
            } else {
                setError("Invalid response from server");
            }
        } catch (err) {
            setError(err instanceof Error ? err.message : "Payment failed");
        } finally {
            setIsLoading(false);
        }
    };

    if (!data) return null;

    return (
        <div className={css.popup}>
            <div className={css.popup_close}>
                <Icon
                    name="x"
                    className={css.popup_close_icon}
                    onClick={() => !isLoading && closePopup("pay-event-fee")}
                />
            </div>
            <div className={css.popup_content}>
                <h2 className={css.join_tournament_title}>{title}</h2>
                <p className={css.join_tournament_description}>
                    This event has a registration fee of <strong>${feeStr}</strong>. Complete payment to register.
                </p>
                {error && <p className={css.join_tournament_error}>{error}</p>}
                <div className={css.popup_buttons}>
                    <button
                        type="button"
                        className={cn(css.popup_button, css.popup_button_secondary)}
                        onClick={() => closePopup("pay-event-fee")}
                        disabled={isLoading}
                    >
                        Cancel
                    </button>
                    <button
                        type="button"
                        className={cn(css.popup_button, css.join_tournament_submit)}
                        onClick={handlePayAndRegister}
                        disabled={isLoading || !isValidFee}
                    >
                        {isLoading ? "Redirecting…" : "Pay & Register"}
                    </button>
                </div>
            </div>
        </div>
    );
};
