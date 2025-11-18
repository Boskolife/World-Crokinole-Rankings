import React from "react";
import css from "../styles.module.scss";
import { Icon } from "@/shared/ui/icons";
import { usePopup } from "@/shared/contexts/popup-context";
import { Button } from "@/shared/ui";

export const LinkedPopup: React.FC = () => {
    const { closeAllPopups } = usePopup();

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
                <h2>History linked</h2>
                <p>Your previous matches have been added to your profile.</p>
                <div className={css.popup_content_buttons}>
                    <Button buttonType="secondary" className={css.popup_content_buttons_button}>
                        Continue to Dashboard
                    </Button>
                    <Button buttonType="primary" className={css.popup_content_buttons_button}>Verify another match</Button>
                </div>
            </div>
        </div>
    );
};
