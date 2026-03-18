"use client";

import React, { useEffect, useMemo, useState } from "react";
import { Button, FormField } from "@/shared/ui";
import { useForm } from "react-hook-form";
import { IForgotPasswordFormData } from "@/shared/types";
import { useLocale } from "next-intl";
import {
    supabase,
    isSupabaseConfigured,
    supabaseConfigError,
} from "@/shared/supabase/client";
import { clientRoutes } from "@/shared/routes/client";
import { useRouter } from "next/navigation";
import stepCss from "@/widgets/home-new-visitor/ui/styles.module.scss";
import css from "./styles.module.scss";

export const ForgotPasswordForm: React.FC = () => {
    const locale = useLocale();
    const router = useRouter();
    const [formError, setFormError] = useState<string | null>(null);
    const [isSubmitting, setIsSubmitting] = useState(false);
    const [isSent, setIsSent] = useState(false);
    const [sentEmail, setSentEmail] = useState<string>("");
    const [resendSeconds, setResendSeconds] = useState<number>(0);
    const [isResending, setIsResending] = useState(false);

    const {
        register,
        watch,
        formState: { errors },
        handleSubmit,
    } = useForm<IForgotPasswordFormData>();

    const emailValue = watch("email");
    const canSubmit =
        isSupabaseConfigured &&
        !isSubmitting &&
        Boolean(emailValue?.trim()) &&
        !isSent;

    const formatCountdown = useMemo(() => {
        return (totalSeconds: number) => {
            const mm = Math.floor(totalSeconds / 60);
            const ss = totalSeconds % 60;
            const mmStr = String(mm).padStart(2, "0");
            const ssStr = String(ss).padStart(2, "0");
            return `${mmStr}:${ssStr}`;
        };
    }, []);

    const canResend = isSent && !isResending && resendSeconds === 0;

    useEffect(() => {
        if (!isSent) return;
        if (resendSeconds <= 0) return;
        const intervalId = window.setInterval(() => {
            setResendSeconds((prev) => (prev > 0 ? prev - 1 : 0));
        }, 1000);

        return () => window.clearInterval(intervalId);
    }, [isSent, resendSeconds]);

    const getRedirectTo = () => {
        return `${window.location.origin}/${locale}${clientRoutes.resetPassword}`;
    };

    const onSubmit = async (data: IForgotPasswordFormData) => {
        if (!isSupabaseConfigured) {
            setFormError(supabaseConfigError ?? "Supabase is not configured");
            return;
        }

        setFormError(null);
        setIsSubmitting(true);

        try {
            const { error } = await supabase.auth.resetPasswordForEmail(
                data.email,
                { redirectTo: getRedirectTo() }
            );

            if (error) {
                setFormError(error.message);
                return;
            }

            setSentEmail(data.email);
            setIsSent(true);
            setResendSeconds(53);
        } catch {
            setFormError(
                "Could not reach Supabase. Please check NEXT_PUBLIC_SUPABASE_URL and your DNS/Internet connection."
            );
        } finally {
            setIsSubmitting(false);
        }
    };

    const onResend = async () => {
        if (!sentEmail || !isSupabaseConfigured) return;
        if (!canResend) return;

        setFormError(null);
        setIsResending(true);
        setResendSeconds(53);

        try {
            const { error } = await supabase.auth.resetPasswordForEmail(
                sentEmail,
                { redirectTo: getRedirectTo() }
            );
            if (error) setFormError(error.message);
        } catch {
            setFormError(
                "Could not reach Supabase. Please check NEXT_PUBLIC_SUPABASE_URL and your DNS/Internet connection."
            );
        } finally {
            setIsResending(false);
        }
    };

    const onContinue = () => {
        router.push(`/${locale}${clientRoutes.signIn}`);
    };

    const countdownText = formatCountdown(resendSeconds);
    const resendLabel = canResend
        ? "Resend"
        : `Resend in ${countdownText}`;

    return (
        <>
            {!isSent ? (
                <form
                    noValidate
                    onSubmit={handleSubmit(onSubmit)}
                    className={css.auth_form}
                >
                    {formError && (
                        <div className={css.auth_form_error}>{formError}</div>
                    )}

                    <h2
                        className={`${stepCss.home_new_visitor_title} ${css.auth_form_initial_title}`}
                    >
                        Forgot Password?
                    </h2>
                    <p
                        className={`${stepCss.home_new_visitor_description} ${css.auth_form_initial_description}`}
                    >
                        Enter your email address and we&apos;ll send you a link
                        to reset your password.
                    </p>

                    <div className={css.auth_form_initial_content}>
                        <div className={css.auth_form_forgot_fields}>
                            <FormField
                                id="email"
                                name="email"
                                type="email"
                                placeholder="Enter your email"
                                register={register}
                                rules={{
                                    required: "Email is required",
                                    pattern: {
                                        value: /^[^\s@]+@[^\s@]+\.[^\s@]+$/,
                                        message: "Invalid email address",
                                    },
                                }}
                                error={errors.email?.message as string}
                            />
                        </div>

                        <Button
                            type="submit"
                            buttonType="white"
                            className={`${css.auth_form_button} ${css.auth_form_forgot_password_button} ${css.auth_form_forgot_continue_button}`}
                            disabled={!canSubmit}
                        >
                            {isSubmitting ? "Sending..." : "Continue"}
                        </Button>
                    </div>
                </form>
            ) : (
                <div className={css.auth_form_sent_wrapper}>
                    <div className={css.auth_form_mail_icon}>
                        <svg
                            xmlns="http://www.w3.org/2000/svg"
                            width="100"
                            height="100"
                            viewBox="0 0 100 100"
                            fill="none"
                        >
                            <path
                                d="M91.6668 31.396V70.8335C91.667 74.0219 90.4488 77.0898 88.2615 79.4096C86.0742 81.7294 83.0831 83.1256 79.9002 83.3127L79.1668 83.3335H20.8335C17.6451 83.3337 14.5772 82.1155 12.2574 79.9281C9.93763 77.7408 8.54138 74.7497 8.35433 71.5668L8.3335 70.8335V31.396L47.6877 57.6335L48.171 57.9085C48.7406 58.1868 49.3662 58.3315 50.0002 58.3315C50.6341 58.3315 51.2597 58.1868 51.8293 57.9085L52.3127 57.6335L91.6668 31.396Z"
                                fill="#00284B"
                            />
                            <path
                                d="M79.1667 16.6667C83.6667 16.6667 87.6125 19.0417 89.8125 22.6126L50 49.1542L10.1875 22.6126C11.2325 20.916 12.6679 19.4938 14.3741 18.4646C16.0802 17.4354 18.0077 16.829 19.9958 16.6959L20.8333 16.6667H79.1667Z"
                                fill="#00284B"
                            />
                        </svg>
                    </div>

                    <div className={css.auth_form_sent_text}>
                        <h2
                            className={`${stepCss.home_new_visitor_title} ${css.auth_form_sent_title}`}
                        >
                            Check Your Inbox
                        </h2>
                        <div className={css.auth_form_sent_subtitle}>
                            <p className={css.auth_form_sent_subtitle_regular}>
                                A link to reset your password was sent to
                            </p>
                            <p className={css.auth_form_sent_subtitle_email}>
                                {sentEmail}
                            </p>
                        </div>
                    </div>

                    <div className={css.auth_form_sent_actions}>
                        <div className={css.auth_form_resend_line}>
                            <span className={css.auth_form_resend_text}>
                                Didn&apos;t get an email?
                            </span>
                            <button
                                type="button"
                                className={css.auth_form_resend_link}
                                onClick={onResend}
                                disabled={!canResend}
                            >
                                {resendLabel}
                            </button>
                        </div>

                        {formError && (
                            <div className={css.auth_form_error}>{formError}</div>
                        )}
                    </div>
                </div>
            )}
        </>
    );
};

