import React from "react";
import css from "./styles.module.scss";
import { ProfileDetails } from "@/shared/modules";

export const Account: React.FC = () => {
    return (
        <div className={css.account}>
            <div className="container">
                <h2 className={css.account_title}>My player account</h2>
            </div>
            <ProfileDetails />
        </div>
    );
};
