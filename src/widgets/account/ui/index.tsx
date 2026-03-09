"use client";

import React from "react";
import css from "./styles.module.scss";
import { PlayerProfileView } from "@/shared/modules";
import { RootLink } from "@/shared/ui";
import { clientRoutes } from "@/shared/routes/client";
import { useCurrentUserPlayer, useUserProfile } from "@/shared/hooks";
import { SaveContinueFallback } from "@/widgets/home-new-visitor/save-continue/SaveContinueFallback";
import cn from "classnames";
import profileDetailsCss from "@/shared/modules/profile-details/styles.module.scss";

const linkClass = cn(
    profileDetailsCss.profile_details_left_button,
    profileDetailsCss.profile_details_left_button_link
);
const linkPrimaryClass = cn(linkClass, profileDetailsCss.profile_details_left_button_link_primary);

export const Account: React.FC = () => {
    const { fullName, profile } = useUserProfile();
    const { player, isLoading } = useCurrentUserPlayer();

    const actions = (
        <>
            <RootLink href={clientRoutes.profileEdit} className={linkClass}>
                Edit profile
            </RootLink>
            {!player && (
                <RootLink href={clientRoutes.claimHistory} className={linkPrimaryClass}>
                    Claim history
                </RootLink>
            )}
        </>
    );

    if (isLoading) {
        return (
            <div className={css.account}>
                <div className="container">
                    <h2 className={css.account_title}>My player account</h2>
                    <div style={{ padding: "20px 0", textAlign: "center" }}>Loading...</div>
                </div>
            </div>
        );
    }

    return (
        <div className={css.account}>
            <div className="container">
                <h2 className={css.account_title}>My player account</h2>
            </div>
            {player ? (
                <PlayerProfileView player={player} actions={actions} />
            ) : (
                <SaveContinueFallback fullName={fullName} profile={profile} actions={actions} />
            )}
        </div>
    );
};
