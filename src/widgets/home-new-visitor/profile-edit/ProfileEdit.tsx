import React, { useMemo, useState, useEffect, useRef } from "react";
import Image from "next/image";
import css from "./styles.module.scss";
import { FormField } from "@/shared/ui/input";
import { useForm } from "react-hook-form";
import { Button, CustomDropdown } from "@/shared/ui";
import { useProfileInfo, useUserProfile } from "@/shared/hooks";
import { invalidateProfileCache, notifyProfileUpdated } from "@/shared/hooks/use-user-profile";
import { IProfileEditFormData } from "@/shared/types";
import { useRouter } from "next/navigation";
import { useParams } from "next/navigation";
import { localeConfig } from "@/app/localization/config";
import { clientRoutes } from "@/shared/routes/client";
import { useAuth } from "@/shared/hooks";
import {
    isSupabaseConfigured,
    supabase,
    supabaseConfigError,
} from "@/shared/supabase/client";

type ProfileEditProps = {
    credentialsReadOnly?: boolean;
    onCountryChange?: (country: string) => void;
    successRedirect?: string;
    showSkip?: boolean;
    hideAvatarBlock?: boolean;
};

export const ProfileEdit: React.FC<ProfileEditProps> = ({
    credentialsReadOnly = false,
    onCountryChange,
    successRedirect,
    showSkip = true,
    hideAvatarBlock = false,
}) => {
    const { user } = useAuth();
    const { profile } = useUserProfile();
    const [formError, setFormError] = useState<string | null>(null);
    const [isSubmitting, setIsSubmitting] = useState(false);

    const defaultValues = useMemo<IProfileEditFormData>(
        () => ({
            fullName: profile?.full_name?.trim() ?? "",
            country: profile?.country?.trim() ?? "",
            currentPassword: "",
            password: "",
        }),
        [profile?.full_name, profile?.country]
    );

    const {
        register,
        formState: { errors },
        handleSubmit,
        watch,
        reset,
        getValues,
    } = useForm<IProfileEditFormData>({ defaultValues });

    const hasSyncedProfile = useRef(false);
    useEffect(() => {
        if (!profile || hasSyncedProfile.current) return;
        hasSyncedProfile.current = true;
        reset(defaultValues);
    }, [profile, defaultValues, reset]);

    const watchedCountry = watch("country");
    const watchedFullName = watch("fullName");
    const isFirstCountrySync = useRef(true);

    const canSubmitStep4 =
        !credentialsReadOnly ||
        (Boolean(watchedFullName?.trim()) && Boolean(watchedCountry?.trim()));

    useEffect(() => {
        if (!credentialsReadOnly || !onCountryChange) return;
        if (isFirstCountrySync.current) {
            isFirstCountrySync.current = false;
            return;
        }
        onCountryChange(watchedCountry ?? "");
    }, [credentialsReadOnly, onCountryChange, watchedCountry]);

    const {
        countries,
        imageSrc: avatarSrc,
        fileInputRef: avatarFileInputRef,
        handleButtonClick: avatarButtonClick,
        handleFileChange: avatarFileChange,
        isUploading: avatarUploading,
        uploadError: avatarUploadError,
    } = useProfileInfo();
    const router = useRouter();
    const params = useParams() as { locale?: string };
    const locale = params?.locale || (localeConfig.defaultLocale as string);

    const isAuthed = Boolean(user);
    const canUseSupabase = isSupabaseConfigured && isAuthed;

    const newPasswordRules = useMemo(
        () => ({
            validate: (v: string) =>
                !v?.trim() ||
                v.trim().length >= 8 ||
                "Password must be at least 8 characters long",
        }),
        []
    );

    const onSubmit = async (data: IProfileEditFormData) => {
        if (!isSupabaseConfigured) {
            setFormError(supabaseConfigError ?? "Supabase is not configured");
            return;
        }
        if (!user) {
            setFormError("You need to be signed in to save your profile");
            return;
        }

        setFormError(null);
        setIsSubmitting(true);

        try {
            if (credentialsReadOnly) {
                const payload = {
                    full_name: data.fullName?.trim(),
                    country: data.country?.trim(),
                };
                await supabase.rpc("ensure_profile", { p_id: user.id });
                await fetch("/api/ensure-player", { method: "POST" });
                const { error: writeError } = await supabase
                    .from("profiles")
                    .update(payload)
                    .eq("id", user.id);
                if (writeError) {
                    setFormError(writeError.message);
                    return;
                }
                await supabase.from("players").update({ name: data.fullName?.trim() ?? null }).eq("user_id", user.id);
                invalidateProfileCache(user.id);
                notifyProfileUpdated(user.id);
                if (successRedirect) {
                    router.push(`/${locale}${successRedirect}`);
                } else {
                    router.push(`/${locale}${clientRoutes.steps(4)}`);
                }
                return;
            }

            const nextPassword = data.password?.trim();
            const shouldUpdatePassword = Boolean(nextPassword);

            if (shouldUpdatePassword) {
                const currentPassword = data.currentPassword?.trim();
                if (!user.email) {
                    setFormError("Cannot verify password: user email is missing");
                    return;
                }
                const { error: signInError } =
                    await supabase.auth.signInWithPassword({
                        email: user.email,
                        password: currentPassword ?? "",
                    });
                if (signInError) {
                    setFormError("Current password is incorrect");
                    return;
                }
                const { error: updateAuthError } =
                    await supabase.auth.updateUser({
                        password: nextPassword,
                    });
                if (updateAuthError) {
                    setFormError(updateAuthError.message);
                    return;
                }
            }

            const payload = {
                full_name: data.fullName?.trim(),
                country: data.country?.trim(),
            };
            await supabase.rpc("ensure_profile", { p_id: user.id });
            await fetch("/api/ensure-player", { method: "POST" });
            const { error: writeError } = await supabase
                .from("profiles")
                .update(payload)
                .eq("id", user.id);
            if (writeError) {
                setFormError(writeError.message);
                return;
            }
            await supabase.from("players").update({ name: data.fullName?.trim() ?? null }).eq("user_id", user.id);
            invalidateProfileCache(user.id);
            notifyProfileUpdated(user.id);
            if (successRedirect) {
                router.push(`/${locale}${successRedirect}`);
            } else {
                router.push(`/${locale}/new-visitor/save-continue`);
            }
        } catch {
            setFormError(
                "Could not reach Supabase. Please check NEXT_PUBLIC_SUPABASE_URL and your DNS/Internet connection."
            );
        } finally {
            setIsSubmitting(false);
        }
    };

    return (
        <div className={css.profile_edit}>
            {formError && <div className={css.profile_edit_error}>{formError}</div>}
            <form
                className={css.profile_edit_form}
                onSubmit={handleSubmit(onSubmit)}
            >
                <div className={css.profile_edit_content}>
                    {!hideAvatarBlock && (
                        <div className={css.profile_edit_left}>
                            <div className={css.profile_edit_avatar}>
                                <div className={css.profile_edit_avatar_preview}>
                                    <Image
                                        src={avatarSrc}
                                        alt="Avatar"
                                        width={164}
                                        height={164}
                                        className={css.profile_edit_avatar_img}
                                        unoptimized={avatarSrc.includes("supabase.co")}
                                    />
                                    <input
                                        ref={avatarFileInputRef}
                                        type="file"
                                        accept="image/*"
                                        className={css.profile_edit_avatar_input}
                                        onChange={avatarFileChange}
                                    />
                                </div>
                                <button
                                    type="button"
                                    className={css.profile_edit_form_item_button}
                                    disabled={!canUseSupabase || avatarUploading}
                                    onClick={avatarButtonClick}
                                >
                                    {avatarUploading ? "Uploading..." : "Change photo"}
                                </button>
                                {avatarUploadError && (
                                    <div className={css.profile_edit_error}>
                                        {avatarUploadError}
                                    </div>
                                )}
                            </div>
                        </div>
                    )}
                    <div className={css.profile_edit_right}>
                        <div className={css.profile_edit_form_items}>
                            {!credentialsReadOnly && (
                                <>
                                    <div className={css.profile_edit_form_item}>
                                        <FormField
                                            id="currentPassword"
                                            name="currentPassword"
                                            label="Current password"
                                            placeholder="••••••••"
                                            type="password"
                                            register={register}
                                            rules={{
                                                validate: (v) =>
                                                    getValues("password")?.trim()
                                                        ? (v?.trim()
                                                            ? true
                                                            : "Current password is required to set a new one")
                                                        : true,
                                            }}
                                            error={
                                                errors?.currentPassword
                                                    ?.message as string
                                            }
                                            disabled={!canUseSupabase}
                                        />
                                    </div>
                                    <div className={css.profile_edit_form_item}>
                                        <FormField
                                            id="password"
                                            name="password"
                                            label="New password"
                                            placeholder="••••••••"
                                            type="password"
                                            register={register}
                                            rules={newPasswordRules}
                                            error={
                                                errors?.password?.message as string
                                            }
                                            disabled={!canUseSupabase}
                                        />
                                    </div>
                                </>
                            )}
                            <div className={css.profile_edit_form_item}>
                                <FormField
                                    id="full_name"
                                    name="fullName"
                                    label="Full Name*"
                                    placeholder="Enter your full name"
                                    type="text"
                                    register={register}
                                    rules={{
                                        required: "Full name is required",
                                    }}
                                    error={errors?.fullName?.message as string}
                                    disabled={!canUseSupabase}
                                />
                            </div>
                            <div className={css.profile_edit_form_item}>
                                <CustomDropdown
                                    id="country"
                                    name="country"
                                    options={countries}
                                    register={register}
                                    value={watchedCountry ?? ""}
                                    label="Kingdom (State/Country)*"
                                    placeholder="Select your country"
                                    rules={{
                                        required: "Country is required",
                                    }}
                                    error={errors?.country?.message as string}
                                    disabled={!canUseSupabase}
                                />
                            </div>
                        </div>
                        <div className={css.profile_edit_form_buttons}>
                            {!credentialsReadOnly && showSkip && (
                                <Button
                                    type="button"
                                    buttonType="primary"
                                    className={css.profile_edit_form_buttons_button}
                                    disabled={isSubmitting}
                                >
                                    Skip for now
                                </Button>
                            )}
                            <Button
                                type="submit"
                                buttonType={credentialsReadOnly ? "primary" : "secondary"}
                                className={css.profile_edit_form_buttons_button}
                                disabled={
                                    isSubmitting ||
                                    !canUseSupabase ||
                                    (credentialsReadOnly && !canSubmitStep4)
                                }
                            >
                                {isSubmitting ? "Saving..." : successRedirect ? "Save" : "Save & Continue"}
                            </Button>
                        </div>
                    </div>
                </div>
            </form>
        </div>
    );
};
