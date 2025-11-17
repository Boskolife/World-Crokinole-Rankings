import React from "react";
import css from "./styles.module.scss";
import { Button, FormField, RootLink } from "@/shared/ui";
import { useForm } from "react-hook-form";
import { ISignInFormData } from "@/shared/types";
import { useRouter } from "next/navigation";
import { useLocale } from "next-intl";

export const SignInForm: React.FC = () => {
    const router = useRouter();
    const locale = useLocale();

    const {
        register,
        formState: { errors },
        handleSubmit,
    } = useForm<ISignInFormData>();

    const onSubmit = (data: ISignInFormData) => {
        console.log(data);
        router.push(`/${locale}/new-visitor/step-3`);
    };
    return (
        <form
            noValidate
            onSubmit={handleSubmit(onSubmit)}
            className={css.auth_form}
        >
            <p className={css.auth_form_title}>Welcome back</p>
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
            <RootLink href="#" className={css.auth_form_forgot_password_link}>
                Forgot your password?
            </RootLink>
            <Button
                type="submit"
                buttonType="white"
                className={css.auth_form_button}
                onClick={() => handleSubmit(onSubmit)}
            >
                Sign in
            </Button>
            <Button
                buttonType="transparent"
                className={css.auth_form_button}
                onClick={() => handleSubmit(onSubmit)}
                icon="google_icon"
            >
                Continue with Google
            </Button>
            <p className={css.auth_form_sign_in}>
                New here?{" "}
                <RootLink href="#" className={css.auth_form_sign_in_link}>
                    Create account
                </RootLink>
            </p>
        </form>
    );
};
