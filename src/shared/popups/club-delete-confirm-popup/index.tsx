"use client";

import React, { useState } from "react";
import css from "../styles.module.scss";
import { Icon } from "@/shared/ui/icons";
import { usePopup } from "@/shared/contexts/popup-context";
import { useAuth } from "@/shared/hooks/use-auth";
import { deleteClub } from "@/shared/supabase/data";
import { useRouter } from "next/navigation";
import cn from "classnames";
import type { IClub } from "@/shared/types";

interface ClubDeleteConfirmPopupData {
    club: IClub;
}

export const ClubDeleteConfirmPopup: React.FC = () => {
    const { closePopup, getPopupData } = usePopup();
    const { user } = useAuth();
    const router = useRouter();
    const data = getPopupData("club-delete-confirm") as ClubDeleteConfirmPopupData | undefined;
    const [isDeleting, setIsDeleting] = useState(false);
    const [error, setError] = useState<string | null>(null);

    if (!data) {
        return null;
    }

    const handleDelete = async () => {
        setIsDeleting(true);
        setError(null);

        try {
            if (!user?.id) {
                setError("You must be signed in to delete the club.");
                return;
            }
            const ok = await deleteClub(data.club.id, user.id);
            if (ok) {
                closePopup("club-delete-confirm");
                router.push("/clubs");
                router.refresh();
            } else {
                setError("You can only delete a club if you are the owner.");
            }
        } catch (err: unknown) {
            setError(err instanceof Error ? err.message : "Failed to delete");
        } finally {
            setIsDeleting(false);
        }
    };

    return (
        <div className={css.popup}>
            <div className={css.popup_close}>
                <Icon
                    name="x"
                    className={css.popup_close_icon}
                    onClick={() =>
                        !isDeleting && closePopup("club-delete-confirm")
                    }
                />
            </div>
            <div className={css.popup_content}>
                <h2>Delete Club</h2>

                {error && (
                    <div className={css.popup_error}>{error}</div>
                )}

                <p>
                    Are you sure you want to delete the club{" "}
                    <strong>{data.club.title}</strong>? All members will be
                    removed and this action cannot be undone.
                </p>

                <div className={css.popup_buttons}>
                    <button
                        className={cn(
                            css.popup_button,
                            css.popup_button_secondary
                        )}
                        onClick={() => closePopup("club-delete-confirm")}
                        disabled={isDeleting}
                    >
                        Cancel
                    </button>
                    <button
                        className={cn(
                            css.popup_button,
                            css.popup_button_primary
                        )}
                        onClick={handleDelete}
                        disabled={isDeleting}
                        style={{
                            background: isDeleting ? "#6c757d" : "#dc3545",
                        }}
                    >
                        {isDeleting ? "Deleting..." : "Delete club"}
                    </button>
                </div>
            </div>
        </div>
    );
};
