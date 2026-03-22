"use client";

import React from "react";
import css from "./styles.module.scss";
import Image from "next/image";
import { Icon } from "@/shared/ui/icons";
import cn from "classnames";
import { IEventCardProps } from "@/shared/types";
import { RootLink } from "@/shared/ui";
import { clientRoutes } from "@/shared/routes/client";
import { useAuth } from "@/shared/hooks";

const isFreePrice = (p: string | undefined) => {
    if (p == null) return true;
    const s = String(p).trim().toLowerCase();
    return s === "" || s === "free" || s === "0";
};

function normalizeCardTournamentVisibility(raw: string | null | undefined): string {
    const t = (raw ?? "draft").toLowerCase().trim();
    if (t === "live" || t === "public" || t === "draft") return t;
    return "draft";
}

export const EventCard: React.FC<IEventCardProps> = ({
    id,
    image,
    title,
    price,
    date,
    location,
    format,
    isRanked,
    isRegistrationRequired,
    isPastEvent,
    winner,
    currentRank,
    totalParticipants,
    tournamentPointsAvailable,
    tournamentVisibility,
    createdBy,
}) => {
    const { user } = useAuth();
    const free = isFreePrice(price);
    const isTournament = (format ?? "").toLowerCase() === "tournament";
    const cardTournamentVis = normalizeCardTournamentVisibility(tournamentVisibility);
    const showCardLiveMini = isTournament && cardTournamentVis === "live";
    const showCardDraftMini =
        isTournament &&
        cardTournamentVis === "draft" &&
        Boolean(createdBy && user?.id && createdBy === user.id);
    const registrationText = isRegistrationRequired
        ? (isTournament ? "Tournament registration is required" : "Registration is required")
        : (isTournament ? "No tournament registration required" : "No registration required");
    return (
        <RootLink href={clientRoutes.eventDetail(id)} className={css.event_card_link}>
            <div className={css.event_card}>
                <div className={css.event_card_image}>
                <span
                    className={cn(css.event_card_registration, {
                        [css._required]: isRegistrationRequired,
                    })}
                >
                    {registrationText}
                </span>
                {(showCardLiveMini || showCardDraftMini) && (
                    <span
                        className={cn(
                            css.event_card_visibility_mini,
                            showCardLiveMini
                                ? css.event_card_visibility_mini_live
                                : css.event_card_visibility_mini_draft
                        )}
                        role="status"
                    >
                        <span
                            className={cn(
                                css.event_card_visibility_mini_dot,
                                showCardLiveMini
                                    ? css.event_card_visibility_mini_dot_live
                                    : css.event_card_visibility_mini_dot_draft
                            )}
                            aria-hidden
                        />
                        {showCardLiveMini ? "Live" : "Draft"}
                    </span>
                )}
                {isRanked && (
                    <div className={css.event_card_ranking}>
                        <span className={css.event_card_ranking_icon_wrapper}>
                            <Icon
                                name="ranking"
                                className={cn(css.event_card_ranking_icon, css._ranked)}
                            />
                        </span>
                        {totalParticipants != null && (
                            <div className={css.event_card_ranking_value_wrapper}>
                                <span>{currentRank ?? 0}</span>
                                <span>/</span>
                                <span>{totalParticipants}</span>
                            </div>
                        )}
                    </div>
                )}
                {image ? (
                    <Image
                        className={css.event_card_image_img}
                        src={image}
                        alt={title}
                        width={420}
                        height={240}
                    />
                ) : (
                    <div className={css.event_card_image_placeholder}>
                        <Image
                            src="/images/logo.png"
                            alt={title}
                            width={132}
                            height={127}
                        />
                    </div>
                )}
            </div>
            <div className={css.event_card_content}>
                <div className={css.event_card_header}>
                    <h3 className={css.event_card_title}>{title}</h3>
                    <div className={css.event_card_header_right}>
                        <span
                            className={cn(css.event_card_price, {
                                [css._free]: free,
                            })}
                        >
                            {free ? "Free" : `$${price}`}
                        </span>
                        {tournamentPointsAvailable != null && tournamentPointsAvailable > 0 && (
                            <span className={css.event_card_points}>
                                {tournamentPointsAvailable} pts
                            </span>
                        )}
                    </div>
                </div>
                <div className={css.event_card_content_info}>
                    <span className={css.event_card_date}>{date}</span>
                    <span className={css.event_card_location}>
                        <Icon
                            name="location"
                            className={css.event_card_location_icon}
                        />
                        {location}
                    </span>
                    {isPastEvent && (
                        <div className={css.event_card_status}>
                            <b>Winner:</b>
                            <span>{winner?.trim() || "—"}</span>
                        </div>
                    )}
                    {!isPastEvent && (
                        <span className={css.event_card_format}>{format}</span>
                    )}
                </div>
            </div>
        </div>
        </RootLink>
    );
};
