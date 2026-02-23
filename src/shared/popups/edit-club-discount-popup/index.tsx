"use client";

import React, { useState, useEffect } from "react";
import popupCss from "../styles.module.scss";
import css from "../create-club-popup/styles.module.scss";
import { Icon } from "@/shared/ui/icons";
import { usePopup } from "@/shared/contexts/popup-context";
import { Button } from "@/shared/ui";
import inputCss from "@/shared/ui/input/styles.module.scss";
import {
    createClubDiscount,
    updateClubDiscount,
} from "@/shared/supabase/data";
import { useRouter } from "next/navigation";
import cn from "classnames";
import type { IClub } from "@/shared/types";
import type { IClubDiscount } from "@/shared/supabase/data";

interface EditClubDiscountPopupData {
    club: IClub;
    discount: IClubDiscount | null;
}

const DEFAULT_DESCRIPTION =
    "Share this code with your club to get 10% off at BrownCastle Games. 5% club credit + 5% instant savings";

export const EditClubDiscountPopup: React.FC = () => {
    const { closePopup, isPopupOpen, getPopupData } = usePopup();
    const router = useRouter();
    const data = getPopupData(
        "edit-club-discount"
    ) as EditClubDiscountPopupData | undefined;

    const [code, setCode] = useState(data?.discount?.code ?? "");
    const [description, setDescription] = useState(
        data?.discount?.description ?? DEFAULT_DESCRIPTION
    );
    const [isSubmitting, setIsSubmitting] = useState(false);
    const [error, setError] = useState<string | null>(null);

    useEffect(() => {
        if (data?.discount) {
            setCode(data.discount.code);
            setDescription(
                data.discount.description || DEFAULT_DESCRIPTION
            );
        } else {
            setCode("");
            setDescription(DEFAULT_DESCRIPTION);
        }
    }, [data?.club?.id, data?.discount?.id]);

    if (!isPopupOpen("edit-club-discount") || !data?.club) {
        return null;
    }

    const handleClose = () => closePopup("edit-club-discount");

    const handleSubmit = async () => {
        setError(null);
        const trimmedCode = code.trim();
        if (!trimmedCode) {
            setError("Code is required");
            return;
        }
        setIsSubmitting(true);
        try {
            const payload = {
                code: trimmedCode,
                description: description.trim() || DEFAULT_DESCRIPTION,
            };
            const result = data.discount
                ? await updateClubDiscount(data.discount.id, payload)
                : await createClubDiscount(data.club.id, payload);
            if (result) {
                router.refresh();
                handleClose();
            } else {
                setError("Failed to save discount");
            }
        } catch (err: unknown) {
            setError(err instanceof Error ? err.message : "Failed to save");
        } finally {
            setIsSubmitting(false);
        }
    };

    return (
        <div className={cn(popupCss.popup, css.create_club_popup)}>
            <div className={css.create_club_layout}>
                <div className={css.create_club_header}>
                <h2 className={css.create_club_title}>
                    {data.discount ? "Edit Club Discount" : "Add Club Discount"}
                </h2>
                <button
                    type="button"
                    className={css.create_club_close}
                    onClick={handleClose}
                    disabled={isSubmitting}
                >
                    <Icon name="x" className={popupCss.popup_close_icon} />
                </button>
                </div>
                <div className={css.create_club_body}>
                {error && (
                    <div className={popupCss.popup_error}>{error}</div>
                )}
                <div className={css.create_club_content}>
                    <div className={inputCss.form_field}>
                        <label
                            className={inputCss.form_field_label}
                            htmlFor="club-discount-code"
                        >
                            Code
                        </label>
                        <input
                            id="club-discount-code"
                            type="text"
                            className={inputCss.form_field_input}
                            value={code}
                            onChange={(e) => setCode(e.target.value)}
                            placeholder="e.g. BCASTLE10"
                            disabled={isSubmitting}
                        />
                    </div>
                    <div className={inputCss.form_field}>
                        <label
                            className={inputCss.form_field_label}
                            htmlFor="club-discount-description"
                        >
                            Description
                        </label>
                        <textarea
                            id="club-discount-description"
                            className={cn(
                                inputCss.form_field_input,
                                css.create_club_description_input
                            )}
                            value={description}
                            onChange={(e) => setDescription(e.target.value)}
                            rows={3}
                            disabled={isSubmitting}
                        />
                    </div>
                </div>
                </div>
                <div className={css.create_club_footer}>
                    <Button
                        type="button"
                        buttonType="primary"
                        className={css.create_club_footer_btn}
                        onClick={handleClose}
                        disabled={isSubmitting}
                    >
                        Cancel
                    </Button>
                    <Button
                        type="button"
                        buttonType="secondary"
                        className={css.create_club_footer_btn}
                        onClick={handleSubmit}
                        disabled={isSubmitting}
                    >
                        {isSubmitting ? "Saving..." : "Save"}
                    </Button>
                </div>
            </div>
        </div>
    );
};
