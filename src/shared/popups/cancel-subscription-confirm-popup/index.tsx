"use client";

import React, { useState } from "react";
import css from "../styles.module.scss";
import { Icon } from "@/shared/ui/icons";
import { usePopup } from "@/shared/contexts/popup-context";
import cn from "classnames";

interface CancelSubscriptionConfirmPopupData {
    onConfirm: () => void | Promise<void>;
}

export const CancelSubscriptionConfirmPopup: React.FC = () => {
    const { closePopup, getPopupData } = usePopup();
    const data = getPopupData("cancel-subscription-confirm") as CancelSubscriptionConfirmPopupData | undefined;
    const [isSubmitting, setIsSubmitting] = useState(false);

    if (!data) {
        return null;
    }

    const handleConfirm = async () => {
        setIsSubmitting(true);
        try {
            await Promise.resolve(data.onConfirm?.());
            closePopup("cancel-subscription-confirm");
        } finally {
            setIsSubmitting(false);
        }
    };

    return (
        <div className={css.popup}>
            <div className={css.popup_close}>
                <Icon
                    name="x"
                    className={css.popup_close_icon}
                    onClick={() => !isSubmitting && closePopup("cancel-subscription-confirm")}
                />
            </div>
            <div className={css.popup_content}>
                <h2>Cancel subscription</h2>
                <p>
                    Are you sure you want to cancel your subscription? You will continue to have access until the end of your billing period.
                </p>
                <div className={css.popup_buttons}>
                    <button
                        className={cn(css.popup_button, css.popup_button_secondary)}
                        onClick={() => closePopup("cancel-subscription-confirm")}
                        disabled={isSubmitting}
                    >
                        Keep subscription
                    </button>
                    <button
                        className={cn(css.popup_button, css.popup_button_primary)}
                        onClick={handleConfirm}
                        disabled={isSubmitting}
                    >
                        {isSubmitting ? "Canceling…" : "Yes, cancel"}
                    </button>
                </div>
            </div>
        </div>
    );
};
