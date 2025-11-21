import React from "react";
import css from "../ui/styles.module.scss";
import { RootLink } from "@/shared/ui/links/root-link";

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
                Complete your player profile
            </h2>
            <p className={css.home_new_visitor_description}>
                Add your details so other players and organizers can recognize
                you in rankings and tournaments.
            </p>
            <RootLink className={css.home_new_visitor_skip_link} href="/">
                Skip for now
            </RootLink>
        </div>
    );
};
