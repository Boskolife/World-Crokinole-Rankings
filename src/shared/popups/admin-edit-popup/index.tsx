"use client";

import React, { useState, useEffect, useRef } from "react";
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
    match: Record<string, string | number>;
    item: any;
    columns: string[];
    columnTypes?: Record<string, string>;
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
                if (initialData[key] && typeof initialData[key] === "object") {
                    initialData[key] = JSON.stringify(initialData[key], null, 2);
                    return;
                }
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
    const isNews = data.tableName === "news";

    const getNewsLabel = (column: string): string => {
        const labels: Record<string, string> = {
            image: "Image",
            title: "Title",
            description: "Description",
            link: "Link URL",
            link_text: "Button text",
            sort_order: "Sort order",
            created_at: "Created at",
            id: "ID",
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

    const getFieldType = (value: any, columnName: string): string => {
        const explicitType = data.columnTypes?.[columnName];
        if (explicitType === "jsonb" || explicitType === "json") return "json";
        if (explicitType === "boolean" || explicitType === "bool") return "checkbox";
        if (explicitType === "smallint" || explicitType === "int2" || explicitType === "integer" || explicitType === "int4" || explicitType === "bigint" || explicitType === "int8" || explicitType === "numeric" || explicitType === "float4" || explicitType === "float8" || explicitType === "double precision") return "number";
        if (explicitType === "date") return "date";
        if (explicitType === "timestamp with time zone" || explicitType === "timestamptz" || explicitType === "timestamp without time zone" || explicitType === "timestamp") return "datetime-local";
        if (isNews && columnName === "created_at") return "date";
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
                const explicitType = data.columnTypes?.[key];
                if (cleanedForm[key] === "" && data.item[key] !== null && data.item[key] !== undefined) {
                    return;
                }
                if (
                    explicitType === "smallint" ||
                    explicitType === "int2" ||
                    explicitType === "integer" ||
                    explicitType === "int4" ||
                    explicitType === "bigint" ||
                    explicitType === "int8" ||
                    explicitType === "numeric" ||
                    explicitType === "float4" ||
                    explicitType === "float8" ||
                    explicitType === "double precision" ||
                    typeof data.item[key] === "number"
                ) {
                    cleanedForm[key] = Number(cleanedForm[key]);
                } else if (
                    explicitType === "boolean" ||
                    explicitType === "bool" ||
                    typeof data.item[key] === "boolean"
                ) {
                    cleanedForm[key] = cleanedForm[key] === "true" || cleanedForm[key] === true;
                } else if (
                    data.columnTypes?.[key] === "jsonb" ||
                    data.columnTypes?.[key] === "json"
                ) {
                    if (typeof cleanedForm[key] === "string" && cleanedForm[key].trim()) {
                        cleanedForm[key] = JSON.parse(cleanedForm[key]);
                    } else if (cleanedForm[key] === "") {
                        cleanedForm[key] = null;
                    }
                } else if (
                    explicitType === "date" ||
                    explicitType === "timestamp with time zone" ||
                    explicitType === "timestamptz" ||
                    explicitType === "timestamp without time zone" ||
                    explicitType === "timestamp" ||
                    key.includes("date") ||
                    key.includes("_at")
                ) {
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

            delete cleanedForm.id;
            const response = await fetch("/api/admin/table", {
                method: "PATCH",
                headers: { "Content-Type": "application/json" },
                body: JSON.stringify({
                    table: data.tableName,
                    payload: cleanedForm,
                    match: data.match,
                }),
            });
            const json = await response.json();
            if (!response.ok) {
                setError(json?.error || "Update failed");
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
                    {data.columns
                        .filter((col) => !(isNews && col === "id"))
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
                        const fieldType = getFieldType(data.item[col], col);
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
                                ) : fieldType === "json" ? (
                                    <textarea
                                        value={formData[col] || ""}
                                        onChange={(e) =>
                                            setFormData({
                                                ...formData,
                                                [col]: e.target.value,
                                            })
                                        }
                                        rows={8}
                                    />
                                ) : (
                                    <input
                                        type={fieldType}
                                        value={
                                            fieldType === "datetime-local" && formData[col]
                                                ? new Date(formData[col]).toISOString().slice(0, 16)
                                                : fieldType === "date" && formData[col]
                                                    ? new Date(formData[col]).toISOString().slice(0, 10)
                                                : formData[col] || ""
                                        }
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

