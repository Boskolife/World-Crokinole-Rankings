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
import stepCss from "@/widgets/home-new-visitor/ui/styles.module.scss";
import { Icon } from "@/shared/ui/icons";
import css from "./styles.module.scss";

export const ResetPasswordForm: React.FC = () => {
    const locale = useLocale();
    const router = useRouter();

    const [formError, setFormError] = useState<string | null>(null);
    const [isSubmitting, setIsSubmitting] = useState(false);
    const [isCheckingSession, setIsCheckingSession] = useState(true);
    const [hasRecoverySession, setHasRecoverySession] = useState(false);
    const [recoveryEmail, setRecoveryEmail] = useState<string>("");
    const [isSuccess, setIsSuccess] = useState(false);

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
                setRecoveryEmail("");
                setIsSuccess(false);
                setIsCheckingSession(false);
                return;
            }

            try {
                const authAny = supabase.auth as any;
                const getSessionFromUrlFn =
                    typeof authAny?.getSessionFromUrl === "function"
                        ? authAny.getSessionFromUrl.bind(authAny)
                        : null;

                const result = getSessionFromUrlFn
                    ? await getSessionFromUrlFn()
                    : await supabase.auth.getSession();

                const { data, error } = result as {
                    data: { session: any } | null;
                    error: { message: string } | null;
                };

                if (!isActive) return;

                if (error || !data?.session) {
                    setHasRecoverySession(false);
                    setIsSuccess(false);
                    setRecoveryEmail("");
                    setFormError(
                        "This password reset link is invalid or has expired."
                    );
                    setIsCheckingSession(false);
                    return;
                }

                setHasRecoverySession(true);
                setRecoveryEmail(data.session.user?.email ?? "");
                setIsSuccess(false);
                setIsCheckingSession(false);
            } catch {
                if (!isActive) return;
                setHasRecoverySession(false);
                setIsSuccess(false);
                setRecoveryEmail("");
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

            setIsSuccess(true);
        } catch {
            setFormError(
                "Could not reach Supabase. Please check NEXT_PUBLIC_SUPABASE_URL and your DNS/Internet connection."
            );
        } finally {
            setIsSubmitting(false);
        }
    };

    const onBackToDashboard = () => {
        router.push(`/${locale}${clientRoutes.dashboard}`);
    };

    return (
        <>
            {isSuccess ? (
                <div className={css.auth_form_success_wrapper}>
                    <div className={css.auth_form_success_icon}>
                        <img
                            src="https://www.figma.com/api/mcp/asset/c5c7c5f0-94b8-406b-9da4-e25ba207543a"
                            alt=""
                            width={100}
                            height={100}
                        />
                    </div>

                    <h2 className={css.auth_form_success_title}>
                        Password Changed
                    </h2>
                    <p className={css.auth_form_success_subtitle}>
                        Your password has been changed successfully.
                    </p>

                    <Button
                        type="button"
                        buttonType="white"
                        className={css.auth_form_success_button}
                        onClick={onBackToDashboard}
                    >
                        Back to Dashboard
                    </Button>
                </div>
            ) : (
                <form
                    noValidate
                    onSubmit={handleSubmit(onSubmit)}
                    className={css.auth_form}
                >
                    {formError && (
                        <div className={css.auth_form_error}>{formError}</div>
                    )}

                    {isCheckingSession ? (
                        <div className={css.auth_form_fields}>Loading...</div>
                    ) : hasRecoverySession ? (
                        <div className={css.auth_form_reset_wrapper}>
                            <div className={css.auth_form_reset_title_block}>
                                <h2
                                    className={`${stepCss.home_new_visitor_title} ${css.auth_form_reset_title}`}
                                >
                                    Enter a New Password
                                </h2>

                                <div className={css.auth_form_reset_subtitle}>
                                    <p
                                        className={
                                            css.auth_form_reset_subtitle_regular
                                        }
                                    >
                                        Create a new password for
                                    </p>
                                    <p
                                        className={
                                            css.auth_form_reset_subtitle_email
                                        }
                                    >
                                        {recoveryEmail || "—"}
                                    </p>
                                </div>
                            </div>

                            <div className={css.auth_form_reset_input}>
                                <FormField
                                    id="password"
                                    name="password"
                                    type="password"
                                    placeholder="Create password (8+ characters)"
                                    register={register}
                                    hideClearButton
                                    rules={{
                                        required: "Password is required",
                                        minLength: {
                                            value: 8,
                                            message:
                                                "Password must be at least 8 characters long",
                                        },
                                    }}
                                    error={
                                        errors.password?.message as string
                                    }
                                />
                            </div>

                            <Button
                                type="submit"
                                buttonType="white"
                                className={`${css.auth_form_button} ${css.auth_form_reset_button}`}
                                disabled={
                                    isSubmitting ||
                                    !isSupabaseConfigured ||
                                    !passwordValue?.trim() ||
                                    passwordValue?.trim().length < 8
                                }
                            >
                                {isSubmitting ? "Changing..." : "Change Password"}
                            </Button>
                        </div>
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
            )}
        </>
    );
};

