"use client";
import React from "react";
import css from "./styles.module.scss";
import Image from "next/image";
import { RootLink } from "@/shared/ui";
import { clientRoutes } from "@/shared/routes/client";
import cn from "classnames";
import { useUserProfile } from "@/shared/hooks";

export const ProfileDetails: React.FC = () => {
    const { fullName, email, profile } = useUserProfile();
    const kingdom = profile?.country || "—";
    const club = profile?.club || "—";
    const avatarSrc =
        profile?.avatar_url?.trim() || "/svg/avatar-placeholder.svg";
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
                            <h4
                                className={
                                    css.profile_details_left_profile_name
                                }
                            >
                                {fullName}
                            </h4>
                        </div>
                    </div>
                    <div className={css.profile_details_left_buttons}>
                        <RootLink
                            href={clientRoutes.profileEdit}
                            className={cn(css.profile_details_left_button, css.profile_details_left_button_link)}
                        >
                            Edit profile
                        </RootLink>
                        <RootLink
                            href={clientRoutes.claimHistory}
                            className={cn(css.profile_details_left_button, css.profile_details_left_button_link, css.profile_details_left_button_link_primary)}
                        >
                            Claim history
                        </RootLink>
                    </div>
                </div>
                <div className={css.profile_details_right}>
                    <div className={css.profile_details_right_header}>
                        <p className={css.profile_details_right_header_email}>
                            <b>Email:</b>
                            <span>{email || "-"}</span>
                        </p>
                    </div>
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
                                —
                            </p>
                        </div>
                        <div className={css.profile_details_right_info_item}>
                            <span
                                className={
                                    css.profile_details_right_info_item_label
                                }
                            >
                                Laurels (24 mo)
                            </span>
                            <p
                                className={
                                    css.profile_details_right_info_item_value
                                }
                            >
                                —
                            </p>
                        </div>
                        <div className={css.profile_details_right_info_item}>
                            <span
                                className={
                                    css.profile_details_right_info_item_label
                                }
                            >
                                Doubles Rating
                            </span>
                            <p
                                className={
                                    css.profile_details_right_info_item_value
                                }
                            >
                                —
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
