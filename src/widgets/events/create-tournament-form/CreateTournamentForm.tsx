"use client";

import React, { useState, useRef, useEffect } from "react";
import Link from "next/link";
import { useForm, useFieldArray } from "react-hook-form";
import { FormField, TextareaField, CustomDropdown } from "@/shared/ui";
import { Icon } from "@/shared/ui/icons";
import {
    eventTypeOptions,
    locationCountryOptions,
    tournamentPointsOptions,
    tournamentTotalPlayersOptions,
    tournamentOrganizerOptions,
    stageFormatOptions,
    seedingMethodOptions,
    tournamentVisibilityOptions,
} from "@/shared/constants/dropdown-options";
import inputCss from "@/shared/ui/input/styles.module.scss";
import css from "./styles.module.scss";

const COVER_MAX_SIZE = 5 * 1024 * 1024;
const COVER_ACCEPT = ".png,.jpeg,.jpg";

const TOURNAMENT_STEPS = [
    { step: 1, label: "Basic" },
    { step: 2, label: "Tournament Structure" },
    { step: 3, label: "Advanced" },
] as const;

export type CreateTournamentStep1Values = {
    title: string;
    description: string;
    eventType: string;
    pointsAvailable: string;
    organizer: string;
    totalPlayers: string;
    location: string;
    startDateTime: string;
    endDateTime: string;
    fee: string;
};

const defaultValues: CreateTournamentStep1Values = {
    title: "",
    description: "",
    eventType: "ranked",
    pointsAvailable: "220",
    organizer: "me",
    totalPlayers: "8",
    location: "",
    startDateTime: "",
    endDateTime: "",
    fee: "",
};

export type CreateTournamentStageValues = {
    stageFormat: string;
    seedingMethod: string;
    numberOfRounds: string;
};

export type CreateTournamentStep2Values = {
    stages: CreateTournamentStageValues[];
};

const defaultStep2Values: CreateTournamentStep2Values = {
    stages: [
        {
            stageFormat: "single_elimination",
            seedingMethod: "auto_rating",
            numberOfRounds: "",
        },
    ],
};

export type CreateTournamentStep3Values = {
    track20s: boolean;
    playerScoreConfirmation: boolean;
    tournamentVisibility: string;
};

const defaultStep3Values: CreateTournamentStep3Values = {
    track20s: true,
    playerScoreConfirmation: true,
    tournamentVisibility: "draft",
};

export type CreateTournamentFormProps = {
    backLinkHref?: string;
    backLinkLabel?: string;
    onNextStep?: (data: CreateTournamentStep1Values) => void;
    onStep2Next?: (data: CreateTournamentStep2Values) => void;
    onSubmit?: (data: {
        step1: CreateTournamentStep1Values;
        step2: CreateTournamentStep2Values;
        step3: CreateTournamentStep3Values;
    }) => void;
};

