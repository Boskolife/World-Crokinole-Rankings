"use client";

import { useEffect, useRef, useState, type ChangeEvent } from "react";
import dynamic from "next/dynamic";
import { useParams, useRouter } from "next/navigation";
import { supabase } from "@/shared/supabase/client";
import { useAuth, useUserProfile } from "@/shared/hooks";
import { localeConfig } from "@/app/localization/config";
import css from "./news-form-page.module.scss";

const ReactQuill = dynamic(() => import("react-quill-new"), { ssr: false });

const NEWS_IMAGES_BUCKET = "news-images";
const IMAGE_MAX_SIZE = 5 * 1024 * 1024;
const IMAGE_ACCEPT = "image/jpeg,image/png,image/gif,image/webp";

type NewsForm = {
    image: string;
    title: string;
    description: string;
    link_text: string;
    sort_order: number;
    created_at: string;
};

type NewsFormPageProps = {
    mode: "create" | "edit";
};

async function uploadNewsImage(file: File): Promise<string> {
    const ext = file.name.split(".").pop()?.toLowerCase() || "jpg";
    const path = `${Date.now()}-${Math.random().toString(36).slice(2, 11)}.${ext}`;
    const { error } = await supabase.storage.from(NEWS_IMAGES_BUCKET).upload(path, file, { upsert: true });
    if (error) throw error;
    const { data } = supabase.storage.from(NEWS_IMAGES_BUCKET).getPublicUrl(path);
    return data.publicUrl;
}

