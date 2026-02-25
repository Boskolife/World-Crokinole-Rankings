"use client";

import React, { useState, useEffect } from "react";
import Image from "next/image";
import { useUserProfile } from "@/shared/hooks/use-user-profile";
import { useAuth } from "@/shared/hooks/use-auth";
import { usePopup } from "@/shared/contexts/popup-context";
import { getClubOwnedByUser } from "@/shared/supabase/data";
import { RootLink } from "@/shared/ui/links/root-link";
import { clientRoutes } from "@/shared/routes/client";
import { Icon } from "@/shared/ui/icons";
import type { IClub } from "@/shared/types";
import css from "./styles.module.scss";

export const ProfileMyClubs: React.FC = () => {
    const { profile } = useUserProfile();
    const { user } = useAuth();
    const { openPopup } = usePopup();
    const [club, setClub] = useState<IClub | null>(null);
    const [loading, setLoading] = useState(true);

    const isCommunityAdmin = profile?.subscription_plan === "administrator";

    useEffect(() => {
        if (!isCommunityAdmin || !user?.id) {
            setClub(null);
            setLoading(false);
            return;
        }
        getClubOwnedByUser(user.id)
            .then(setClub)
            .finally(() => setLoading(false));
    }, [isCommunityAdmin, user?.id]);

    if (!isCommunityAdmin || loading) return null;

    return (
        <section className={css.profile_my_clubs}>
            <div className={css.profile_my_clubs_header}>
                <h2 className={css.profile_my_clubs_title}>My Clubs</h2>
                <p className={css.profile_my_clubs_subtitle}>
                    You can only create one club
                </p>
            </div>
            {club ? (
                <div className={css.profile_my_clubs_card_wrapper}>
                <div className={css.profile_my_clubs_card}>
                    <div className={css.profile_my_clubs_card_image_wrap}>
                        <Image
                            src={club.image || "/images/news-placeholder.png"}
                            alt={club.title}
                            width={459}
                            height={262}
                            className={css.profile_my_clubs_card_image}
                        />
                    </div>
                    <div className={css.profile_my_clubs_card_content}>
                        <h3 className={css.profile_my_clubs_card_title}>
                            {club.title}
                        </h3>
                        <p className={css.profile_my_clubs_card_description}>
                            {club.description || "—"}
                        </p>
                        <div className={css.profile_my_clubs_card_meta}>
                            <div className={css.profile_my_clubs_card_meta_item}>
                                <Icon
                                    name="members"
                                    className={css.profile_my_clubs_card_meta_icon}
                                />
                                <span>
                                    {club.members} members
                                </span>
                            </div>
                            <div className={css.profile_my_clubs_card_meta_item}>
                                {club.country ? (
                                    <Image
                                        src={club.country}
                                        alt=""
                                        width={24}
                                        height={24}
                                        className={css.profile_my_clubs_card_flag}
                                    />
                                ) : (
                                    <span className={css.profile_my_clubs_card_flag_emoji}>🇺🇸</span>
                                )}
                                <span>{club.location || "USA"}</span>
                            </div>
                        </div>
                        <div className={css.profile_my_clubs_card_tags}>
                            {club.labelItem1 && (
                                <span className={css.profile_my_clubs_card_tag}>
                                    {club.labelItem1}
                                </span>
                            )}
                            {club.labelItem2 && (
                                <span className={css.profile_my_clubs_card_tag}>
                                    {club.labelItem2}
                                </span>
                            )}
                            {typeof club.hosted === "number" && club.hosted > 0 && (
                                <span className={css.profile_my_clubs_card_tag_meta}>
                                    Events hosted: {club.hosted}
                                </span>
                            )}
                            {typeof club.veteranPlayers === "number" && club.veteranPlayers > 0 && (
                                <span className={css.profile_my_clubs_card_tag_meta}>
                                    Veteran players: {club.veteranPlayers}
                                </span>
                            )}
                        </div>
                        <div className={css.profile_my_clubs_card_actions}>
                            <RootLink
                                href={clientRoutes.clubDetail(club.id)}
                                className={css.profile_my_clubs_btn_primary}
                            >
                                View Details
                            </RootLink>
                            <button
                                type="button"
                                className={css.profile_my_clubs_btn_outline}
                                onClick={() => openPopup("edit-club", { club })}
                            >
                                Edit Club
                            </button>
                        </div>
                    </div>
                </div>
                </div>
            ) : (
                <div className={css.profile_my_clubs_card_wrapper}>
                    <RootLink
                        href={clientRoutes.clubs}
                        className={css.profile_my_clubs_create_btn}
                    >
                        Create one club
                    </RootLink>
                </div>
            )}
        </section>
    );
};
