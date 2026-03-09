"use client";

import React from "react";
import Image from "next/image";
import css from "@/shared/modules/profile-details/styles.module.scss";
import type { IProfile } from "@/shared/types/profile.interface";

function InfoItem({
    label,
    value,
}: {
    label: string;
    value: string | number | null | undefined;
}) {
    const display =
        value === null || value === undefined || value === ""
            ? "—"
            : String(value);
    return (
        <div className={css.profile_details_right_info_item}>
            <span className={css.profile_details_right_info_item_label}>
                {label}
            </span>
            <p className={css.profile_details_right_info_item_value}>
                {display}
            </p>
        </div>
    );
}

interface SaveContinueFallbackProps {
    fullName: string;
    profile: IProfile | null;
    actions?: React.ReactNode;
}

export const SaveContinueFallback: React.FC<SaveContinueFallbackProps> = ({
    fullName,
    profile,
    actions,
}) => {
    const avatarSrc =
        profile?.avatar_url?.trim() || "/svg/avatar-placeholder.svg";
    const kingdom = profile?.country || "—";
    const club = profile?.club || "—";

    return (
        <div className="container">
            <div className={css.profile_details_content}>
                <div className={css.profile_details_left}>
                    <div className={css.profile_details_left_profile}>
                        <Image
                            src={avatarSrc}
                            alt="Profile"
                            width={164}
                            height={164}
                            className={css.profile_details_left_profile_image}
                            unoptimized={avatarSrc.includes("supabase.co")}
                        />
                        <div className={css.profile_details_left_profile_info}>
                            <h4 className={css.profile_details_left_profile_name}>
                                {fullName || "—"}
                            </h4>
                            <span className={css.profile_details_left_profile_role}>
                                {kingdom === "—" ? "👑 King" : `👑 King of ${kingdom}`}
                            </span>
                        </div>
                    </div>
                    {actions && (
                        <div className={css.profile_details_left_buttons}>
                            {actions}
                        </div>
                    )}
                </div>
                <div className={css.profile_details_right}>
                    <div className={css.profile_details_right_info}>
                        <InfoItem label="Singles Rating" value={null} />
                        <InfoItem label="Doubles Rating" value={null} />
                        <InfoItem label="Combined Rating" value={null} />
                        <InfoItem label="Club" value={club} />
                        <InfoItem label="Kingdom" value={kingdom} />
                    </div>
                </div>
            </div>
        </div>
    );
};