export function NewsFormPage({ mode }: NewsFormPageProps) {
    const { isAuth, isMounted, user, logout } = useAuth();
    const { profile, isLoading: profileLoading } = useUserProfile();
    const router = useRouter();
    const params = useParams() as { locale?: string; id?: string };
    const locale = params?.locale ?? localeConfig.defaultLocale;
    const id = Number(params?.id);
    const isEdit = mode === "edit";

    const [loading, setLoading] = useState(isEdit);
    const [saving, setSaving] = useState(false);
    const [uploading, setUploading] = useState(false);
    const [error, setError] = useState<string | null>(null);
    const [success, setSuccess] = useState<string | null>(null);
    const fileInputRef = useRef<HTMLInputElement>(null);

    const [form, setForm] = useState<NewsForm>({
        image: "",
        title: "",
        description: "",
        link_text: "Read more",
        sort_order: 0,
        created_at: new Date().toISOString().slice(0, 10),
    });

    useEffect(() => {
        if (isMounted && !isAuth) {
            router.push(`/${locale}/admin/sign-in`);
        }
    }, [isMounted, isAuth, locale, router]);

    useEffect(() => {
        if (!isEdit) return;
        const load = async () => {
            if (!Number.isFinite(id)) {
                setError("Invalid news id");
                setLoading(false);
                return;
            }

            const { data, error: loadError } = await supabase
                .from("news")
                .select("image, title, description, link_text, sort_order, created_at")
                .eq("id", id)
                .single();

            if (loadError || !data) {
                setError(loadError?.message || "News not found");
                setLoading(false);
                return;
            }

            setForm({
                image: data.image || "",
                title: data.title || "",
                description: data.description || "",
                link_text: data.link_text || "",
                sort_order: Number(data.sort_order || 0),
                created_at: data.created_at ? new Date(data.created_at).toISOString().slice(0, 10) : "",
            });
            setLoading(false);
        };
        load();
    }, [id, isEdit]);

    const isRichTextEmpty = (value: string | undefined): boolean => {
        if (!value) return true;
        const plainText = value.replace(/<[^>]*>/g, "").replace(/&nbsp;/g, " ").trim();
        return plainText.length === 0;
    };

    const onUploadImage = async (e: ChangeEvent<HTMLInputElement>) => {
        const file = e.target.files?.[0];
        if (!file) return;
        setError(null);

        if (file.size > IMAGE_MAX_SIZE) {
            setError("Max size 5 MB");
            return;
        }
        if (!IMAGE_ACCEPT.split(",").some((m) => file.type === m.trim())) {
            setError("Only JPEG, PNG, GIF, WebP");
            return;
        }

        setUploading(true);
        try {
            const url = await uploadNewsImage(file);
            setForm((prev) => ({ ...prev, image: url }));
        } catch (err: any) {
            setError(err?.message || "Upload failed");
        } finally {
            setUploading(false);
            e.target.value = "";
        }
    };

    const validate = (): boolean => {
        if (!form.title.trim()) {
            setError("Title is required");
            return false;
        }
        if (isRichTextEmpty(form.description)) {
            setError("Description is required");
            return false;
        }
        if (!form.link_text.trim()) {
            setError("Button text is required");
            return false;
        }
        return true;
    };

    const buildPayload = (autoLink: string) => ({
        image: form.image || null,
        title: form.title.trim(),
        description: form.description,
        link: autoLink,
        link_text: form.link_text.trim(),
        sort_order: Number(form.sort_order) || 0,
        created_at: form.created_at ? new Date(form.created_at).toISOString() : null,
    });

    const onSave = async () => {
        setSaving(true);
        setError(null);
        setSuccess(null);

        if (!validate()) {
            setSaving(false);
            return;
        }

        if (isEdit) {
            const payload = buildPayload(`/news/${id}`);
            const { error: updateError } = await supabase
                .from("news")
                .update(payload)
                .eq("id", id);

            if (updateError) {
                setError(updateError.message);
                setSaving(false);
                return;
            }
            setSuccess("Saved");
            setSaving(false);
            return;
        }

        const { data: inserted, error: insertError } = await supabase
            .from("news")
            .insert([buildPayload("#")])
            .select("id")
            .single();

        if (insertError) {
            setError(insertError.message);
            setSaving(false);
            return;
        }

        await supabase
            .from("news")
            .update({ link: `/news/${inserted.id}` })
            .eq("id", inserted.id);

        setSaving(false);
        router.push(`/${locale}/admin/news/${inserted.id}/edit`);
    };

    if (!isMounted || profileLoading || loading) {
        return <div className={css.loading}>Loading...</div>;
    }

    if (!profile?.is_admin) {
        return <div className={css.loading}>You do not have access to this page.</div>;
    }

    return (
        <div className={css.page}>
            <div className={css.header}>
                <h1 className={css.headerTitle}>Admin Panel</h1>
                <div className={css.headerRight}>
                    <span className={css.userInfo}>{user?.email}</span>
                    <button
                        type="button"
                        className={css.logoutButton}
                        onClick={async () => {
                            await logout();
                            router.push(`/${locale}/admin/sign-in`);
                        }}
                    >
                        Logout
                    </button>
                </div>
            </div>

            <div className={css.shell}>
                <div className={css.pageTop}>
                    <div>
                        <h2 className={css.pageTitle}>{isEdit ? "Edit News" : "Create News"}</h2>
                        <p className={css.pageSubtitle}>Manage What’s New block content</p>
                    </div>
                    <button
                        type="button"
                        className={css.backButton}
                        onClick={() => router.push(`/${locale}/admin?section=news`)}
                    >
                        Back to News
                    </button>
                </div>

                {error && <div className={css.error}>{error}</div>}
                {success && <div className={css.success}>{success}</div>}

                <div className={css.grid}>
                    <div className={css.mainCard}>
                        <div className={css.field}>
                            <label>Title</label>
                            <input value={form.title} onChange={(e) => setForm((p) => ({ ...p, title: e.target.value }))} />
                        </div>

                        <div className={css.field}>
                            <label>Description</label>
                            <div className={css.rte}>
                                <ReactQuill
                                    theme="snow"
                                    value={form.description}
                                    onChange={(value) => setForm((p) => ({ ...p, description: value }))}
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
                        </div>
                    </div>

                    <div className={css.sideCard}>
                        <div className={css.field}>
                            <label>Image</label>
                            <input
                                ref={fileInputRef}
                                type="file"
                                accept={IMAGE_ACCEPT}
                                style={{ display: "none" }}
                                onChange={onUploadImage}
                                disabled={uploading}
                            />
                            {form.image ? (
                                <>
                                    <img src={form.image} alt="" className={css.imagePreview} />
                                    <div className={css.imageActions}>
                                        <button type="button" className={css.secondaryBtn} onClick={() => fileInputRef.current?.click()} disabled={uploading}>
                                            {uploading ? "Uploading..." : "Change"}
                                        </button>
                                        <button type="button" className={css.dangerBtn} onClick={() => setForm((p) => ({ ...p, image: "" }))} disabled={uploading}>
                                            Remove
                                        </button>
                                    </div>
                                </>
                            ) : (
                                <button type="button" className={css.secondaryBtn} onClick={() => fileInputRef.current?.click()} disabled={uploading}>
                                    {uploading ? "Uploading..." : "Choose image"}
                                </button>
                            )}
                        </div>

                        <div className={css.field}>
                            <label>Button text</label>
                            <input value={form.link_text} onChange={(e) => setForm((p) => ({ ...p, link_text: e.target.value }))} />
                        </div>

                        <div className={css.metaRow}>
                            <div className={css.field}>
                                <label>Sort order</label>
                                <input
                                    type="number"
                                    value={form.sort_order}
                                    onChange={(e) => setForm((p) => ({ ...p, sort_order: Number(e.target.value) }))}
                                />
                            </div>
                            <div className={css.field}>
                                <label>Created at</label>
                                <input
                                    type="date"
                                    value={form.created_at}
                                    onChange={(e) => setForm((p) => ({ ...p, created_at: e.target.value }))}
                                />
                            </div>
                        </div>
                    </div>
                </div>

                <div className={css.actions}>
                    <button type="button" className={css.saveButton} onClick={onSave} disabled={saving}>
                        {saving ? "Saving..." : isEdit ? "Save changes" : "Create news"}
                    </button>
                </div>
            </div>
        </div>
    );
}