export function CreateTournamentForm({
    backLinkHref,
    backLinkLabel,
    onNextStep,
    onStep2Next,
    onSubmit,
}: CreateTournamentFormProps) {
    const [currentStep, setCurrentStep] = useState<1 | 2 | 3>(1);
    const [step1Data, setStep1Data] = useState<CreateTournamentStep1Values | null>(null);
    const [step2Data, setStep2Data] = useState<CreateTournamentStep2Values | null>(null);

    const formStep1 = useForm<CreateTournamentStep1Values>({ defaultValues });
    const {
        register,
        handleSubmit: formHandleSubmit,
        watch,
        setValue,
        formState: { errors },
    } = formStep1;

    const formStep2 = useForm<CreateTournamentStep2Values>({
        defaultValues: defaultStep2Values,
    });
    const {
        register: registerStep2,
        control,
        handleSubmit: formHandleSubmitStep2,
        watch: watchStep2,
        formState: { errors: errorsStep2 },
    } = formStep2;
    const { fields, append, remove } = useFieldArray({
        control,
        name: "stages",
    });

    const formStep3 = useForm<CreateTournamentStep3Values>({
        defaultValues: defaultStep3Values,
    });
    const {
        register: registerStep3,
        handleSubmit: formHandleSubmitStep3,
        watch: watchStep3,
        setValue: setValueStep3,
        formState: { errors: errorsStep3 },
    } = formStep3;
    const watchedTrack20s = watchStep3("track20s");
    const watchedPlayerScoreConfirmation = watchStep3("playerScoreConfirmation");
    const watchedVisibility = watchStep3("tournamentVisibility");

    const watchedType = watch("eventType");
    const watchedPoints = watch("pointsAvailable");
    const watchedOrganizer = watch("organizer");
    const watchedTotalPlayers = watch("totalPlayers");
    const watchedLocation = watch("location");

    const [coverFile, setCoverFile] = useState<File | null>(null);
    const [coverPreviewUrl, setCoverPreviewUrl] = useState<string | null>(null);
    const [coverError, setCoverError] = useState<string | null>(null);
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

    const onStep1Submit = (data: CreateTournamentStep1Values) => {
        setStep1Data(data);
        setCurrentStep(2);
        onNextStep?.(data);
    };

    const onStep2Submit = (data: CreateTournamentStep2Values) => {
        setStep2Data(data);
        setCurrentStep(3);
        onStep2Next?.(data);
    };

    const onStep3Submit = (data: CreateTournamentStep3Values) => {
        if (step1Data && step2Data) {
            onSubmit?.({ step1: step1Data, step2: step2Data, step3: data });
        }
    };

    const addNewStage = () => {
        append({
            stageFormat: "single_elimination",
            seedingMethod: "auto_rating",
            numberOfRounds: "",
        });
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
                    <h1 className={css.title}>Create Tournament Form</h1>
                </div>

                {currentStep === 1 ? (
                    <form
                        onSubmit={formHandleSubmit(onStep1Submit)}
                        className={css.formWrap}
                    >
                        <div className={css.progressWrap}>
                            <div className={css.progressIndicator}>
                                {TOURNAMENT_STEPS.map(({ step, label }) => (
                                    <div key={step} className={css.step}>
                                        <div
                                            className={
                                                step === currentStep
                                                    ? `${css.stepCircle} ${css.stepCircleActive}`
                                                    : step < currentStep
                                                      ? `${css.stepCircle} ${css.stepCircleCompleted}`
                                                      : `${css.stepCircle} ${css.stepCircleInactive}`
                                            }
                                        >
                                            {step < currentStep ? (
                                                <Icon name="check" className={css.stepCheckIcon} />
                                            ) : (
                                                step
                                            )}
                                        </div>
                                        <span
                                            className={
                                                step === currentStep
                                                    ? `${css.stepLabel} ${css.stepLabelActive}`
                                                    : css.stepLabel
                                            }
                                        >
                                            {label}
                                        </span>
                                    </div>
                                ))}
                            </div>
                            <h2 className={css.sectionTitle}>Basic</h2>
                        </div>

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
                                <span
                                    className={inputCss.form_field_error}
                                >
                                    {coverError}
                                </span>
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
                                        onClick={() =>
                                            fileInputRef.current?.click()
                                        }
                                    >
                                        Change image
                                    </button>
                                </div>
                            ) : (
                                <div
                                    className={css.uploadZone}
                                    onClick={() =>
                                        fileInputRef.current?.click()
                                    }
                                    onDrop={handleDrop}
                                    onDragOver={handleDragOver}
                                >
                                    <div className={css.uploadZoneContent}>
                                        <div className={css.uploadIconWrap}>
                                            <Icon
                                                name="arrow_up"
                                                className={
                                                    css.uploadIconWrap
                                                }
                                            />
                                        </div>
                                        <div className={css.uploadTextWrap}>
                                            <span className={css.uploadPrimary}>
                                                Choose a file or drag & drop it
                                                here.
                                            </span>
                                            <span
                                                className={
                                                    css.uploadSecondary
                                                }
                                            >
                                                png, jpeg - Up to 5 MB
                                            </span>
                                            <span
                                                className={
                                                    css.uploadSecondary
                                                }
                                            >
                                                Recommended photo size:
                                                1200×800 pixels
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
                            id="create-tournament-title"
                            name="title"
                            label="Tournament name"
                            placeholder="e.g., Crokino World Opening"
                            register={register}
                            maxLength={100}
                            rules={{
                                required: "Tournament name is required",
                                maxLength: {
                                    value: 100,
                                    message: "Title must be 100 characters or less",
                                },
                            }}
                            error={errors.title?.message}
                            hideClearButton
                        />

                        <div className={css.descriptionWrap}>
                            <TextareaField
                                id="create-tournament-description"
                                name="description"
                                label="Description"
                                placeholder="Brief description of the tournament"
                                register={register}
                                rows={4}
                                className={css.descriptionField}
                                hideClearButton
                            />
                        </div>

                        <div className={css.row}>
                            <div className={css.rowField}>
                                <CustomDropdown
                                    id="create-tournament-type"
                                    name="eventType"
                                    label="Type"
                                    placeholder="Select type"
                                    options={eventTypeOptions}
                                    value={watchedType ?? ""}
                                    register={register}
                                    rules={{ required: "Type is required" }}
                                    error={errors.eventType?.message}
                                />
                            </div>
                            <div className={css.rowField}>
                                <CustomDropdown
                                    id="create-tournament-points"
                                    name="pointsAvailable"
                                    label="Points available (per player)"
                                    placeholder="Select"
                                    options={tournamentPointsOptions}
                                    value={watchedPoints ?? ""}
                                    register={register}
                                    error={
                                        errors.pointsAvailable?.message
                                    }
                                />
                            </div>
                        </div>

                        <div className={css.row}>
                            <div className={css.rowField}>
                                <CustomDropdown
                                    id="create-tournament-organizer"
                                    name="organizer"
                                    label="Organizer"
                                    placeholder="Select"
                                    options={tournamentOrganizerOptions}
                                    value={watchedOrganizer ?? ""}
                                    register={register}
                                    rules={{
                                        required: "Organizer is required",
                                    }}
                                    error={errors.organizer?.message}
                                />
                            </div>
                            <div className={css.rowField}>
                                <CustomDropdown
                                    id="create-tournament-total-players"
                                    name="totalPlayers"
                                    label="Total players"
                                    placeholder="Select"
                                    options={
                                        tournamentTotalPlayersOptions
                                    }
                                    value={watchedTotalPlayers ?? ""}
                                    register={register}
                                    rules={{
                                        required: "Total players is required",
                                    }}
                                    error={errors.totalPlayers?.message}
                                />
                            </div>
                        </div>

                        <CustomDropdown
                            id="create-tournament-location"
                            name="location"
                            label="Location"
                            placeholder="Choose location"
                            options={locationCountryOptions}
                            value={watchedLocation ?? ""}
                            register={register}
                            error={errors.location?.message}
                        />

                        <FormField
                            id="create-tournament-start"
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
                            id="create-tournament-end"
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

                        <FormField
                            id="create-tournament-fee"
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
                    </div>

                        <button type="submit" className={css.submitBtn}>
                            Next
                        </button>
                    </form>
                ) : currentStep === 2 ? (
                    <form
                        onSubmit={formHandleSubmitStep2(onStep2Submit)}
                        className={css.formWrap}
                    >
                        <div className={css.progressWrap}>
                            <div className={css.progressIndicator}>
                                {TOURNAMENT_STEPS.map(({ step, label }) => (
                                    <div key={step} className={css.step}>
                                        <div
                                            className={
                                                step === currentStep
                                                    ? `${css.stepCircle} ${css.stepCircleActive}`
                                                    : step < currentStep
                                                      ? `${css.stepCircle} ${css.stepCircleCompleted}`
                                                      : `${css.stepCircle} ${css.stepCircleInactive}`
                                            }
                                        >
                                            {step < currentStep ? (
                                                <Icon name="check" className={css.stepCheckIcon} />
                                            ) : (
                                                step
                                            )}
                                        </div>
                                        <span
                                            className={
                                                step === currentStep
                                                    ? `${css.stepLabel} ${css.stepLabelActive}`
                                                    : css.stepLabel
                                            }
                                        >
                                            {label}
                                        </span>
                                    </div>
                                ))}
                            </div>
                            <div className={css.sectionHeaderRow}>
                                <h2 className={css.sectionTitle}>
                                    Tournament Structure
                                </h2>
                                <button
                                    type="button"
                                    className={css.addStageBtn}
                                    onClick={addNewStage}
                                >
                                    <Icon name="plus" className={css.addStageIcon} />
                                    Add New Stage
                                </button>
                            </div>
                            <div className={css.stageIndicatorPill}>
                                {fields.map((_, i) => (
                                    <div key={i} className={css.stagePillItem}>
                                        <div className={css.stagePillCircle}>
                                            {i + 1}
                                        </div>
                                        <span className={css.stagePillLabel}>
                                            Stage {i + 1}
                                        </span>
                                    </div>
                                ))}
                            </div>
                        </div>

                        <div className={css.step2Fields}>
                            {fields.map((field, i) => (
                                <div key={field.id} className={css.stageCard}>
                                    <div className={css.stageCardHeader}>
                                        <h3 className={css.stageCardTitle}>
                                            Stage {i + 1}
                                        </h3>
                                        <button
                                            type="button"
                                            className={css.stageCardDelete}
                                            onClick={() => fields.length > 1 && remove(i)}
                                            aria-label={`Remove stage ${i + 1}`}
                                        >
                                            <Icon name="trash" className={css.stageCardDeleteIcon} />
                                        </button>
                                    </div>
                                    <div className={css.row}>
                                        <div className={css.rowField}>
                                            <CustomDropdown
                                                id={`stage-${i}-format`}
                                                name={`stages.${i}.stageFormat` as const}
                                                label="Stage format"
                                                placeholder="Select"
                                                options={stageFormatOptions}
                                                value={watchStep2(`stages.${i}.stageFormat`)}
                                                register={registerStep2}
                                                error={
                                                    errorsStep2.stages?.[i]?.stageFormat?.message
                                                }
                                            />
                                        </div>
                                        <div className={css.rowField}>
                                            <CustomDropdown
                                                id={`stage-${i}-seeding`}
                                                name={`stages.${i}.seedingMethod` as const}
                                                label="Seeding method"
                                                placeholder="Select"
                                                options={seedingMethodOptions}
                                                value={watchStep2(`stages.${i}.seedingMethod`)}
                                                register={registerStep2}
                                                error={
                                                    errorsStep2.stages?.[i]?.seedingMethod?.message
                                                }
                                            />
                                        </div>
                                    </div>
                                    <FormField
                                        id={`stage-${i}-rounds`}
                                        name={`stages.${i}.numberOfRounds` as const}
                                        label="Number of rounds"
                                        placeholder="e.g. 6"
                                        register={registerStep2}
                                        error={
                                            errorsStep2.stages?.[i]?.numberOfRounds?.message
                                        }
                                        hideClearButton
                                    />
                                </div>
                            ))}
                        </div>

                        <div className={css.actionsRow}>
                            <button
                                type="button"
                                className={css.backStepBtn}
                                onClick={() => setCurrentStep(1)}
                            >
                                Back
                            </button>
                            <button type="submit" className={css.submitBtn}>
                                Next
                            </button>
                        </div>
                    </form>
                ) : (
                    <form
                        onSubmit={formHandleSubmitStep3(onStep3Submit)}
                        className={css.formWrap}
                    >
                        <div className={css.progressWrap}>
                            <div className={css.progressIndicator}>
                                {TOURNAMENT_STEPS.map(({ step, label }) => (
                                    <div key={step} className={css.step}>
                                        <div
                                            className={
                                                step === currentStep
                                                    ? `${css.stepCircle} ${css.stepCircleActive}`
                                                    : step < currentStep
                                                      ? `${css.stepCircle} ${css.stepCircleCompleted}`
                                                      : `${css.stepCircle} ${css.stepCircleInactive}`
                                            }
                                        >
                                            {step < currentStep ? (
                                                <Icon name="check" className={css.stepCheckIcon} />
                                            ) : (
                                                step
                                            )}
                                        </div>
                                        <span
                                            className={
                                                step === currentStep
                                                    ? `${css.stepLabel} ${css.stepLabelActive}`
                                                    : css.stepLabel
                                            }
                                        >
                                            {label}
                                        </span>
                                    </div>
                                ))}
                            </div>
                            <h2 className={css.sectionTitle}>Advanced</h2>
                        </div>

                        <div className={css.step3Fields}>
                            <div className={css.toggleRow}>
                                <div className={css.toggleLabelBlock}>
                                    <p className={css.toggleTitle}>
                                        Track 20s (Center Shots)
                                    </p>
                                    <p className={css.toggleDescription}>
                                        Enable tracking of center (20-point)
                                        shots
                                    </p>
                                </div>
                                <button
                                    type="button"
                                    role="switch"
                                    aria-checked={watchedTrack20s}
                                    className={`${css.toggleTrack} ${watchedTrack20s ? css.toggleOn : ""}`}
                                    onClick={() =>
                                        setValueStep3(
                                            "track20s",
                                            !watchedTrack20s
                                        )
                                    }
                                >
                                    <span className={css.toggleKnob} />
                                </button>
                            </div>
                            <div className={css.toggleRow}>
                                <div className={css.toggleLabelBlock}>
                                    <p className={css.toggleTitle}>
                                        Player Score Confirmation
                                    </p>
                                    <p className={css.toggleDescription}>
                                        Require players to submit and confirm
                                        match scores
                                    </p>
                                </div>
                                <button
                                    type="button"
                                    role="switch"
                                    aria-checked={watchedPlayerScoreConfirmation}
                                    className={`${css.toggleTrack} ${watchedPlayerScoreConfirmation ? css.toggleOn : ""}`}
                                    onClick={() =>
                                        setValueStep3(
                                            "playerScoreConfirmation",
                                            !watchedPlayerScoreConfirmation
                                        )
                                    }
                                >
                                    <span className={css.toggleKnob} />
                                </button>
                            </div>
                            <CustomDropdown
                                id="create-tournament-visibility"
                                name="tournamentVisibility"
                                label="Tournament Visibility"
                                placeholder="Select"
                                options={tournamentVisibilityOptions}
                                value={watchedVisibility ?? ""}
                                register={registerStep3}
                                error={errorsStep3.tournamentVisibility?.message}
                            />
                        </div>

                        <div className={css.actionsRow}>
                            <button
                                type="button"
                                className={css.backStepBtn}
                                onClick={() => setCurrentStep(2)}
                            >
                                Back
                            </button>
                            <button
                                type="submit"
                                className={css.createTournamentBtn}
                            >
                                Create a tournament
                            </button>
                        </div>
                    </form>
                )}
            </div>
        </div>
    );
}
