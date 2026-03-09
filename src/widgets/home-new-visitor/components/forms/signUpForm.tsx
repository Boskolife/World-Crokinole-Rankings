import React, { useState } from "react";
import css from "./styles.module.scss";
import { Button, CustomCheckbox, FormField, RootLink } from "@/shared/ui";
import { useForm } from "react-hook-form";
import { ISignUpFormData } from "@/shared/types";
import { useRouter } from "next/navigation";
import { usePathname } from "next/navigation";
import { useLocale } from "next-intl";
import { clientRoutes } from "@/shared/routes/client";
import {
    supabase,
    isSupabaseConfigured,
    supabaseConfigError,
} from "@/shared/supabase/client";
import { useUserProfile } from "@/shared/hooks/use-user-profile";
import cn from "classnames";
import type { SubscriptionPlan } from "@/shared/types";

const getPlanLabel = (plan?: SubscriptionPlan): string => {
    switch (plan) {
        case "premium":
            return "Premium";
        case "administrator":
            return "Administrator";
        default:
            return "Standard";
    }
};

export const SignUpForm: React.FC = () => {
    const router = useRouter();
    const pathname = usePathname();
    const locale = useLocale();
    const { profile } = useUserProfile();
    const [formError, setFormError] = useState<string | null>(null);
    const [isSubmitting, setIsSubmitting] = useState(false);

    const {
        register,
        formState: { errors },
        handleSubmit,
    } = useForm<ISignUpFormData>();

    const onSubmit = async (data: ISignUpFormData) => {
        if (!isSupabaseConfigured) {
            setFormError(supabaseConfigError ?? "Supabase is not configured");
            return;
        }

        setFormError(null);
        setIsSubmitting(true);

        try {
            const { error, data: authData } = await supabase.auth.signUp({
                email: data.email,
                password: data.password,
            });

            if (error) {
                setFormError(error.message);
                return;
            }

            if (authData?.user?.id) {
                try {
                    await fetch("/api/ensure-player", { method: "POST" });
                } catch {
                    // ignore
                }
            }
            router.push(`/${locale}${clientRoutes.steps(3)}`);
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
            <p className={css.auth_form_title}>Join the rankings</p>
            {profile?.subscription_plan && (
                <div className={css.auth_form_plan_badge_wrapper}>
                    <span className={cn(css.auth_form_plan_badge, {
                        [css.auth_form_plan_badge_premium]: profile.subscription_plan === "premium",
                        [css.auth_form_plan_badge_administrator]: profile.subscription_plan === "administrator",
                    })}>
                        Current Plan: {getPlanLabel(profile.subscription_plan)}
                    </span>
                </div>
            )}
            {formError && <div className={css.auth_form_error}>{formError}</div>}
            <div className={css.auth_form_fields}>
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
                <FormField
                    id="password"
                    name="password"
                    type="password"
                    placeholder="Create a password (8+ characters)"
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
            </div>
            <CustomCheckbox
                name="agreeToTerms"
                label="I agree to the Terms of Use and Privacy Policy."
                register={register}
                rules={{
                    required:
                        "You must agree to the Terms of Use and Privacy Policy",
                }}
                error={errors.agreeToTerms?.message as string}
            />
            <Button
                type="submit"
                buttonType="white"
                className={css.auth_form_button}
                disabled={isSubmitting}
            >
                {isSubmitting ? "Loading..." : "Continue"}
            </Button>
            <Button
                buttonType="transparent"
                className={css.auth_form_button}
                disabled={isSubmitting || !isSupabaseConfigured}
                onClick={async () => {
                    if (!isSupabaseConfigured) {
                        setFormError(
                            supabaseConfigError ?? "Supabase is not configured"
                        );
                        return;
                    }
                    setFormError(null);
                    setIsSubmitting(true);
                    try {
                        const next = `/${locale}${clientRoutes.steps(3)}`;
                        const redirectTo = `${window.location.origin}/auth/callback?next=${encodeURIComponent(next)}`;
                        const { error } = await supabase.auth.signInWithOAuth({
                            provider: "google",
                            options: { redirectTo },
                        });
                        if (error) setFormError(error.message);
                    } catch {
                        setFormError(
                            "Could not reach Supabase. Please check NEXT_PUBLIC_SUPABASE_URL and your DNS/Internet connection."
                        );
                    } finally {
                        setIsSubmitting(false);
                    }
                }}
                icon="google_icon"
            >
                Continue with Google
            </Button>
            <p className={css.auth_form_sign_in}>
                Already have an account?{" "}
                <RootLink
                    href={
                        pathname.includes("/auth/")
                            ? clientRoutes.signIn
                            : `${clientRoutes.steps(2)}?mode=signIn`
                    }
                    className={css.auth_form_sign_in_link}
                >
                    Sign in
                </RootLink>
            </p>
        </form>
    );
};
