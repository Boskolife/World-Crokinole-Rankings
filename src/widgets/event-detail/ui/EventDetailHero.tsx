"use client";

import React from "react";
import Image from "next/image";
import Link from "next/link";
import { useRouter } from "next/navigation";
import cn from "classnames";
import { Icon } from "@/shared/ui/icons";
import { usePopup } from "@/shared/contexts/popup-context";
import { useAuth } from "@/shared/hooks/use-auth";
import { useEventRegistration } from "@/shared/hooks/use-event-registration";
import { useEventRegistrationStatus } from "@/shared/hooks/use-event-registration-status";
import type { IEventCardProps } from "@/shared/types";
import { localeConfig } from "@/app/localization/config";
import { useParams } from "next/navigation";
import css from "./EventDetailHero.module.scss";

export interface EventDetailHeroProps {
    event: IEventCardProps;
}

function DetailRow({
    label,
    value,
    inline = false,
}: {
    label: string;
    value: string | number | undefined;
    inline?: boolean;
}) {
    if (value === undefined || value === "") return null;
    return (
        <div className={cn(css.detail_row, { [css.detail_row_inline]: inline })}>
            <span className={css.detail_label}>{label}</span>
            <span className={css.detail_value}>{value}</span>
        </div>
    );
}

export function EventDetailHero({ event }: EventDetailHeroProps) {
    const router = useRouter();
    const params = useParams() as { locale?: string };
    const locale = params?.locale ?? localeConfig.defaultLocale;
    const { openPopup } = usePopup();
    const { isAuth, user } = useAuth();
    const { registerForEvent, state, resetState } = useEventRegistration();
    const {
        id: eventId,
        createdBy,
        image,
        title,
        price,
        date,
        location,
        format,
        isRanked,
        isRegistrationRequired,
        currentRank,
        totalParticipants,
        structure,
        strengthOfField,
        tournamentPointsAvailable,
        qualifyingHeats,
        endDate,
        startDate,
    } = event;

    const isEventEnded = (() => {
        const ref = endDate || startDate;
        if (!ref) return false;
        return new Date(ref) < new Date();
    })();

    const isCreator = Boolean(createdBy && user?.id && createdBy === user.id);

    const { status: regStatus, refetch: refetchRegStatus } = useEventRegistrationStatus(eventId, user?.id);

    const hasQualifyingHeats =
        qualifyingHeats?.heats != null && qualifyingHeats.heats.length > 0;

    const handleJoinClick = () => {
        if (!isAuth || !user?.id) return;
        if (hasQualifyingHeats) {
            openPopup("join-tournament", {
                eventId,
                title,
                qualifyingHeats,
                totalParticipants: totalParticipants ?? undefined,
            });
        } else {
            registerForEvent(eventId, user.id, undefined, totalParticipants ?? undefined).then((ok) => {
                if (ok) {
                    refetchRegStatus();
                    router.refresh();
                } else resetState();
            });
        }
    };

    const capacityStr =
        currentRank != null && totalParticipants != null
            ? `${currentRank}/${totalParticipants}`
            : undefined;
    const isFull =
        totalParticipants != null &&
        currentRank != null &&
        currentRank >= totalParticipants;
    const feeStr = price === "free" || price === "Free" ? "Free" : price;

    return (
        <section className={css.hero}>
            <div className="container">
                <div className={css.title_row}>
                    <h1 className={css.page_title}>{title}</h1>
                    {isCreator && (
                        <Link
                            href={`/${locale}/events/${eventId}/edit`}
                            className={css.edit_button}
                        >
                            <Icon name="edit" className={css.edit_button_icon} />
                            Edit
                        </Link>
                    )}
                </div>

                <div className={css.card}>
                    <div className={css.card_emblem}>
                        {image ? (
                            <Image
                                src={image}
                                alt=""
                                fill
                                className={css.card_emblem_img}
                                sizes="280px"
                            />
                        ) : (
                            <div className={css.card_emblem_placeholder}>
                                <Icon
                                    name="laurels"
                                    className={css.card_emblem_icon}
                                />
                            </div>
                        )}
                    </div>
                    <div className={css.card_body}>
                        <div className={css.details_top}>
                            <div className={css.details_top_left}>
                                <DetailRow
                                    label="Type"
                                    value={isRanked ? "Ranked" : "Unranked"}
                                />
                            </div>
                            <div className={css.details_top_right}>
                                <DetailRow
                                    label="Strength of field:"
                                    value={strengthOfField}
                                    inline
                                />
                                <DetailRow
                                    label="Tournament points available:"
                                    value={tournamentPointsAvailable}
                                    inline
                                />
                            </div>
                        </div>
                        <div className={css.details_divider} />
                        <div className={css.details_grid}>
                            <div className={css.details_col}>
                                <DetailRow label="Data" value={date} />
                                <DetailRow label="Location" value={location} />
                                <DetailRow label="Capacity" value={capacityStr} />
                            </div>
                            <div className={css.details_col}>
                                <DetailRow label="Format" value={format} />
                                <DetailRow label="Structure" value={structure} />
                                <DetailRow label="Fee" value={feeStr} />
                            </div>
                        </div>
                        {!isEventEnded && (
                            <div className={css.card_actions}>
                                {!isCreator && (
                                    <>
                                        {!isAuth ? (
                                            <span
                                                className={cn(css.join_button, css.join_button_disabled)}
                                                title="Sign in to join"
                                            >
                                                Join tournament
                                            </span>
                                        ) : regStatus?.isRegistered ? (
                                            <span
                                                className={cn(css.join_button, css.join_button_registered)}
                                            >
                                                Registered
                                            </span>
                                        ) : isFull ? (
                                            <span
                                                className={cn(css.join_button, css.join_button_registered)}
                                            >
                                                Full
                                            </span>
                                        ) : (
                                            <>
                                                <button
                                                    type="button"
                                                    className={css.join_button}
                                                    disabled={state.status === "loading"}
                                                    onClick={handleJoinClick}
                                                >
                                                    {state.status === "loading"
                                                        ? "Joining…"
                                                        : "Join tournament"}
                                                </button>
                                                {state.status === "error" && (
                                                    <span className={css.join_error}>
                                                        {state.message}
                                                    </span>
                                                )}
                                            </>
                                        )}
                                    </>
                                )}
                                <span
                                    className={cn(css.registration_note, {
                                        [css._required]: isRegistrationRequired,
                                    })}
                                >
                                    {isRegistrationRequired
                                        ? "Registration is Required"
                                        : "No registration required"}
                                </span>
                            </div>
                        )}
                        {isEventEnded && (
                            <div className={css.event_ended_banner}>
                                The event has ended
                            </div>
                        )}
                    </div>
                </div>
            </div>
        </section>
    );
}
