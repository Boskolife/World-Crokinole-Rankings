"use client";

import React, { useEffect, useState } from "react";
import { Button, FormField, RootLink } from "@/shared/ui";
import { useForm } from "react-hook-form";
import { IResetPasswordFormData } from "@/shared/types";
import { useLocale } from "next-intl";
import { useRouter } from "next/navigation";
import {
    supabase,
    isSupabaseConfigured,
    supabaseConfigError,
} from "@/shared/supabase/client";
import { clientRoutes } from "@/shared/routes/client";
import css from "./styles.module.scss";

export const ResetPasswordForm: React.FC = () => {
    const locale = useLocale();
    const router = useRouter();

    const [formError, setFormError] = useState<string | null>(null);
    const [isSubmitting, setIsSubmitting] = useState(false);
    const [isCheckingSession, setIsCheckingSession] = useState(true);
    const [hasRecoverySession, setHasRecoverySession] = useState(false);

    const {
        register,
        watch,
        formState: { errors },
        handleSubmit,
    } = useForm<IResetPasswordFormData>();

    const passwordValue = watch("password");

    useEffect(() => {
        let isActive = true;

        const run = async () => {
            if (!isSupabaseConfigured) {
                if (!isActive) return;
                setFormError(supabaseConfigError ?? "Supabase is not configured");
                setHasRecoverySession(false);
                setIsCheckingSession(false);
                return;
            }

            try {
                const { data, error } = await supabase.auth.getSessionFromUrl();

                if (!isActive) return;

                if (error || !data?.session) {
                    setHasRecoverySession(false);
                    setFormError(
                        "This password reset link is invalid or has expired."
                    );
                    setIsCheckingSession(false);
                    return;
                }

                setHasRecoverySession(true);
                setIsCheckingSession(false);
            } catch {
                if (!isActive) return;
                setHasRecoverySession(false);
                setFormError(
                    "Could not verify the reset link. Please try requesting a new one."
                );
                setIsCheckingSession(false);
            }
        };

        run();

        return () => {
            isActive = false;
        };
    }, []);

    const onSubmit = async (data: IResetPasswordFormData) => {
        if (!isSupabaseConfigured) {
            setFormError(supabaseConfigError ?? "Supabase is not configured");
            return;
        }

        if (!hasRecoverySession) {
            setFormError(
                "This password reset link is invalid or has expired. Please request a new one."
            );
            return;
        }

        setFormError(null);
        setIsSubmitting(true);

        try {
            const { error } = await supabase.auth.updateUser({
                password: data.password,
            });

            if (error) {
                setFormError(error.message);
                return;
            }

            router.push(`/${locale}${clientRoutes.signIn}`);
        } catch {
            setFormError(
                "Could not reach Supabase. Please check NEXT_PUBLIC_SUPABASE_URL and your DNS/Internet connection."
            );
        } finally {
            setIsSubmitting(false);
        }
    };

    return (
        <form
            noValidate
            onSubmit={handleSubmit(onSubmit)}
            className={css.auth_form}
        >
            {formError && <div className={css.auth_form_error}>{formError}</div>}

            {isCheckingSession ? (
                <div className={css.auth_form_fields}>Loading...</div>
            ) : hasRecoverySession ? (
                <>
                    <div className={css.auth_form_fields}>
                        <FormField
                            id="password"
                            name="password"
                            type="password"
                            placeholder="Enter new password"
                            register={register}
                            rules={{
                                required: "Password is required",
                                minLength: {
                                    value: 8,
                                    message:
                                        "Password must be at least 8 characters long",
                                },
                            }}
                            error={errors.password?.message as string}
                        />
                        <FormField
                            id="confirmPassword"
                            name="confirmPassword"
                            type="password"
                            placeholder="Confirm new password"
                            register={register}
                            rules={{
                                required: "Confirmation is required",
                                validate: (v) =>
                                    v === passwordValue ||
                                    "Passwords do not match",
                            }}
                            error={errors.confirmPassword?.message as string}
                        />
                    </div>

                    <Button
                        type="submit"
                        buttonType="white"
                        className={css.auth_form_button}
                        disabled={isSubmitting || !isSupabaseConfigured}
                    >
                        {isSubmitting ? "Saving..." : "Continue"}
                    </Button>
                </>
            ) : (
                <p className={css.auth_form_sign_in}>
                    <RootLink
                        href={clientRoutes.signIn}
                        className={css.auth_form_sign_in_link}
                    >
                        Back to sign in
                    </RootLink>
                </p>
            )}
        </form>
    );
};

