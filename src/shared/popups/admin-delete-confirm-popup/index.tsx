"use client";

import React, { useState } from "react";
import css from "../styles.module.scss";
import { Icon } from "@/shared/ui/icons";
import { usePopup } from "@/shared/contexts/popup-context";
import cn from "classnames";

interface AdminDeleteConfirmPopupData {
    tableName: string;
    match: Record<string, string | number>;
    onConfirm: () => void;
}

export const AdminDeleteConfirmPopup: React.FC = () => {
    const { closePopup, getPopupData } = usePopup();
    const data = getPopupData("admin-delete-confirm") as AdminDeleteConfirmPopupData | undefined;
    const [isDeleting, setIsDeleting] = useState(false);
    const [error, setError] = useState<string | null>(null);

    if (!data) {
        return null;
    }

    const handleDelete = async () => {
        setIsDeleting(true);
        setError(null);

        try {
            const response = await fetch("/api/admin/table", {
                method: "DELETE",
                headers: { "Content-Type": "application/json" },
                body: JSON.stringify({
                    table: data.tableName,
                    match: data.match,
                }),
            });
            const json = await response.json();
            if (!response.ok) {
                setError(json?.error || "Delete failed");
                setIsDeleting(false);
                return;
            }

            data.onConfirm();
            closePopup("admin-delete-confirm");
        } catch (err: any) {
            setError(err.message || "Error deleting record");
            setIsDeleting(false);
        }
    };

    return (
        <div className={css.popup}>
            <div className={css.popup_close}>
                <Icon
                    name="x"
                    className={css.popup_close_icon}
                    onClick={() => !isDeleting && closePopup("admin-delete-confirm")}
                />
            </div>
            <div className={css.popup_content}>
                <h2>Confirm Deletion</h2>

                {error && (
                    <div className={css.popup_error}>
                        {error}
                    </div>
                )}

                <p>
                    Are you sure you want to delete this record from the <strong>{data.tableName}</strong> table?
                    <br />
                    <br />
                    This action cannot be undone.
                </p>

                <div className={css.popup_buttons}>
                    <button
                        className={cn(css.popup_button, css.popup_button_secondary)}
                        onClick={() => closePopup("admin-delete-confirm")}
                        disabled={isDeleting}
                    >
                        Cancel
                    </button>
                    <button
                        className={cn(css.popup_button, css.popup_button_primary)}
                        onClick={handleDelete}
                        disabled={isDeleting}
                        style={{ background: isDeleting ? "#6c757d" : "#dc3545" }}
                    >
                        {isDeleting ? "Deleting..." : "Delete"}
                    </button>
                </div>
            </div>
        </div>
    );
};

