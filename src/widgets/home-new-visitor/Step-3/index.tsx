import React from "react";
import css from "../ui/styles.module.scss";

export const Step3: React.FC = () => {
    return (
        <div className={css.home_new_visitor_content}>
            <div className={css.home_new_visitor_steps}>
                <span>Step</span>
                <div className={css.home_new_visitor_steps_number}>
                    <span>3</span>
                    <span>/</span>
                    <span>5</span>
                </div>
            </div>
            <h2 className={css.home_new_visitor_title}>
                Choose your membership
            </h2>
            <p className={css.home_new_visitor_description}>
                Start your journey. Climb the rankings. Claim the crown
            </p>
        </div>
    );
};
