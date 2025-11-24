import React from "react";
import css from "./styles.module.scss";
import { SubscribePlans } from "@/shared/modules";

export const Plans: React.FC = () => {
    return (
        <div className={css.plans}>
            <div className="container">
                <h2 className={css.plans_title}>
                    Upgrade to Premium to create ranked events and unlock more
                    features
                </h2>
            </div>
            <SubscribePlans className={css.plans_list} />
        </div>
    );
};
