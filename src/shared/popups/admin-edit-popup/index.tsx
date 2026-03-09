"use client";

import React, { useState, useEffect, useRef } from "react";
import css from "../styles.module.scss";
import { Icon } from "@/shared/ui/icons";
import { usePopup } from "@/shared/contexts/popup-context";
import { supabase } from "@/shared/supabase/client";
import cn from "classnames";

const NEWS_IMAGES_BUCKET = "news-images";
const IMAGE_MAX_SIZE = 5 * 1024 * 1024;
const IMAGE_ACCEPT = "image/jpeg,image/png,image/gif,image/webp";

async function uploadNewsImage(file: File): Promise<string> {
    const ext = file.name.split(".").pop()?.toLowerCase() || "jpg";
    const path = `${Date.now()}-${Math.random().toString(36).slice(2, 11)}.${ext}`;
    const { error } = await supabase.storage.from(NEWS_IMAGES_BUCKET).upload(path, file, { upsert: true });
    if (error) throw error;
    const { data } = supabase.storage.from(NEWS_IMAGES_BUCKET).getPublicUrl(path);
    return data.publicUrl;
}

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
    const [imageUploading, setImageUploading] = useState(false);
    const [imageError, setImageError] = useState<string | null>(null);
    const fileInputRef = useRef<HTMLInputElement>(null);

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

    const handleImageFileChange = async (e: React.ChangeEvent<HTMLInputElement>) => {
        const file = e.target.files?.[0];
        if (!file) return;
        setImageError(null);
        if (file.size > IMAGE_MAX_SIZE) {
            setImageError("Max size 5 MB");
            return;
        }
        if (!IMAGE_ACCEPT.split(",").some((m) => file.type === m.trim())) {
            setImageError("Only JPEG, PNG, GIF, WebP");
            return;
        }
        setImageUploading(true);
        try {
            const url = await uploadNewsImage(file);
            setFormData({ ...formData, image: url });
        } catch (err: any) {
            setImageError(err?.message || "Upload failed");
        } finally {
            setImageUploading(false);
            e.target.value = "";
        }
    };

    const handleRemoveImage = () => {
        setFormData({ ...formData, image: "" });
        setImageError(null);
        if (fileInputRef.current) fileInputRef.current.value = "";
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
                        if (data.tableName === "news" && col === "image") {
                            return (
                                <div key={col} className={css.admin_form_field}>
                                    <label>{col}</label>
                                    <div className={css.admin_image_upload}>
                                        <input
                                            ref={fileInputRef}
                                            type="file"
                                            accept={IMAGE_ACCEPT}
                                            style={{ display: "none" }}
                                            onChange={handleImageFileChange}
                                            disabled={imageUploading}
                                        />
                                        {formData.image ? (
                                            <>
                                                <img
                                                    src={formData.image}
                                                    alt="Preview"
                                                    className={css.admin_image_preview}
                                                />
                                                <div className={css.admin_image_actions}>
                                                    <button
                                                        type="button"
                                                        className={css.admin_image_upload_btn}
                                                        onClick={() => fileInputRef.current?.click()}
                                                        disabled={imageUploading}
                                                    >
                                                        {imageUploading ? "Uploading..." : "Change"}
                                                    </button>
                                                    <button
                                                        type="button"
                                                        className={css.admin_image_remove_btn}
                                                        onClick={handleRemoveImage}
                                                        disabled={imageUploading}
                                                    >
                                                        Remove
                                                    </button>
                                                </div>
                                            </>
                                        ) : (
                                            <button
                                                type="button"
                                                className={css.admin_image_upload_btn}
                                                onClick={() => fileInputRef.current?.click()}
                                                disabled={imageUploading}
                                            >
                                                {imageUploading ? "Uploading..." : "Choose image"}
                                            </button>
                                        )}
                                        {imageError && (
                                            <span className={css.admin_image_error}>{imageError}</span>
                                        )}
                                    </div>
                                </div>
                            );
                        }
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

