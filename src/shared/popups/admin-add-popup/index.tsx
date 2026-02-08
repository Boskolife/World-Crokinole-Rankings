"use client";

import React, { useState, useEffect } from "react";
import css from "../styles.module.scss";
import { Icon } from "@/shared/ui/icons";
import { usePopup } from "@/shared/contexts/popup-context";
import { supabase } from "@/shared/supabase/client";
import cn from "classnames";

interface AdminAddPopupData {
    tableName: string;
    columns: string[];
    sampleItem: any;
    onSave: () => void;
}

export const AdminAddPopup: React.FC = () => {
    const { closePopup, getPopupData } = usePopup();
    const data = getPopupData("admin-add") as AdminAddPopupData | undefined;
    const [formData, setFormData] = useState<any>({});
    const [isSaving, setIsSaving] = useState(false);
    const [error, setError] = useState<string | null>(null);

    if (!data) {
        return null;
    }

    const shouldHideInAddForm = (columnName: string): boolean => {
        const hiddenFields = ["id", "created_at", "updated_at"];
        return hiddenFields.includes(columnName);
    };

    const getFieldType = (value: any, columnName: string): string => {
        if (value === null || value === undefined) return "text";
        if (typeof value === "boolean") return "checkbox";
        if (typeof value === "number") return "number";
        if (columnName.includes("date") || columnName.includes("_at")) return "datetime-local";
        if (columnName.includes("email")) return "email";
        if (columnName.includes("url")) return "url";
        return "text";
    };

    const handleSave = async () => {
        setIsSaving(true);
        setError(null);

        try {
            const cleanedForm = { ...formData };
            Object.keys(cleanedForm).forEach((key) => {
                if (cleanedForm[key] === "" || cleanedForm[key] === null) {
                    delete cleanedForm[key];
                } else if (typeof data.sampleItem?.[key] === "number" && cleanedForm[key]) {
                    cleanedForm[key] = Number(cleanedForm[key]);
                } else if (typeof data.sampleItem?.[key] === "boolean" && cleanedForm[key] !== undefined) {
                    cleanedForm[key] = cleanedForm[key] === "true" || cleanedForm[key] === true;
                } else if (key.includes("date") || key.includes("_at")) {
                    if (cleanedForm[key]) {
                        cleanedForm[key] = new Date(cleanedForm[key]).toISOString();
                    }
                }
            });

            const { error: insertError } = await supabase
                .from(data.tableName)
                .insert([cleanedForm]);

            if (insertError) {
                setError(insertError.message);
                return;
            }

            data.onSave();
            closePopup("admin-add");
            setFormData({});
        } catch (err: any) {
            setError(err.message || "Error adding record");
        } finally {
            setIsSaving(false);
        }
    };

    return (
        <div className={css.popup}>
            <div className={css.popup_close}>
                <Icon
                    name="x"
                    className={css.popup_close_icon}
                    onClick={() => closePopup("admin-add")}
                />
            </div>
            <div className={css.popup_content}>
                <h2>Add Record</h2>
                
                {error && (
                    <div className={css.popup_error}>
                        {error}
                    </div>
                )}

                <div className={css.admin_form}>
                    {data.columns
                        .filter((col) => !shouldHideInAddForm(col))
                        .map((col) => {
                            const fieldType = getFieldType(data.sampleItem?.[col], col);
                            return (
                                <div key={col} className={css.admin_form_field}>
                                    <label>{col}</label>
                                    {fieldType === "checkbox" ? (
                                        <input
                                            type="checkbox"
                                            checked={formData[col] || false}
                                            onChange={(e) =>
                                                setFormData({
                                                    ...formData,
                                                    [col]: e.target.checked,
                                                })
                                            }
                                        />
                                    ) : (
                                        <input
                                            type={fieldType}
                                            value={formData[col] || ""}
                                            onChange={(e) =>
                                                setFormData({
                                                    ...formData,
                                                    [col]: e.target.value,
                                                })
                                            }
                                        />
                                    )}
                                </div>
                            );
                        })}
                </div>

                <div className={css.popup_buttons}>
                    <button
                        className={cn(css.popup_button, css.popup_button_secondary)}
                        onClick={() => closePopup("admin-add")}
                        disabled={isSaving}
                    >
                        Cancel
                    </button>
                    <button
                        className={cn(css.popup_button, css.popup_button_primary)}
                        onClick={handleSave}
                        disabled={isSaving}
                    >
                        {isSaving ? "Saving..." : "Save"}
                    </button>
                </div>
            </div>
        </div>
    );
};

