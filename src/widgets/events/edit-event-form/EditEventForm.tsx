"use client";

import React, { useState, useRef, useEffect } from "react";
import Link from "next/link";
import { useRouter, useParams } from "next/navigation";
import { useForm } from "react-hook-form";
import { FormField, TextareaField, CustomDropdown } from "@/shared/ui";
import { Icon } from "@/shared/ui/icons";
import { updateEvent } from "@/shared/supabase/data";
import {
    isSupabaseConfigured,
    supabaseConfigError,
} from "@/shared/supabase/client";
import {
    formatOptions,
    eventTypeOptions,
    needToRegisterOptions,
    qualifyingHeatsOptions,
    locationCountryOptions,
} from "@/shared/constants/dropdown-options";
import inputCss from "@/shared/ui/input/styles.module.scss";
import css from "../create-event-form/styles.module.scss";
import { localeConfig } from "@/app/localization/config";
import type { IEventCardProps } from "@/shared/types";

const COVER_MAX_SIZE = 5 * 1024 * 1024;
const COVER_ACCEPT = ".png,.jpeg,.jpg";

function toLocalDateTime(iso: string | undefined): string {
    if (!iso) return "";
    const d = new Date(iso);
    const y = d.getFullYear();
    const m = String(d.getMonth() + 1).padStart(2, "0");
    const day = String(d.getDate()).padStart(2, "0");
    const h = String(d.getHours()).padStart(2, "0");
    const min = String(d.getMinutes()).padStart(2, "0");
    return `${y}-${m}-${day}T${h}:${min}`;
}

function formatToOptionValue(format: string): string {
    const f = (format || "").trim().toLowerCase();
    if (f.includes("doubles")) return "doubles";
    return "singles";
}

type EditEventFormValues = {
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
    qualifyingHeatsCount: string;
};

type EditEventFormProps = {
    event: IEventCardProps;
    backLinkHref: string;
    backLinkLabel: string;
    successRedirect: string;
};

function getDefaultValues(event: IEventCardProps): EditEventFormValues {
    const heatsCount =
        event.qualifyingHeats?.heats?.length != null
            ? event.qualifyingHeats.heats.length
            : 0;
    return {
        title: event.title ?? "",
        startDateTime: toLocalDateTime(event.startDate),
        endDateTime: toLocalDateTime(event.endDate),
        location: event.location ?? "",
        eventType: event.isRanked ? "ranked" : "unranked",
        format: formatToOptionValue(event.format),
        additionalInfo: event.structure ?? "",
        fee: event.price === "Free" || event.price === "free" ? "" : (event.price ?? ""),
        capacity:
            event.totalParticipants != null ? String(event.totalParticipants) : "",
        needToRegister: event.isRegistrationRequired ? "yes" : "no",
        qualifyingHeatsCount: String(heatsCount),
    };
}

