import React from "react";
import css from "./styles.module.scss";
import { FormField } from "@/shared/ui/input";
import { useForm } from "react-hook-form";
import { Button, CustomDropdown } from "@/shared/ui";
import { useProfileInfo } from "../hooks/use-profile-info";
import { IProfileEditFormData } from "@/shared/types";
import { useAuth } from "@/shared/hooks";
import { useRouter } from "next/navigation";
import { useParams } from "next/navigation";
import { localeConfig } from "@/app/localization/config";

export const ProfileEdit: React.FC = () => {
    const {
        register,
        formState: { errors },
        handleSubmit,
    } = useForm<IProfileEditFormData>();

    const { countries, clubs } = useProfileInfo();
    const { login } = useAuth();
    const router = useRouter();
    const params = useParams() as { locale?: string };
    const locale = params?.locale || (localeConfig.defaultLocale as string);
    
    const onSubmit = (data: IProfileEditFormData) => {
        console.log(data);
        login();
        router.push(`/${locale}/dashboard`);
    };

    return (
        <div className={css.profile_edit}>
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
                            rules={{
                                required: "Email is required",
                                pattern: {
                                    value: /^[^\s@]+@[^\s@]+\.[^\s@]+$/,
                                    message: "Invalid email address",
                                },
                            }}
                            error={errors?.email?.message as string}
                        />
                        <button className={css.profile_edit_form_item_button}>
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
                            rules={{
                                required: "Password is required",
                                minLength: {
                                    value: 8,
                                    message:
                                        "Password must be at least 8 characters long",
                                },
                            }}
                            error={errors?.password?.message as string}
                        />
                        <button className={css.profile_edit_form_item_button}>
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
                        />
                    </div>
                </div>
                <div className={css.profile_edit_form_buttons}>
                    <Button
                        type="button"
                        buttonType="primary"
                        className={css.profile_edit_form_buttons_button}
                    >
                        Skip for now
                    </Button>
                    <Button
                        type="submit"
                        buttonType="secondary"
                        className={css.profile_edit_form_buttons_button}
                    >
                        Save & Continue
                    </Button>
                </div>
            </form>
        </div>
    );
};
