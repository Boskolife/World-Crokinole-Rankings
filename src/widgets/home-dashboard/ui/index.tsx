"use client";

import css from "./styles.module.scss";
import React from "react";

import cn from "classnames";

export const HomeDashboard: React.FC = () => {
    return (
        <section className={css.home_dashboard}>
            <div className={cn(css.home_dashboard_container, "container")}>
                <div className={css.home_dashboard_content}>
                    <h2 className={css.home_dashboard_title}>Dashboard</h2>
                </div>
            </div>
        </section>
    );
};
