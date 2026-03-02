"use client";

import React, { useState, useRef, useEffect } from "react";
import Link from "next/link";
import { useRouter, useParams } from "next/navigation";
import { useForm } from "react-hook-form";
import { FormField, TextareaField, CustomDropdown } from "@/shared/ui";
import { Icon } from "@/shared/ui/icons";
import { createEvent } from "@/shared/supabase/data";
import {
    isSupabaseConfigured,
    supabaseConfigError,
} from "@/shared/supabase/client";
import {
    formatOptions,
    eventTypeOptions,
    needToRegisterOptions,
} from "@/shared/constants/dropdown-options";
import inputCss from "@/shared/ui/input/styles.module.scss";
import css from "./styles.module.scss";
import { localeConfig } from "@/app/localization/config";

const COVER_MAX_SIZE = 5 * 1024 * 1024;
const COVER_ACCEPT = ".png,.jpeg,.jpg";

type CreateEventFormValues = {
    title: string;
    startDateTime: string;
    endDateTime: string;
    location: string;
    eventType: string;
    format: string;
    additionalInfo: string;
    fee: string;
    capacity: string;
    needToRegister: string;
};

const defaultValues: CreateEventFormValues = {
    title: "",
    startDateTime: "",
    endDateTime: "",
    location: "",
    eventType: "ranked",
    format: "singles_or_doubles",
    additionalInfo: "",
    fee: "",
    capacity: "",
    needToRegister: "no",
};

type CreateEventFormProps = {
    backLinkHref?: string;
    backLinkLabel?: string;
    successRedirect?: string;
};

