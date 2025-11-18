"use client";

import React, { useEffect } from "react";
import { usePopup } from "@/shared/contexts/popup-context";
import { VerifyPopup } from "./verify-popup";
import css from "./styles.module.scss";

export const PopupContainer: React.FC = () => {
    const { isPopupOpen, openPopups, closeAllPopups } = usePopup();
    const hasOpenPopups = openPopups.size > 0;

    useEffect(() => {
        if (hasOpenPopups) {
            const scrollbarWidth =
                window.innerWidth - document.documentElement.clientWidth;
            document.body.style.overflow = "hidden";
            document.body.style.paddingRight = `${scrollbarWidth}px`;
        } else {
            document.body.style.overflow = "";
            document.body.style.paddingRight = "";
        }

        return () => {
            document.body.style.overflow = "";
            document.body.style.paddingRight = "";
        };
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
            <div className={css.popup_container}>
                {isPopupOpen("verify") && <VerifyPopup />}
            </div>
        </div>
    );
};
