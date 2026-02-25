"use client";

import React, { useState } from "react";
import css from "../styles.module.scss";
import { Icon } from "@/shared/ui/icons";
import { usePopup } from "@/shared/contexts/popup-context";
import cn from "classnames";
import type { IClub } from "@/shared/types";
import type { IClubMember } from "@/shared/supabase/data";

interface RemoveMemberConfirmPopupData {
    club: IClub;
    member: IClubMember;
    onConfirm?: () => void | Promise<void>;
}

export const RemoveMemberConfirmPopup: React.FC = () => {
    const { closePopup, getPopupData } = usePopup();
    const data = getPopupData("remove-member-confirm") as RemoveMemberConfirmPopupData | undefined;
    const [isRemoving, setIsRemoving] = useState(false);
    const [error, setError] = useState<string | null>(null);

    if (!data) {
        return null;
    }

    const handleRemove = async () => {
        setIsRemoving(true);
        setError(null);
        try {
            await data.onConfirm?.();
            closePopup("remove-member-confirm");
        } catch (err: unknown) {
            setError(err instanceof Error ? err.message : "Failed to remove");
        } finally {
            setIsRemoving(false);
        }
    };

    return (
        <div className={css.popup}>
            <div className={css.popup_close}>
                <Icon
                    name="x"
                    className={css.popup_close_icon}
                    onClick={() =>
                        !isRemoving && closePopup("remove-member-confirm")
                    }
                />
            </div>
            <div className={css.popup_content}>
                <h2>Remove member</h2>

                {error && (
                    <div className={css.popup_error}>{error}</div>
                )}

                <p>
                    Remove <strong>{data.member.name}</strong> from <strong>{data.club.title}</strong>? This cannot be undone.
                </p>

                <div className={css.popup_buttons}>
                    <button
                        className={cn(
                            css.popup_button,
                            css.popup_button_secondary
                        )}
                        onClick={() => closePopup("remove-member-confirm")}
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
                        {isRemoving ? "Removing…" : "Remove Member"}
                    </button>
                </div>
            </div>
        </div>
    );
};