export function EditEventForm({
    event,
    backLinkHref,
    backLinkLabel,
    successRedirect,
}: EditEventFormProps) {
    const router = useRouter();
    const params = useParams() as { locale?: string };
    const locale = params?.locale ?? localeConfig.defaultLocale;
    const eventId = event.id;

    const defaultValues = getDefaultValues(event);

    const {
        register,
        handleSubmit: formHandleSubmit,
        watch,
        formState: { errors },
    } = useForm<EditEventFormValues>({ defaultValues });

    const watchedEventType = watch("eventType");
    const watchedFormat = watch("format");
    const watchedLocation = watch("location");
    const watchedNeedToRegister = watch("needToRegister");
    const watchedHeatsCount = watch("qualifyingHeatsCount");
    const heatsCount = Math.max(0, parseInt(watchedHeatsCount ?? "0", 10) || 0);

    const [heatDateTimes, setHeatDateTimes] = useState<Record<number, string>>(() => {
        const out: Record<number, string> = {};
        event.qualifyingHeats?.heats?.forEach((slot, i) => {
            out[i + 1] = toLocalDateTime(slot.start);
        });
        return out;
    });
    const [finalDateTime, setFinalDateTime] = useState<string>(() =>
        event.qualifyingHeats?.final?.start
            ? toLocalDateTime(event.qualifyingHeats.final.start)
            : ""
    );
    const heatDateInputId = (n: number) => `edit-event-heat-${n}-date`;
    const finalDateInputId = "edit-event-final-date";

    const [coverFile, setCoverFile] = useState<File | null>(null);
    const [coverPreviewUrl, setCoverPreviewUrl] = useState<string | null>(event.image || null);
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
            setCoverPreviewUrl(event.image || null);
        }
    }, [coverFile, event.image]);

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

    const onSubmit = async (data: EditEventFormValues) => {
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
            const formatLabel =
                (data.format?.charAt(0).toUpperCase() ?? "") + (data.format?.slice(1) ?? "");

            const heatsCountNum = Math.max(
                0,
                parseInt(String(data.qualifyingHeatsCount ?? "0"), 10) || 0
            );
            let qualifyingHeats:
                | { heats: { start: string; end: string }[]; final?: { start: string; end: string } }
                | undefined;
            if (heatsCountNum > 0) {
                const twoHoursMs = 2 * 60 * 60 * 1000;
                const heats: { start: string; end: string }[] = [];
                for (let n = 1; n <= heatsCountNum; n++) {
                    const startStr = heatDateTimes[n];
                    if (startStr) {
                        const start = new Date(startStr).getTime();
                        heats.push({
                            start: new Date(start).toISOString(),
                            end: new Date(start + twoHoursMs).toISOString(),
                        });
                    }
                }
                let finalSlot: { start: string; end: string } | undefined;
                if (finalDateTime) {
                    const start = new Date(finalDateTime).getTime();
                    finalSlot = {
                        start: new Date(start).toISOString(),
                        end: new Date(start + twoHoursMs).toISOString(),
                    };
                }
                if (heats.length > 0) {
                    qualifyingHeats = { heats, final: finalSlot };
                }
            }

            await updateEvent(eventId, {
                title: (data.title ?? "").trim(),
                startDate,
                endDate,
                location: (data.location ?? "").trim(),
                format: formatLabel,
                isRanked: data.eventType === "ranked",
                isRegistrationRequired: data.needToRegister === "yes",
                price,
                structure: (data.additionalInfo ?? "").trim(),
                coverFile: coverFile ?? undefined,
                capacity: numCap,
                qualifyingHeats: qualifyingHeats ?? undefined,
            });
            router.push(successRedirect);
        } catch (err: unknown) {
            const msg =
                err instanceof Error
                    ? err.message
                    : "Failed to update event. Check your connection.";
            setSubmitError(msg);
        } finally {
            setIsSubmitting(false);
        }
    };

    return (
        <div className={css.hero}>
            <Link href={backLinkHref} className={css.backLink}>
                ← {backLinkLabel}
            </Link>
            <div className={css.container}>
                <div className={css.header}>
                    <h1 className={css.title}>Edit Event</h1>
                </div>
                <form onSubmit={formHandleSubmit(onSubmit)} className={css.formWrap}>
                    {submitError && (
                        <div className={css.formError} role="alert">
                            {submitError}
                        </div>
                    )}
                    <div className={css.fields}>
                        <div className={css.uploadSection}>
                            <span className={css.uploadLabel}>Cover</span>
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
                            {(coverFile || coverPreviewUrl) ? (
                                <div>
                                    <div className={css.coverPreviewWrap}>
                                        <img
                                            src={coverPreviewUrl ?? undefined}
                                            alt="Cover"
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
                                        <span className={css.uploadPrimary}>
                                            Choose a file or drag & drop it here.
                                        </span>
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
                            id="edit-event-title"
                            name="title"
                            label="Title"
                            placeholder="Enter the event name"
                            register={register}
                            rules={{ required: "Title is required" }}
                            error={errors.title?.message}
                            hideClearButton
                        />
                        <FormField
                            id="edit-event-start"
                            name="startDateTime"
                            label="Start date & time"
                            type="datetime-local"
                            placeholder="mm/dd/yyyy, 10:00 am"
                            register={register}
                            rules={{
                                required: "Start date & time is required",
                                validate: (v) => {
                                    if (!v) return true;
                                    const start = new Date(v).getTime();
                                    if (start <= Date.now())
                                        return "Start date & time must be in the future";
                                    return true;
                                },
                            }}
                            error={errors.startDateTime?.message}
                            hideClearButton
                        />
                        <FormField
                            id="edit-event-end"
                            name="endDateTime"
                            label="End date & time"
                            type="datetime-local"
                            placeholder="mm/dd/yyyy, 10:00 am"
                            register={register}
                            rules={{
                                required: "End date & time is required",
                                validate: (v) => {
                                    if (!v) return true;
                                    const end = new Date(v).getTime();
                                    if (end <= Date.now())
                                        return "End date & time must be in the future";
                                    return true;
                                },
                            }}
                            error={errors.endDateTime?.message}
                            hideClearButton
                        />
                        <CustomDropdown
                            id="edit-event-location"
                            name="location"
                            label="Location"
                            placeholder="Select location"
                            options={locationCountryOptions}
                            value={watchedLocation ?? ""}
                            register={register}
                            error={errors.location?.message}
                        />
                        <CustomDropdown
                            id="edit-event-type"
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
                            id="edit-event-format"
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
                            id="edit-event-additional"
                            name="additionalInfo"
                            label="Additional Event Information"
                            placeholder="Enter match details"
                            register={register}
                            rows={5}
                            className={css.additionalInfoField}
                            hideClearButton
                        />
                        <FormField
                            id="edit-event-fee"
                            name="fee"
                            label="Fee"
                            type="text"
                            inputMode="numeric"
                            placeholder="Enter 0 if participation is free"
                            register={register}
                            rules={{
                                validate: (v) => {
                                    const s = (v ?? "").trim();
                                    if (s === "" || s === "0") return true;
                                    const n = parseFloat(s);
                                    if (Number.isNaN(n) || n < 0)
                                        return "Enter a valid fee (e.g. 0, 10, or 5.50)";
                                    if (/^0\d/.test(s))
                                        return "Fee cannot have leading zeros (e.g. use 1 instead of 01)";
                                    const parts = s.split(".");
                                    if (parts.length === 2 && (parts[1]?.length ?? 0) > 2)
                                        return "Maximum 2 decimal places";
                                    return true;
                                },
                            }}
                            error={errors.fee?.message}
                            hideClearButton
                        />
                        <FormField
                            id="edit-event-capacity"
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
                            id="edit-event-register"
                            name="needToRegister"
                            label="Need to register?"
                            placeholder="Select"
                            options={needToRegisterOptions}
                            value={watchedNeedToRegister ?? ""}
                            register={register}
                            rules={{ required: "Please select" }}
                            error={errors.needToRegister?.message}
                        />

                        <div className={css.heatsSection}>
                            <div className={css.heatsDropdownWrap}>
                                <CustomDropdown
                                    id="edit-event-qualifying-heats"
                                    name="qualifyingHeatsCount"
                                    label="Add qualifying heats to the tournament"
                                    placeholder="Select"
                                    options={qualifyingHeatsOptions}
                                    value={watchedHeatsCount ?? "0"}
                                    register={register}
                                    buttonClassName={css.heatsDropdownButton}
                                />
                            </div>
                            {heatsCount > 0 && (
                                <div className={css.heatsGrid}>
                                    {Array.from({ length: heatsCount }, (_, i) => i + 1).map(
                                        (n) => (
                                            <div key={n} className={css.heatField}>
                                                <label
                                                    className={css.heatFieldLabel}
                                                    htmlFor={heatDateInputId(n)}
                                                >
                                                    Qualifying Heat {n}
                                                </label>
                                                <div className={css.heatDateTimeWrap}>
                                                    <input
                                                        id={heatDateInputId(n)}
                                                        type="datetime-local"
                                                        value={heatDateTimes[n] ?? ""}
                                                        onChange={(e) =>
                                                            setHeatDateTimes((prev) => ({
                                                                ...prev,
                                                                [n]: e.target.value,
                                                            }))
                                                        }
                                                        className={css.heatDateTimeInput}
                                                    />
                                                    <Icon
                                                        name="calendar"
                                                        className={css.heatCalendarIcon}
                                                    />
                                                </div>
                                            </div>
                                        )
                                    )}
                                    <div className={css.heatField}>
                                        <label
                                            className={css.heatFieldLabel}
                                            htmlFor={finalDateInputId}
                                        >
                                            Final
                                        </label>
                                        <div className={css.heatDateTimeWrap}>
                                            <input
                                                id={finalDateInputId}
                                                type="datetime-local"
                                                value={finalDateTime}
                                                onChange={(e) => setFinalDateTime(e.target.value)}
                                                className={css.heatDateTimeInput}
                                            />
                                            <Icon
                                                name="calendar"
                                                className={css.heatCalendarIcon}
                                            />
                                        </div>
                                    </div>
                                </div>
                            )}
                        </div>
                    </div>
                    <button
                        type="submit"
                        className={css.submitBtn}
                        disabled={isSubmitting || !isSupabaseConfigured}
                    >
                        {isSubmitting ? "Saving…" : "Save changes"}
                    </button>
                    {!isSupabaseConfigured && (
                        <p className={css.formError} style={{ marginTop: 8 }}>
                            {supabaseConfigError ??
                                "Supabase is not configured. Set NEXT_PUBLIC_SUPABASE_URL and NEXT_PUBLIC_SUPABASE_ANON_KEY."}
                        </p>
                    )}
                </form>
            </div>
        </div>
    );
}
