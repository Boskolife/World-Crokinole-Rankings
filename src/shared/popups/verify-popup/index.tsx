import React from "react";
import css from "../styles.module.scss";
import { Icon } from "@/shared/ui/icons";
import { Button, FormField, RootLink } from "@/shared/ui";
import { useForm } from "react-hook-form";
import { usePopup } from "@/shared/contexts/popup-context";
import cn from "classnames";

export const VerifyPopup: React.FC = () => {
    const { closePopup, openPopup, closeAllPopups } = usePopup();
    const {
        register,
        handleSubmit,
        formState: { errors },
    } = useForm<{ email: string }>();

    const onSubmit = (data: { email: string }) => {
        console.log("submit", data);
        openPopup("verify-code", { email: data.email });
        closePopup("verify");
        // Здесь будет логика отправки формы
    };

    const handleManualReview = (e: React.MouseEvent<HTMLAnchorElement>) => {
        openPopup("manual-review");
        e.preventDefault();
        closePopup("verify");
    };

    return (
        <div className={css.popup}>
            <div className={css.popup_close}>
                <Icon
                    name="x"
                    className={css.popup_close_icon}
                    onClick={() => closeAllPopups()}
                />
            </div>
            <div className={css.popup_content}>
                <h2>Verify your identity</h2>
                <p>
                    Enter the email previously used with your tournament
                    records. We’ll send a 6-digit code.
                </p>
                <form
                    noValidate
                    onSubmit={handleSubmit(onSubmit)}
                    className={css.popup_form}
                >
                    <FormField
                        className={css.popup_form_field}
                        id="email-verify"
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
                        error={errors.email?.message}
                    />
                    <div className={css.popup_buttons}>
                        <Button
                            buttonType="primary"
                            type="button"
                            className={cn(
                                css.popup_buttons_cancel,
                                css.popup_button
                            )}
                            onClick={() => closePopup("verify")}
                        >
                            Cancel
                        </Button>
                        <Button
                            buttonType="secondary"
                            type="submit"
                            className={cn(
                                css.popup_buttons_send,
                                css.popup_button
                            )}
                        >
                            Send code
                        </Button>
                    </div>
                </form>
                <p>
                    I don’t have access to that email{" "}
                    <RootLink
                        href="#"
                        className={css.popup_link}
                        onClick={handleManualReview}
                    >
                        Request manual review
                    </RootLink>
                </p>
            </div>
        </div>
    );
};
