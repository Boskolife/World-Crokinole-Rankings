"use client";

import React, { useEffect } from "react";
import cn from "classnames";
import { usePopup } from "@/shared/contexts/popup-context";
import css from "./styles.module.scss";
import { VerifyPopup } from "./verify-popup";
import { VerifyCodePopup } from "./verify-code-popup";
import { LinkedPopup } from "./linked-popup";
import { ManualReviewPopup } from "./manual-review-popup";
import { AdminEditPopup } from "./admin-edit-popup";
import { AdminAddPopup } from "./admin-add-popup";
import { AdminDeleteConfirmPopup } from "./admin-delete-confirm-popup";
import { JoinTournamentPopup } from "./join-tournament-popup";
import { CreateClubPopup } from "./create-club-popup";
import { EditClubPopup } from "./edit-club-popup";
import { EditClubDiscountPopup } from "./edit-club-discount-popup";
import { ClubDiscountDeleteConfirmPopup } from "./club-discount-delete-confirm-popup";
import { ClubJoinRequestsPopup } from "./club-join-requests-popup";

export const PopupContainer: React.FC = () => {
    const { isPopupOpen, openPopups, closeAllPopups } = usePopup();
    const hasOpenPopups = openPopups.size > 0;

    useEffect(() => {
        if (hasOpenPopups) {
            const scrollbarWidth =
                window.innerWidth - document.documentElement.clientWidth;
            const scrollY = window.scrollY;
            document.documentElement.style.overflow = "hidden";
            document.body.style.overflow = "hidden";
            document.body.style.position = "fixed";
            document.body.style.top = `-${scrollY}px`;
            document.body.style.left = "0";
            document.body.style.right = "0";
            document.body.style.paddingRight = `${scrollbarWidth}px`;
            return () => {
                document.documentElement.style.overflow = "";
                document.body.style.overflow = "";
                document.body.style.position = "";
                document.body.style.top = "";
                document.body.style.left = "";
                document.body.style.right = "";
                document.body.style.paddingRight = "";
                window.scrollTo(0, scrollY);
            };
        }
        return () => {};
    }, [hasOpenPopups]);

    const handleBackdropClick = (e: React.MouseEvent<HTMLDivElement>) => {
        if (e.target === e.currentTarget) {
            closeAllPopups();
        }
    };

    if (!hasOpenPopups) {
        return null;
    }

    return (
        <div className={css.popup_backdrop} onClick={handleBackdropClick}>
            <div
                className={cn(
                    css.popup_container,
                    (isPopupOpen("create-club") || isPopupOpen("edit-club")) &&
                    cn(css.popup_container_no_scroll, css.popup_container_fixed_height)
                )}
            >
                {isPopupOpen("verify") && <VerifyPopup />}
                {isPopupOpen("verify-code") && <VerifyCodePopup />}
                {isPopupOpen("linked") && <LinkedPopup />}
                {isPopupOpen("manual-review") && <ManualReviewPopup />}
                {isPopupOpen("admin-edit") && <AdminEditPopup />}
                {isPopupOpen("admin-add") && <AdminAddPopup />}
                {isPopupOpen("admin-delete-confirm") && <AdminDeleteConfirmPopup />}
                {isPopupOpen("join-tournament") && <JoinTournamentPopup />}
                {isPopupOpen("create-club") && <CreateClubPopup />}
                {isPopupOpen("edit-club") && <EditClubPopup />}
                {isPopupOpen("edit-club-discount") && (
                    <EditClubDiscountPopup />
                )}
                {isPopupOpen("club-discount-delete-confirm") && (
                    <ClubDiscountDeleteConfirmPopup />
                )}
                {isPopupOpen("club-join-requests") && (
                    <ClubJoinRequestsPopup />
                )}
            </div>
        </div>
    );
};
