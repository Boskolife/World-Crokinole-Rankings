"use client";

import React from "react";
import Image from "next/image";
import cn from "classnames";
import { Icon } from "@/shared/ui/icons";
import { usePopup } from "@/shared/contexts/popup-context";
import type { IEventCardProps } from "@/shared/types";
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
    const { openPopup } = usePopup();
    const {
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
    } = event;

    const capacityStr =
        currentRank != null && totalParticipants != null
            ? `${currentRank}/${totalParticipants}`
            : undefined;
    const feeStr = price === "free" || price === "Free" ? "Free" : price;

    return (
        <section className={css.hero}>
            <div className="container">
                <h1 className={css.page_title}>{title}</h1>

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
                        <div className={css.card_actions}>
                            <button
                                type="button"
                                className={css.join_button}
                                onClick={() =>
                                    openPopup("join-tournament", { title })
                                }
                            >
                                Join tournament
                            </button>
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
                    </div>
                </div>
            </div>
        </section>
    );
}
