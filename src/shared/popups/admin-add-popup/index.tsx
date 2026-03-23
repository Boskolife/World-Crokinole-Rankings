"use client";

import React, { useState, useRef, useEffect } from "react";
import css from "../styles.module.scss";
import { Icon } from "@/shared/ui/icons";
import { usePopup } from "@/shared/contexts/popup-context";
import { supabase } from "@/shared/supabase/client";
import cn from "classnames";
import dynamic from "next/dynamic";

const NEWS_IMAGES_BUCKET = "news-images";
const IMAGE_MAX_SIZE = 5 * 1024 * 1024;
const IMAGE_ACCEPT = "image/jpeg,image/png,image/gif,image/webp";
const ReactQuill = dynamic(() => import("react-quill-new"), { ssr: false });

interface AdminAddPopupData {
    tableName: string;
    columns: string[];
    sampleItem: any;
    onSave: () => void;
}

async function uploadNewsImage(file: File): Promise<string> {
    const ext = file.name.split(".").pop()?.toLowerCase() || "jpg";
    const path = `${Date.now()}-${Math.random().toString(36).slice(2, 11)}.${ext}`;
    const { error } = await supabase.storage.from(NEWS_IMAGES_BUCKET).upload(path, file, { upsert: true });
    if (error) throw error;
    const { data } = supabase.storage.from(NEWS_IMAGES_BUCKET).getPublicUrl(path);
    return data.publicUrl;
}

export const AdminAddPopup: React.FC = () => {
    const { closePopup, getPopupData } = usePopup();
    const data = getPopupData("admin-add") as AdminAddPopupData | undefined;
    const [formData, setFormData] = useState<any>({});
    const [isSaving, setIsSaving] = useState(false);
    const [error, setError] = useState<string | null>(null);
    const [imageUploading, setImageUploading] = useState(false);
    const [imageError, setImageError] = useState<string | null>(null);
    const fileInputRef = useRef<HTMLInputElement>(null);

    if (!data) {
        return null;
    }
    const isNews = data.tableName === "news";

    const getNewsLabel = (column: string): string => {
        const labels: Record<string, string> = {
            image: "Image",
            title: "Title",
            description: "Description",
            link: "Link URL",
            link_text: "Button text",
            sort_order: "Sort order",
        };
        return labels[column] ?? column;
    };

    const getNewsPlaceholder = (column: string): string => {
        const placeholders: Record<string, string> = {
            title: "Enter news title",
            description: "Enter short news description",
            link: "https://example.com/news",
            link_text: "Read more",
            sort_order: "0",
        };
        return placeholders[column] ?? "";
    };

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

    const isRichTextEmpty = (value: string | undefined): boolean => {
        if (!value) return true;
        const plainText = value.replace(/<[^>]*>/g, "").replace(/&nbsp;/g, " ").trim();
        return plainText.length === 0;
    };

    const handleSave = async () => {
        setIsSaving(true);
        setError(null);

        try {
            if (isNews) {
                if (!formData.title?.trim()) {
                    setError("Title is required");
                    setIsSaving(false);
                    return;
                }
                if (isRichTextEmpty(formData.description)) {
                    setError("Description is required");
                    setIsSaving(false);
                    return;
                }
                if (!formData.link?.trim()) {
                    setError("Link URL is required");
                    setIsSaving(false);
                    return;
                }
                if (!formData.link_text?.trim()) {
                    setError("Button text is required");
                    setIsSaving(false);
                    return;
                }
            }
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
            if (isNews && cleanedForm.link) {
                cleanedForm.link = String(cleanedForm.link).trim();
                if (!/^https?:\/\//i.test(cleanedForm.link)) {
                    cleanedForm.link = `https://${cleanedForm.link}`;
                }
            }

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
                            const fieldType = getFieldType(data.sampleItem?.[col], col);
                            const label = isNews ? getNewsLabel(col) : col;
                            return (
                                <div key={col} className={css.admin_form_field}>
                                    <label>{label}</label>
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
                                    ) : isNews && col === "description" ? (
                                        <div className={css.admin_rte}>
                                            <ReactQuill
                                                theme="snow"
                                                value={formData.description || ""}
                                                onChange={(value) =>
                                                    setFormData({
                                                        ...formData,
                                                        description: value,
                                                    })
                                                }
                                                placeholder={getNewsPlaceholder(col)}
                                                modules={{
                                                    toolbar: [
                                                        ["bold", "italic", "underline"],
                                                        [{ list: "ordered" }, { list: "bullet" }],
                                                        ["link"],
                                                        ["clean"],
                                                    ],
                                                }}
                                            />
                                        </div>
                                    ) : (
                                        <input
                                            type={fieldType}
                                            value={formData[col] || ""}
                                            placeholder={isNews ? getNewsPlaceholder(col) : ""}
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

