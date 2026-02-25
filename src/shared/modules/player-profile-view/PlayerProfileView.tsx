"use client";

import React from "react";
import css from "../profile-details/styles.module.scss";
import Image from "next/image";
import { IPlayer } from "@/shared/types/player.interface";

const AVATAR_PLACEHOLDER = "/svg/avatar-placeholder.svg";

interface PlayerProfileViewProps {
    player: IPlayer;
}

export const PlayerProfileView: React.FC<PlayerProfileViewProps> = ({
    player,
}) => {
    const kingdom = player.kingdom || "-";
    const club = player.club || "-";
    const avatarSrc =
        player.avatarUrl?.trim() || AVATAR_PLACEHOLDER;

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
                </div>
                <div className={css.profile_details_right}>
                    <div className={css.profile_details_right_info}>
                        <div className={css.profile_details_right_info_item}>
                            <span
                                className={
                                    css.profile_details_right_info_item_label
                                }
                            >
                                Singles Rating
                            </span>
                            <p
                                className={
                                    css.profile_details_right_info_item_value
                                }
                            >
                                {player.rating}
                            </p>
                        </div>
                        <div className={css.profile_details_right_info_item}>
                            <span
                                className={
                                    css.profile_details_right_info_item_label
                                }
                            >
                                Club
                            </span>
                            <p
                                className={
                                    css.profile_details_right_info_item_value
                                }
                            >
                                {club}
                            </p>
                        </div>
                        <div className={css.profile_details_right_info_item}>
                            <span
                                className={
                                    css.profile_details_right_info_item_label
                                }
                            >
                                Kingdom
                            </span>
                            <p
                                className={
                                    css.profile_details_right_info_item_value
                                }
                            >
                                {kingdom}
                            </p>
                        </div>
                    </div>
                </div>
            </div>
        </div>
    );
};
