import React from "react";
import css from "../styles.module.scss";
import { Icon } from "@/shared/ui/icons";
import { Button, FormField, RootLink, TextareaField } from "@/shared/ui";
import { useForm } from "react-hook-form";
import { usePopup } from "@/shared/contexts/popup-context";
import cn from "classnames";

export const ManualReviewPopup: React.FC = () => {
    const { closeAllPopups } = usePopup();
    const {
        register,
        handleSubmit,
        formState: { errors },
    } = useForm<{ email: string; link: string; message: string }>();

    const onSubmit = (data: {
        email: string;
        link: string;
        message: string;
    }) => {
        console.log("submit", data);
        closeAllPopups();
        // Здесь будет логика отправки формы
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
                <h2>Request manual review</h2>
                <p>Tell us more so we can verify your records.</p>
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
                    <FormField
                        className={css.popup_form_field}
                        id="link-review"
                        name="link"
                        type="text"
                        placeholder="Link to public profile (optional)"
                    />
                    <TextareaField
                        className={css.popup_form_field}
                        id="message-review"
                        name="message"
                        placeholder="Notes"
                    />
                    <div className={css.popup_buttons}>
                        <Button
                            buttonType="primary"
                            type="button"
                            className={cn(
                                css.popup_buttons_cancel,
                                css.popup_button
                            )}
                            onClick={() => closeAllPopups()}
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
                            Submit request
                        </Button>
                    </div>
                </form>
                <p>
                    I don’t have access to that email{" "}
                    <RootLink href="#" className={css.popup_link}>
                        Request manual review
                    </RootLink>
                </p>
            </div>
        </div>
    );
};
