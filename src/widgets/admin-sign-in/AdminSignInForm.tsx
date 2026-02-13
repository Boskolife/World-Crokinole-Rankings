"use client";

import React, { useState, useEffect } from "react";
import { useForm } from "react-hook-form";
import { useRouter, useParams } from "next/navigation";
import { FormField, Button } from "@/shared/ui";
import { useAuth } from "@/shared/hooks";
import {
    supabase,
    isSupabaseConfigured,
    supabaseConfigError,
} from "@/shared/supabase/client";
import { localeConfig } from "@/app/localization/config";
import type { ISignInFormData } from "@/shared/types";
import css from "./styles.module.scss";

export const AdminSignInForm: React.FC = () => {
    const router = useRouter();
    const params = useParams() as { locale?: string };
    const locale = params?.locale ?? localeConfig.defaultLocale;
    const { isAuth, isMounted } = useAuth();

    useEffect(() => {
        if (isMounted && isAuth) {
            router.replace(`/${locale}/admin`);
        }
    }, [isMounted, isAuth, locale, router]);
    const [formError, setFormError] = useState<string | null>(null);
    const [isSubmitting, setIsSubmitting] = useState(false);

    const {
        register,
        formState: { errors },
        handleSubmit,
    } = useForm<ISignInFormData>();

    const onSubmit = async (data: ISignInFormData) => {
        if (!isSupabaseConfigured) {
            setFormError(supabaseConfigError ?? "Supabase is not configured");
            return;
        }
        setFormError(null);
        setIsSubmitting(true);
        try {
            const { error } = await supabase.auth.signInWithPassword({
                email: data.email,
                password: data.password,
            });
            if (error) {
                setFormError(error.message);
                return;
            }
            router.push(`/${locale}/admin`);
            router.refresh();
        } catch {
            setFormError("Something went wrong. Please try again.");
        } finally {
            setIsSubmitting(false);
        }
    };

    if (!isMounted || isAuth) {
        return (
            <div className={css.admin_sign_in_form_loading}>Loading...</div>
        );
    }

    return (
        <form
            noValidate
            onSubmit={handleSubmit(onSubmit)}
            className={css.admin_sign_in_form}
        >
            <h1 className={css.admin_sign_in_form_title}>Admin sign in</h1>
            {formError && (
                <div className={css.admin_sign_in_form_error} role="alert">
                    {formError}
                </div>
            )}
            <FormField
                id="admin-email"
                name="email"
                type="email"
                label="Email"
                placeholder="Admin email"
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
            <FormField
                id="admin-password"
                name="password"
                type="password"
                label="Password"
                placeholder="Password"
                register={register}
                rules={{ required: "Password is required" }}
                error={errors.password?.message as string}
            />
            <Button
                type="submit"
                buttonType="primary"
                className={css.admin_sign_in_form_submit}
                disabled={isSubmitting || !isSupabaseConfigured}
            >
                {isSubmitting ? "Signing in..." : "Sign in"}
            </Button>
        </form>
    );
};
