"use client";

import React, { useState } from "react";
import css from "../styles.module.scss";
import { Icon } from "@/shared/ui/icons";
import { usePopup } from "@/shared/contexts/popup-context";
import { useRemoveEventRegistration } from "@/shared/hooks";
import cn from "classnames";

interface RemoveEventParticipantConfirmPopupData {
    eventId: number;
    userId: string;
    playerName: string;
    onSuccess?: () => void;
}

export const RemoveEventParticipantConfirmPopup: React.FC = () => {
    const { closePopup, getPopupData } = usePopup();
    const data = getPopupData("remove-event-participant-confirm") as RemoveEventParticipantConfirmPopupData | undefined;
    const { removeFromEvent } = useRemoveEventRegistration();
    const [isRemoving, setIsRemoving] = useState(false);
    const [error, setError] = useState<string | null>(null);

    if (!data) {
        return null;
    }

    const handleRemove = async () => {
        setIsRemoving(true);
        setError(null);
        const ok = await removeFromEvent(data.eventId, data.userId);
        setIsRemoving(false);
        if (ok) {
            closePopup("remove-event-participant-confirm");
            data.onSuccess?.();
        } else {
            setError("Failed to remove participant");
        }
    };

    return (
        <div className={css.popup}>
            <div className={css.popup_close}>
                <Icon
                    name="x"
                    className={css.popup_close_icon}
                    onClick={() =>
                        !isRemoving && closePopup("remove-event-participant-confirm")
                    }
                />
            </div>
            <div className={css.popup_content}>
                <h2>Remove participant</h2>

                {error && (
                    <div className={css.popup_error}>{error}</div>
                )}

                <p>
                    Remove <strong>{data.playerName}</strong> from this event?
                </p>

                <div className={css.popup_buttons}>
                    <button
                        className={cn(
                            css.popup_button,
                            css.popup_button_secondary
                        )}
                        onClick={() => closePopup("remove-event-participant-confirm")}
                        disabled={isRemoving}
                    >
                        Cancel
                    </button>
                    <button
                        className={cn(
                            css.popup_button,
                            css.popup_button_primary
                        )}
                        onClick={handleRemove}
                        disabled={isRemoving}
                        style={{
                            background: isRemoving ? "#6c757d" : "#dc3545",
                        }}
                    >
                        {isRemoving ? "Removing…" : "Remove"}
                    </button>
                </div>
            </div>
        </div>
    );
};
