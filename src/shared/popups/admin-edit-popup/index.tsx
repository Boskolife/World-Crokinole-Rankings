"use client";

import React, { useState, useEffect } from "react";
import css from "../styles.module.scss";
import { Icon } from "@/shared/ui/icons";
import { usePopup } from "@/shared/contexts/popup-context";
import { supabase } from "@/shared/supabase/client";
import cn from "classnames";

interface AdminEditPopupData {
    tableName: string;
    item: any;
    columns: string[];
    onSave: () => void;
}

export const AdminEditPopup: React.FC = () => {
    const { closePopup, getPopupData } = usePopup();
    const data = getPopupData("admin-edit") as AdminEditPopupData | undefined;
    const [formData, setFormData] = useState<any>({});
    const [isSaving, setIsSaving] = useState(false);
    const [error, setError] = useState<string | null>(null);

    useEffect(() => {
        if (data?.item) {
            const initialData: any = { ...data.item };
            Object.keys(initialData).forEach((key) => {
                if (typeof initialData[key] === "string" && initialData[key].includes("T") && initialData[key].includes("Z")) {
                    const date = new Date(initialData[key]);
                    initialData[key] = date.toISOString().slice(0, 16);
                }
            });
            setFormData(initialData);
        }
    }, [data]);

    if (!data) {
        return null;
    }

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
                if (cleanedForm[key] === "" && data.item[key] !== null && data.item[key] !== undefined) {
                    return;
                }
                if (typeof data.item[key] === "number" && cleanedForm[key] !== "" && cleanedForm[key] !== null) {
                    cleanedForm[key] = Number(cleanedForm[key]);
                } else if (typeof data.item[key] === "boolean" && cleanedForm[key] !== undefined) {
                    cleanedForm[key] = cleanedForm[key] === "true" || cleanedForm[key] === true;
                } else if (key.includes("date") || key.includes("_at")) {
                    if (cleanedForm[key]) {
                        cleanedForm[key] = new Date(cleanedForm[key]).toISOString();
                    }
                }
            });

            const { error: updateError } = await supabase
                .from(data.tableName)
                .update(cleanedForm)
                .eq("id", data.item.id);

            if (updateError) {
                setError(updateError.message);
                return;
            }

            data.onSave();
            closePopup("admin-edit");
        } catch (err: any) {
            setError(err.message || "Error updating record");
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
                    onClick={() => closePopup("admin-edit")}
                />
            </div>
            <div className={css.popup_content}>
                <h2>Edit Record</h2>

                {error && (
                    <div className={css.popup_error}>
                        {error}
                    </div>
                )}

                <div className={css.admin_form}>
                    {data.columns.map((col) => {
                        const fieldType = getFieldType(data.item[col], col);
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
                                        value={
                                            fieldType === "datetime-local" && formData[col]
                                                ? new Date(formData[col]).toISOString().slice(0, 16)
                                                : formData[col] || ""
                                        }
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
                        onClick={() => closePopup("admin-edit")}
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

