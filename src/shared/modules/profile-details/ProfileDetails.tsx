"use client";
import React, { useState } from "react";
import css from "./styles.module.scss";
import Image from "next/image";
import { RootLink } from "@/shared/ui";
import { clientRoutes } from "@/shared/routes/client";
import cn from "classnames";
import { useUserProfile, useCurrentUserPlayer } from "@/shared/hooks";
import { useRouter } from "next/navigation";

export const ProfileDetails: React.FC = () => {
    const { fullName, email, profile } = useUserProfile();
    const { player } = useCurrentUserPlayer();
    const router = useRouter();
    const [mode, setMode] = useState<"overview" | "security">("overview");
    const kingdom = player?.kingdom || profile?.country || "—";
    const club = player?.club || profile?.club || "—";
    const singlesRating = player?.singlesRating ?? player?.rating;
    const doublesRating = player?.doublesRating ?? null;
    const laurels24Mo = player?.laurels24mo ?? null;
    const showKingBadge =
        Boolean(player?.title?.trim() || player?.clubTitle?.trim()) &&
        kingdom !== "—" &&
        kingdom.trim() !== "";
    const avatarSrc =
        player?.avatarUrl?.trim() || profile?.avatar_url?.trim() || "/svg/avatar-placeholder.svg";

    const normalizedClub = (() => {
        const raw = club.trim();
        return !raw || /^[\s,]*$/.test(raw) ? "—" : raw;
    })();

    const normalizedKingdom = (() => {
        const raw = kingdom.trim();
        return !raw || /^[\s,]*$/.test(raw) ? "—" : raw;
    })();

    const handleOpenSecurity = () => setMode("security");
    const handleBackToOverview = () => setMode("overview");

    const handleChangeEmail = () => {
        router.push(clientRoutes.profileEdit + "?focus=email");
    };

    const handleChangePassword = () => {
        router.push(clientRoutes.profileEdit + "?focus=password");
    };

    if (mode === "security") {
        return (
            <div className="container">
                <div className={cn(css.profile_details_content, css.profile_details_content_centered)}>
                    <div className={css.profile_details_security}>
                        <div className={css.profile_details_security_header}>
                            <button
                                type="button"
                                className={css.profile_details_security_back}
                                onClick={handleBackToOverview}
                                aria-label="Back to profile overview"
                            >
                                <span className={css.profile_details_security_back_icon} />
                            </button>
                            <h3 className={css.profile_details_security_title}>
                                Change email or password
                            </h3>
                        </div>
                        <div className={css.profile_details_security_body}>
                            <div className={css.profile_details_security_section}>
                                <h4 className={css.profile_details_security_section_title}>
                                    Current email
                                </h4>
                                <p className={css.profile_details_security_text}>
                                    <span>You are logged in as&nbsp;</span>
                                    <span className={css.profile_details_security_text_email}>
                                        {email || "-"}
                                    </span>
                                </p>
                                <button
                                    type="button"
                                    className={css.profile_details_security_button}
                                    onClick={handleChangeEmail}
                                >
                                    Change my email
                                </button>
                            </div>
                            <div className={css.profile_details_security_section}>
                                <h4 className={css.profile_details_security_section_title}>
                                    Password
                                </h4>
                                <button
                                    type="button"
                                    className={css.profile_details_security_button}
                                    onClick={handleChangePassword}
                                >
                                    Change my password
                                </button>
                            </div>
                        </div>
                    </div>
                </div>
            </div>
        );
    }

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
                                {player?.name || fullName}
                            </h4>
                            {showKingBadge && (
                                <span className={css.profile_details_left_profile_role}>
                                    👑 King of {normalizedKingdom}
                                </span>
                            )}
                        </div>
                    </div>
                    <div className={css.profile_details_left_buttons}>
                        <RootLink
                            href={clientRoutes.profileEdit}
                            className={cn(css.profile_details_left_button, css.profile_details_left_button_link)}
                        >
                            Edit profile
                        </RootLink>
                        {(!player || player.isAutoCreated) && (
                            <RootLink
                                href={clientRoutes.claimHistory}
                                className={cn(css.profile_details_left_button, css.profile_details_left_button_link, css.profile_details_left_button_link_primary)}
                            >
                                Claim history
                            </RootLink>
                        )}
                    </div>
                </div>
                <div className={css.profile_details_right}>
                    <>
                            <div className={css.profile_details_right_header}>
                                <p className={css.profile_details_right_header_email}>
                                    <b>Email:</b>
                                    <span>{email || "-"}</span>
                                </p>
                                <RootLink
                                    href={clientRoutes.profileEdit}
                                    className={css.profile_details_right_header_link}
                                    onClick={(e) => {
                                        e.preventDefault();
                                        handleOpenSecurity();
                                    }}
                                >
                                    Change email or password
                                </RootLink>
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
                                        {player ? (singlesRating != null ? String(singlesRating) : "—") : "—"}
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
                                        {laurels24Mo != null ? String(laurels24Mo) : "—"}
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
                                        {player ? (doublesRating != null ? String(doublesRating) : "—") : "—"}
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
                                        {normalizedClub}
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
                                        {normalizedKingdom}
                                    </p>
                                </div>
                            </div>
                        </>
                </div>
            </div>
        </div>
    );
};
