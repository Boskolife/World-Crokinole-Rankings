import React from "react";
import css from "./styles.module.scss";
import { Button, CustomCheckbox, FormField, RootLink } from "@/shared/ui";
import { useForm } from "react-hook-form";
import { ISignUpFormData } from "@/shared/types";
import { useRouter } from "next/navigation";
import { useLocale } from "next-intl";
import { clientRoutes } from "@/shared/routes/client";

export const SignUpForm: React.FC = () => {
    const router = useRouter();
    const locale = useLocale();

    const {
        register,
        formState: { errors },
        handleSubmit,
    } = useForm<ISignUpFormData>();
    const onSubmit = (data: ISignUpFormData) => {
        console.log(data);
        router.push(`/${locale}${clientRoutes.steps(3)}`);
    };
    return (
        <form
            noValidate
            onSubmit={handleSubmit(onSubmit)}
            className={css.auth_form}
        >
            <p className={css.auth_form_title}>Join the rankings</p>
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
                onClick={() => handleSubmit(onSubmit)}
            >
                Continue
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
                Already have an account?{" "}
                <RootLink href="#" className={css.auth_form_sign_in_link}>
                    Sign in
                </RootLink>
            </p>
        </form>
    );
};
