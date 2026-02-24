import React from "react";
import css from "../ui/styles.module.scss";

export const Step5: React.FC = () => {
    return (
        <div className={css.home_new_visitor_content}>
            <div className={css.home_new_visitor_steps}>
                <span>Step</span>
                <div className={css.home_new_visitor_steps_number}>
                    <span>5</span>
                    <span>/</span>
                    <span>5</span>
                </div>
            </div>
            <h2 className={css.home_new_visitor_title}>
                Choose your membership
            </h2>
            <p className={css.home_new_visitor_description}>
                Pick a plan that fits you. Climb the rankings and claim the crown.
            </p>
        </div>
    );
};