export function CreateEventForm({
    backLinkHref,
    backLinkLabel,
    successRedirect,
}: CreateEventFormProps) {
    const router = useRouter();
    const params = useParams() as { locale?: string };
    const locale = params?.locale ?? localeConfig.defaultLocale;

    const {
        register,
        handleSubmit: formHandleSubmit,
        watch,
        formState: { errors },
    } = useForm<CreateEventFormValues>({ defaultValues });

    const watchedEventType = watch("eventType");
    const watchedFormat = watch("format");
    const watchedNeedToRegister = watch("needToRegister");

    const [coverFile, setCoverFile] = useState<File | null>(null);
    const [coverPreviewUrl, setCoverPreviewUrl] = useState<string | null>(null);
    const [coverError, setCoverError] = useState<string | null>(null);
    const [submitError, setSubmitError] = useState<string | null>(null);
    const [isSubmitting, setIsSubmitting] = useState(false);
    const fileInputRef = useRef<HTMLInputElement>(null);

    useEffect(() => {
        if (coverFile) {
            const url = URL.createObjectURL(coverFile);
            setCoverPreviewUrl(url);
            return () => {
                URL.revokeObjectURL(url);
                setCoverPreviewUrl(null);
            };
        } else {
            setCoverPreviewUrl(null);
        }
    }, [coverFile]);

    const handleFileChange = (e: React.ChangeEvent<HTMLInputElement>) => {
        const file = e.target.files?.[0];
        setCoverError(null);
        if (!file) return;
        if (file.size > COVER_MAX_SIZE) {
            setCoverError("File size must be up to 5 MB");
            return;
        }
        const ext = file.name.split(".").pop()?.toLowerCase();
        if (ext && !["png", "jpeg", "jpg"].includes(ext)) {
            setCoverError("Only png, jpeg are allowed");
            return;
        }
        setCoverFile(file);
    };

    const handleDrop = (e: React.DragEvent) => {
        e.preventDefault();
        const file = e.dataTransfer.files?.[0];
        if (!file) return;
        setCoverError(null);
        if (file.size > COVER_MAX_SIZE) {
            setCoverError("File size must be up to 5 MB");
            return;
        }
        const ext = file.name.split(".").pop()?.toLowerCase();
        if (ext && !["png", "jpeg", "jpg"].includes(ext)) {
            setCoverError("Only png, jpeg are allowed");
            return;
        }
        setCoverFile(file);
    };

    const handleDragOver = (e: React.DragEvent) => e.preventDefault();

    const onSubmit = async (data: CreateEventFormValues) => {
        setSubmitError(null);
        if (!isSupabaseConfigured) {
            setSubmitError(supabaseConfigError ?? "Supabase is not configured");
            return;
        }
        const startDate = new Date(data.startDateTime).toISOString();
        const endDate = new Date(data.endDateTime).toISOString();
        if (endDate <= startDate) {
            setSubmitError("End date & time must be after start date & time");
            return;
        }

        setIsSubmitting(true);
        try {
            const price = (data.fee ?? "").trim() === "" ? "0" : (data.fee ?? "").trim();
            const cap = (data.capacity ?? "").trim() === "" ? null : parseInt(data.capacity, 10);
            const numCap = cap !== null && !Number.isNaN(cap) ? cap : null;
            const formatLabel = data.format === "singles_or_doubles" ? "Singles or Doubles" : (data.format?.charAt(0).toUpperCase() ?? "") + (data.format?.slice(1) ?? "");

            await createEvent({
                title: (data.title ?? "").trim(),
                startDate,
                endDate,
                location: (data.location ?? "").trim(),
                format: formatLabel,
                isRanked: data.eventType === "ranked",
                isRegistrationRequired: data.needToRegister === "yes",
                price,
                structure: (data.additionalInfo ?? "").trim(),
                coverFile,
                capacity: numCap,
            });
            const redirectPath = successRedirect ?? `/${locale}/events`;
            router.push(redirectPath);
        } catch (err: unknown) {
            const msg =
                err instanceof Error
                    ? err.message
                    : "Failed to create event. Check NEXT_PUBLIC_SUPABASE_URL and connection.";
            setSubmitError(msg);
        } finally {
            setIsSubmitting(false);
        }
    };

    return (
        <div className={css.hero}>
            {backLinkHref != null && backLinkLabel != null && (
                <Link href={backLinkHref} className={css.backLink}>
                    ← {backLinkLabel}
                </Link>
            )}
            <div className={css.container}>
                <div className={css.header}>
                    <h1 className={css.title}>Create Event Form</h1>
                </div>
                <form onSubmit={formHandleSubmit(onSubmit)} className={css.formWrap}>
                    {submitError && (
                        <div className={css.formError} role="alert">
                            {submitError}
                        </div>
                    )}
                    <div className={css.fields}>
                        <div className={css.uploadSection}>
                            <span className={css.uploadLabel}>Add Cover</span>
                            <input
                                ref={fileInputRef}
                                type="file"
                                accept={COVER_ACCEPT}
                                onChange={handleFileChange}
                                style={{ display: "none" }}
                            />
                            {coverError && (
                                <span className={inputCss.form_field_error}>{coverError}</span>
                            )}
                            {coverFile && coverPreviewUrl ? (
                                <div>
                                    <div className={css.coverPreviewWrap}>
                                        <img
                                            src={coverPreviewUrl}
                                            alt="Cover preview"
                                            className={css.coverPreview}
                                        />
                                    </div>
                                    <button
                                        type="button"
                                        className={css.coverChangeBtn}
                                        onClick={() => fileInputRef.current?.click()}
                                    >
                                        Change image
                                    </button>
                                </div>
                            ) : (
                                <div
                                    className={css.uploadZone}
                                    onClick={() => fileInputRef.current?.click()}
                                    onDrop={handleDrop}
                                    onDragOver={handleDragOver}
                                >
                                    <div className={css.uploadZoneContent}>
                                        <div className={css.uploadIconWrap}>
                                            <Icon name="arrow_up" className={css.uploadIconWrap} />
                                        </div>
                                        <div className={css.uploadTextWrap}>
                                            <span className={css.uploadPrimary}>
                                                Choose a file or drag & drop it here.
                                            </span>
                                            <span className={css.uploadSecondary}>
                                                png, jpeg - Up to 5 MB
                                            </span>
                                            <span className={css.uploadSecondary}>
                                                Recommended photo size: 1200×800 pixels
                                            </span>
                                        </div>
                                    </div>
                                    <button
                                        type="button"
                                        className={css.uploadBtn}
                                        onClick={(e) => {
                                            e.stopPropagation();
                                            fileInputRef.current?.click();
                                        }}
                                    >
                                        Browse files
                                    </button>
                                </div>
                            )}
                        </div>

                        <FormField
                            id="create-event-title"
                            name="title"
                            label="Title"
                            placeholder="Enter the event name"
                            register={register}
                            rules={{ required: "Title is required" }}
                            error={errors.title?.message}
                            hideClearButton
                        />
                        <FormField
                            id="create-event-start"
                            name="startDateTime"
                            label="Start date & time"
                            type="datetime-local"
                            placeholder="mm/dd/yyyy, 10:00 am"
                            register={register}
                            rules={{ required: "Start date & time is required" }}
                            error={errors.startDateTime?.message}
                            hideClearButton
                        />
                        <FormField
                            id="create-event-end"
                            name="endDateTime"
                            label="End date & time"
                            type="datetime-local"
                            placeholder="mm/dd/yyyy, 10:00 am"
                            register={register}
                            rules={{ required: "End date & time is required" }}
                            error={errors.endDateTime?.message}
                            hideClearButton
                        />
                        <FormField
                            id="create-event-location"
                            name="location"
                            label="Location"
                            placeholder="Choose location"
                            register={register}
                            error={errors.location?.message}
                            hideClearButton
                        />
                        <CustomDropdown
                            id="create-event-type"
                            name="eventType"
                            label="Type"
                            placeholder="Select type"
                            options={eventTypeOptions}
                            value={watchedEventType ?? ""}
                            register={register}
                            rules={{ required: "Type is required" }}
                            error={errors.eventType?.message}
                        />
                        <CustomDropdown
                            id="create-event-format"
                            name="format"
                            label="Format"
                            placeholder="Select format"
                            options={formatOptions}
                            value={watchedFormat ?? ""}
                            register={register}
                            rules={{ required: "Format is required" }}
                            error={errors.format?.message}
                        />
                        <TextareaField
                            id="create-event-additional"
                            name="additionalInfo"
                            label="Additional Event Information"
                            placeholder="Enter match details (structure, seeding, requires convention badge, contests, prizes, giveaway)"
                            register={register}
                            rows={5}
                            className={css.additionalInfoField}
                            hideClearButton
                        />
                        <FormField
                            id="create-event-fee"
                            name="fee"
                            label="Fee"
                            type="text"
                            inputMode="numeric"
                            placeholder="Enter 0 if participation is free"
                            register={register}
                            error={errors.fee?.message}
                            hideClearButton
                        />
                        <FormField
                            id="create-event-capacity"
                            name="capacity"
                            label="Capacity"
                            type="text"
                            inputMode="numeric"
                            placeholder="Max number of participants (0 for unlimited)"
                            register={register}
                            error={errors.capacity?.message}
                            hideClearButton
                        />
                        <CustomDropdown
                            id="create-event-register"
                            name="needToRegister"
                            label="Need to register?"
                            placeholder="Select"
                            options={needToRegisterOptions}
                            value={watchedNeedToRegister ?? ""}
                            register={register}
                            rules={{ required: "Please select" }}
                            error={errors.needToRegister?.message}
                        />
                    </div>
                    <button
                        type="submit"
                        className={css.submitBtn}
                        disabled={isSubmitting || !isSupabaseConfigured}
                    >
                        {isSubmitting ? "Creating…" : "Create Events"}
                    </button>
                    {!isSupabaseConfigured && (
                        <p className={css.formError} style={{ marginTop: 8 }}>
                            {supabaseConfigError ?? "Supabase is not configured. Set NEXT_PUBLIC_SUPABASE_URL and NEXT_PUBLIC_SUPABASE_ANON_KEY."}
                        </p>
                    )}
                </form>
            </div>
        </div>
    );
}
