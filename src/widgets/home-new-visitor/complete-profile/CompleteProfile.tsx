import React from "react";
import css from "./styles.module.scss";
import { ProfileInfo } from "../profile-info/ProfileInfo";
import { ProfileEdit } from "../profile-edit/ProfileEdit";

export const CompleteProfile: React.FC = () => {
    return (
        <section className={css.complete_profile}>
            <div className="container">
                <div className={css.complete_profile_content}>
                    <ProfileInfo />
                    <ProfileEdit />
                </div>
            </div>
        </section>
    );
};
