import React, { useMemo, useState } from "react";
import css from "./styles.module.scss";
import { FormField } from "@/shared/ui/input";
import { useForm } from "react-hook-form";
import { Button, CustomDropdown } from "@/shared/ui";
import { useProfileInfo } from "@/shared/hooks";
import { IProfileEditFormData } from "@/shared/types";
import { useRouter } from "next/navigation";
import { useParams } from "next/navigation";
import { localeConfig } from "@/app/localization/config";
import { useAuth } from "@/shared/hooks";
import {
    isSupabaseConfigured,
    supabase,
    supabaseConfigError,
} from "@/shared/supabase/client";

export const ProfileEdit: React.FC = () => {
    const { user } = useAuth();
    const [formError, setFormError] = useState<string | null>(null);
    const [isSubmitting, setIsSubmitting] = useState(false);

    const {
        register,
        formState: { errors },
        handleSubmit,
    } = useForm<IProfileEditFormData>();

    const { countries, clubs } = useProfileInfo();
    const router = useRouter();
    const params = useParams() as { locale?: string };
    const locale = params?.locale || (localeConfig.defaultLocale as string);
    
    const currentEmail = user?.email ?? "";
    const isAuthed = Boolean(user);
    const canUseSupabase = isSupabaseConfigured && isAuthed;

    const emailRules = useMemo(
        () => ({
            pattern: {
                value: /^[^\s@]+@[^\s@]+\.[^\s@]+$/,
                message: "Invalid email address",
            },
        }),
        []
    );

    const passwordRules = useMemo(
        () => ({
            minLength: {
                value: 8,
                message: "Password must be at least 8 characters long",
            },
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
            const nextEmail = data.email?.trim();
            const nextPassword = data.password?.trim();
            const shouldUpdateEmail =
                Boolean(nextEmail) && nextEmail !== currentEmail;
            const shouldUpdatePassword = Boolean(nextPassword);

            if (shouldUpdateEmail || shouldUpdatePassword) {
                const { error: updateAuthError } =
                    await supabase.auth.updateUser({
                        ...(shouldUpdateEmail ? { email: nextEmail } : {}),
                        ...(shouldUpdatePassword
                            ? { password: nextPassword }
                            : {}),
                    });
                if (updateAuthError) {
                    setFormError(updateAuthError.message);
                    return;
                }
            }

            const { error: upsertError } = await supabase
                .from("profiles")
                .upsert(
                    {
                        id: user.id,
                        full_name: data.fullName?.trim(),
                        country: data.country?.trim(),
                        club: data.club?.trim() || null,
                    },
                    { onConflict: "id" }
                );

            if (upsertError) {
                setFormError(upsertError.message);
                return;
            }

            router.push(`/${locale}/new-visitor/save-continue`);
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
                <div className={css.profile_edit_form_items}>
                    <div className={css.profile_edit_form_item}>
                        <FormField
                            id="email"
                            name="email"
                            label="Email"
                            placeholder="Enter your email"
                            type="email"
                            register={register}
                            defaultValue={currentEmail}
                            rules={emailRules}
                            error={errors?.email?.message as string}
                            disabled={!canUseSupabase}
                        />
                        <button
                            className={css.profile_edit_form_item_button}
                            type="button"
                            disabled={!canUseSupabase}
                        >
                            Change email
                        </button>
                    </div>
                    <div className={css.profile_edit_form_item}>
                        <FormField
                            id="password"
                            name="password"
                            label="Password"
                            placeholder="Enter your password"
                            type="password"
                            register={register}
                            rules={passwordRules}
                            error={errors?.password?.message as string}
                            disabled={!canUseSupabase}
                        />
                        <button
                            className={css.profile_edit_form_item_button}
                            type="button"
                            disabled={!canUseSupabase}
                        >
                            Change password
                        </button>
                    </div>
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
                            label="Kingdom (State/Country)*"
                            placeholder="Select your country"
                            rules={{
                                required: "Country is required",
                            }}
                            error={errors?.country?.message as string}
                            disabled={!canUseSupabase}
                        />
                    </div>
                    <div className={css.profile_edit_form_item}>
                        <CustomDropdown
                            id="club"
                            name="club"
                            options={clubs}
                            register={register}
                            label="Club"
                            placeholder="Select your club"
                            disabled={!canUseSupabase}
                        />
                    </div>
                </div>
                <div className={css.profile_edit_form_buttons}>
                    <Button
                        type="button"
                        buttonType="primary"
                        className={css.profile_edit_form_buttons_button}
                        disabled={isSubmitting}
                    >
                        Skip for now
                    </Button>
                    <Button
                        type="submit"
                        buttonType="secondary"
                        className={css.profile_edit_form_buttons_button}
                        disabled={isSubmitting || !canUseSupabase}
                    >
                        {isSubmitting ? "Saving..." : "Save & Continue"}
                    </Button>
                </div>
            </form>
        </div>
    );
};
