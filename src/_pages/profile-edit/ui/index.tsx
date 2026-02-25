"use client";

import React from "react";
import { ProfileEdit } from "@/widgets/home-new-visitor/profile-edit/ProfileEdit";
import { RootLink } from "@/shared/ui/links/root-link";
import { clientRoutes } from "@/shared/routes/client";
import css from "./styles.module.scss";

export function ProfileEditPage() {
    return (
        <div className="container">
            <section className={css.profile_edit_page}>
                <div className={css.profile_edit_page_header}>
                    <h1 className={css.profile_edit_page_title}>Edit profile</h1>
                    <RootLink
                        href={clientRoutes.profile}
                        className={css.profile_edit_page_back}
                    >
                        ← Back to profile
                    </RootLink>
                </div>
                <ProfileEdit
                    successRedirect={clientRoutes.profile}
                    showSkip={false}
                />
            </section>
        </div>
    );
}
