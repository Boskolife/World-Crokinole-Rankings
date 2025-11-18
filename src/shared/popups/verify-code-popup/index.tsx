import React from "react";
import css from "../styles.module.scss";
import { Icon } from "@/shared/ui/icons";
import { Button, FormField, RootLink } from "@/shared/ui";
import { useForm } from "react-hook-form";
import { usePopup } from "@/shared/contexts/popup-context";
import cn from "classnames";

export const VerifyCodePopup: React.FC = () => {
    const { closePopup, openPopup, getPopupData, closeAllPopups } = usePopup();
    const {
        register,
        handleSubmit,
        formState: { errors },
    } = useForm<{ code: string }>();

    const email = getPopupData("verify-code")?.email as string;

    const handleSwitchToLinked = () => {
        closePopup("verify-code");
        openPopup("linked");
    };

    const handleSwitchToVerify = () => {
        closePopup("verify-code");
        openPopup("verify");
    };

    const onSubmit = (data: { code: string }) => {
        console.log("submit", data);
        handleSwitchToLinked();
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
                <h2>Enter verification code</h2>
                <p>We’ve sent a 6-digit code to {email}.</p>
                <form
                    onSubmit={handleSubmit(onSubmit)}
                    className={css.popup_form}
                >
                    <FormField
                        className={css.popup_form_field}
                        id="code-verify"
                        name="code"
                        type="text"
                        inputMode="numeric"
                        placeholder="6-digit code"
                        register={register}
                        maxLength={6}
                        rules={{
                            required: "Code is required",
                            pattern: {
                                value: /^\d{6}$/,
                                message: "Invalid code",
                            },
                            minLength: {
                                value: 6,
                                message: "Code must be 6 digits",
                            },
                        }}
                        error={errors.code?.message}
                    />
                    <div className={css.popup_buttons}>
                        <Button
                            buttonType="primary"
                            type="button"
                            className={cn(
                                css.popup_buttons_cancel,
                                css.popup_button
                            )}
                            onClick={handleSwitchToVerify}
                        >
                            Back
                        </Button>
                        <Button
                            buttonType="secondary"
                            type="submit"
                            className={cn(
                                css.popup_buttons_send,
                                css.popup_button
                            )}
                        >
                            Verify
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
