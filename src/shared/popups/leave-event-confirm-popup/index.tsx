"use client";

import React, { useState } from "react";
import css from "../styles.module.scss";
import { Icon } from "@/shared/ui/icons";
import { usePopup } from "@/shared/contexts/popup-context";
import { useRemoveEventRegistration } from "@/shared/hooks";
import cn from "classnames";

interface LeaveEventConfirmPopupData {
    eventId: number;
    userId: string;
    eventTitle?: string;
    onSuccess?: () => void;
}

export const LeaveEventConfirmPopup: React.FC = () => {
    const { closePopup, getPopupData } = usePopup();
    const data = getPopupData("leave-event-confirm") as LeaveEventConfirmPopupData | undefined;
    const { removeFromEvent } = useRemoveEventRegistration();
    const [isLeaving, setIsLeaving] = useState(false);
    const [error, setError] = useState<string | null>(null);

    if (!data) return null;

    const handleLeave = async () => {
        setIsLeaving(true);
        setError(null);
        const ok = await removeFromEvent(data.eventId, data.userId);
        setIsLeaving(false);
        if (ok) {
            closePopup("leave-event-confirm");
            data.onSuccess?.();
        } else {
            setError("Failed to leave the event.");
        }
    };

    return (
        <div className={css.popup}>
            <div className={css.popup_close}>
                <Icon
                    name="x"
                    className={css.popup_close_icon}
                    onClick={() => !isLeaving && closePopup("leave-event-confirm")}
                />
            </div>
            <div className={css.popup_content}>
                <h2>Leave event</h2>
                {error && <div className={css.popup_error}>{error}</div>}
                <p>
                    Are you sure you want to leave this event
                    {data.eventTitle ? ` (${data.eventTitle})` : ""}? You can join again later.
                </p>
                <div className={css.popup_buttons}>
                    <button
                        className={cn(css.popup_button, css.popup_button_secondary)}
                        onClick={() => closePopup("leave-event-confirm")}
                        disabled={isLeaving}
                    >
                        Cancel
                    </button>
                    <button
                        className={cn(css.popup_button, css.popup_button_primary)}
                        onClick={handleLeave}
                        disabled={isLeaving}
                        style={{ background: isLeaving ? "#6c757d" : "#dc3545" }}
                    >
                        {isLeaving ? "Leaving…" : "Leave event"}
                    </button>
                </div>
            </div>
        </div>
    );
};
