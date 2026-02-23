"use client";

import React, { useState } from "react";
import css from "../styles.module.scss";
import { Icon } from "@/shared/ui/icons";
import { usePopup } from "@/shared/contexts/popup-context";
import { deleteClubDiscountById } from "@/shared/supabase/data";
import { useRouter } from "next/navigation";
import cn from "classnames";
import type { IClub } from "@/shared/types";
import type { IClubDiscount } from "@/shared/supabase/data";

interface ClubDiscountDeleteConfirmPopupData {
    club: IClub;
    discount: IClubDiscount;
}

export const ClubDiscountDeleteConfirmPopup: React.FC = () => {
    const { closePopup, getPopupData } = usePopup();
    const router = useRouter();
    const data = getPopupData(
        "club-discount-delete-confirm"
    ) as ClubDiscountDeleteConfirmPopupData | undefined;
    const [isDeleting, setIsDeleting] = useState(false);
    const [error, setError] = useState<string | null>(null);

    if (!data) {
        return null;
    }

    const handleDelete = async () => {
        setIsDeleting(true);
        setError(null);

        try {
            const ok = await deleteClubDiscountById(data.discount.id);
            if (ok) {
                router.refresh();
                closePopup("club-discount-delete-confirm");
            } else {
                setError("Failed to delete discount");
            }
        } catch (err: unknown) {
            setError(
                err instanceof Error ? err.message : "Failed to delete"
            );
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
                        !isDeleting &&
                        closePopup("club-discount-delete-confirm")
                    }
                />
            </div>
            <div className={css.popup_content}>
                <h2>Remove Club Discount</h2>

                {error && (
                    <div className={css.popup_error}>{error}</div>
                )}

                <p>
                    Are you sure you want to remove the discount code{" "}
                    <strong>{data.discount.code}</strong>? This action cannot
                    be undone.
                </p>

                <div className={css.popup_buttons}>
                    <button
                        className={cn(
                            css.popup_button,
                            css.popup_button_secondary
                        )}
                        onClick={() =>
                            closePopup("club-discount-delete-confirm")
                        }
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
                        {isDeleting ? "Deleting..." : "Delete"}
                    </button>
                </div>
            </div>
        </div>
    );
};
