"use client";

import React from "react";
import css from "../profile-details/styles.module.scss";
import Image from "next/image";
import { IPlayer } from "@/shared/types/player.interface";

const AVATAR_PLACEHOLDER = "/svg/avatar-placeholder.svg";

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

interface PlayerProfileViewProps {
    player: IPlayer;
    singlesRatingFromMatches?: number;
    doublesRatingFromMatches?: number;
    actions?: React.ReactNode;
}

export const PlayerProfileView: React.FC<PlayerProfileViewProps> = ({
    player,
    singlesRatingFromMatches,
    doublesRatingFromMatches,
    actions,
}) => {
    const kingdom = player.kingdom || "-";
    const avatarSrc =
        player.avatarUrl?.trim() || AVATAR_PLACEHOLDER;
    const singlesRating =
        singlesRatingFromMatches ?? player.singlesRating ?? player.rating;
    const doublesRating =
        doublesRatingFromMatches ?? player.doublesRating;
    const combinedRating =
        player.combinedRating != null ? player.combinedRating : player.rating;

    return (
        <div className="container">
            <div className={css.profile_details_content}>
                <div className={css.profile_details_left}>
                    <div className={css.profile_details_left_profile}>
                        <Image
                            src={avatarSrc}
                            alt={player.name}
                            width={164}
                            height={164}
                            className={css.profile_details_left_profile_image}
                            unoptimized={avatarSrc.includes("supabase.co")}
                        />
                        <div className={css.profile_details_left_profile_info}>
                            <h4
                                className={
                                    css.profile_details_left_profile_name
                                }
                            >
                                {player.name}
                            </h4>
                            <span
                                className={
                                    css.profile_details_left_profile_role
                                }
                            >
                                {kingdom === "-"
                                    ? "👑 King"
                                    : `👑 King of ${kingdom}`}
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
                        <InfoItem label="Singles Rating" value={singlesRating} />
                        <InfoItem label="Doubles Rating" value={doublesRating} />
                        <InfoItem label="Combined Rating" value={combinedRating} />
                        <InfoItem
                            label="Club"
                            value={(() => {
                                const raw = (player.club?.trim() || player.clubTitle || "").trim();
                                return !raw || /^[\s,]*$/.test(raw) ? undefined : raw;
                            })()}
                        />
                        <InfoItem label="Kingdom" value={kingdom} />
                        {(player.singlesPlayed != null || player.doublesPlayed != null) && (
                            <>
                                <InfoItem label="Singles (W–L)" value={player.singlesWon != null && player.singlesPlayed != null ? `${player.singlesWon}–${player.singlesPlayed - player.singlesWon}` : undefined} />
                                <InfoItem label="Singles Win %" value={player.winPctSingles} />
                                <InfoItem label="Doubles (W–L)" value={player.doublesWon != null && player.doublesPlayed != null ? `${player.doublesWon}–${player.doublesPlayed - player.doublesWon}` : undefined} />
                                <InfoItem label="Doubles Win %" value={player.winPctDoubles} />
                                <InfoItem label="Total (W–L)" value={player.totalWon != null && player.totalPlayed != null ? `${player.totalWon}–${player.totalPlayed - player.totalWon}` : undefined} />
                                <InfoItem label="Total Win %" value={player.winPctTotal} />
                            </>
                        )}
                        {player.gender?.trim() && <InfoItem label="Gender" value={player.gender} />}
                    </div>
                </div>
            </div>
        </div>
    );
};
