"use client";

import React, { useState } from "react";
import css from "../styles.module.scss";
import { Icon } from "@/shared/ui/icons";
import { usePopup } from "@/shared/contexts/popup-context";
import { useAuth } from "@/shared/hooks/use-auth";
import { leaveClub } from "@/shared/supabase/data";
import cn from "classnames";
import type { IClub } from "@/shared/types";

interface LeaveClubConfirmPopupData {
    club: IClub;
    onLeft?: () => void | Promise<void>;
}

export const LeaveClubConfirmPopup: React.FC = () => {
    const { closePopup, getPopupData } = usePopup();
    const { user } = useAuth();
    const data = getPopupData("leave-club-confirm") as LeaveClubConfirmPopupData | undefined;
    const [isLeaving, setIsLeaving] = useState(false);
    const [error, setError] = useState<string | null>(null);

    if (!data) {
        return null;
    }

    const handleLeave = async () => {
        if (!user?.id) return;
        setIsLeaving(true);
        setError(null);
        try {
            const ok = await leaveClub(data.club.id, data.club.title);
            if (ok) {
                closePopup("leave-club-confirm");
                await data.onLeft?.();
            } else {
                setError("Failed to leave the club.");
            }
        } catch (err: unknown) {
            setError(err instanceof Error ? err.message : "Failed to leave");
        } finally {
            setIsLeaving(false);
        }
    };

    return (
        <div className={css.popup}>
            <div className={css.popup_close}>
                <Icon
                    name="x"
                    className={css.popup_close_icon}
                    onClick={() =>
                        !isLeaving && closePopup("leave-club-confirm")
                    }
                />
            </div>
            <div className={css.popup_content}>
                <h2>Leave the club</h2>

                {error && (
                    <div className={css.popup_error}>{error}</div>
                )}

                <p>
                    Are you sure you want to leave <strong>{data.club.title}</strong>? You can request to join again later.
                </p>

                <div className={css.popup_buttons}>
                    <button
                        className={cn(
                            css.popup_button,
                            css.popup_button_secondary
                        )}
                        onClick={() => closePopup("leave-club-confirm")}
                        disabled={isLeaving}
                    >
                        Cancel
                    </button>
                    <button
                        className={cn(
                            css.popup_button,
                            css.popup_button_primary
                        )}
                        onClick={handleLeave}
                        disabled={isLeaving}
                    >
                        {isLeaving ? "Leaving…" : "Leave the club"}
                    </button>
                </div>
            </div>
        </div>
    );
};
