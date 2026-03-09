"use client";

import React, { useState, useEffect, useMemo } from "react";
import Image from "next/image";
import { useParams } from "next/navigation";
import { useAuth } from "@/shared/hooks/use-auth";
import { getEventsCreatedByUser } from "@/shared/supabase/data";
import { RootLink } from "@/shared/ui/links/root-link";
import { Icon } from "@/shared/ui/icons";
import { clientRoutes } from "@/shared/routes/client";
import type { IEventCardProps } from "@/shared/types";
import { localeConfig } from "@/app/localization/config";
import css from "./styles.module.scss";

const STAGE_FORMAT_LABELS: Record<string, string> = {
    single_elimination: "Elimination",
    double_elimination: "Double Elimination",
    round_robin: "Round Robin",
    swiss: "Swiss",
};

function getFormatTag(event: IEventCardProps): string {
    const format = (event.format ?? "").trim();
    const isTournament = format.toLowerCase() === "tournament";
    const raw = (event.structure ?? "").trim();
    let stageFormat = "";
    if (raw.startsWith("{")) {
        try {
            const p = JSON.parse(raw) as { stages?: Array<{ stageFormat?: string }> };
            const first = p.stages?.[0];
            if (first?.stageFormat) {
                stageFormat = STAGE_FORMAT_LABELS[first.stageFormat] ?? first.stageFormat;
            }
        } catch {
            //
        }
    }
    if (isTournament && stageFormat) return `Tournament / ${stageFormat}`;
    if (isTournament) return "Tournament";
    return format || "Event";
}

function ProfileCreatedEventCard({ event }: { event: IEventCardProps }) {
    const formatTag = getFormatTag(event);
    const isPast = event.endDate ? new Date(event.endDate) < new Date() : false;
    const locale = (useParams()?.locale as string) ?? localeConfig.defaultLocale;

    return (
        <div className={css.card}>
            <div className={css.card_image_wrap}>
                {event.image ? (
                    <Image
                        src={event.image}
                        alt={event.title}
                        fill
                        className={css.card_image}
                        sizes="420px"
                    />
                ) : (
                    <div className={css.card_image_placeholder}>
                        <Image
                            src="/images/logo.png"
                            alt=""
                            width={132}
                            height={127}
                            className={css.card_placeholder_img}
                        />
                    </div>
                )}
                <span className={css.card_tag}>{formatTag}</span>
                <div className={css.card_participants}>
                    <Icon name="ranking" className={css.card_participants_icon} />
                    {event.totalParticipants != null && (
                        <span className={css.card_participants_count}>
                            {event.currentRank ?? 0}/{event.totalParticipants}
                        </span>
                    )}
                </div>
            </div>
            <div className={css.card_body}>
                <h3 className={css.card_title}>{event.title}</h3>
                <div className={css.card_meta}>
                    <span className={css.card_date}>{event.date}</span>
                    <span className={css.card_location}>
                        <Icon name="location" className={css.card_location_icon} />
                        {event.location}
                    </span>
                    {isPast && event.winner && (
                        <span className={css.card_winner}>
                            <b>Winner:</b> {event.winner}
                        </span>
                    )}
                </div>
                <RootLink
                    href={`/${locale}${clientRoutes.eventDetail(event.id)}`}
                    className={css.card_manage}
                >
                    Manage Page
                </RootLink>
            </div>
        </div>
    );
}

export function ProfileCreatedEvents() {
    const { user } = useAuth();
    const [events, setEvents] = useState<IEventCardProps[]>([]);
    const [loading, setLoading] = useState(true);
    const [dateFilter, setDateFilter] = useState("");
    const [locationFilter, setLocationFilter] = useState("");
    const [formatFilter, setFormatFilter] = useState("");
    const [typeFilter, setTypeFilter] = useState("");
    const params = useParams();
    const locale = (params?.locale as string) ?? localeConfig.defaultLocale;

    useEffect(() => {
        if (!user?.id) {
            setEvents([]);
            setLoading(false);
            return;
        }
        setLoading(true);
        getEventsCreatedByUser(user.id)
            .then(setEvents)
            .finally(() => setLoading(false));
    }, [user?.id]);

    const filteredEvents = useMemo(() => {
        let list = [...events];
        if (dateFilter) {
            list = list.filter((e) => {
                const d = e.startDate ?? e.endDate ?? "";
                return d && d.startsWith(dateFilter);
            });
        }
        if (locationFilter) list = list.filter((e) => e.location === locationFilter);
        if (formatFilter) list = list.filter((e) => (e.format ?? "") === formatFilter);
        if (typeFilter) {
            if (typeFilter === "ranked") list = list.filter((e) => e.isRanked);
            if (typeFilter === "unranked") list = list.filter((e) => !e.isRanked);
        }
        return list;
    }, [events, dateFilter, locationFilter, formatFilter, typeFilter]);

    const dateOptions = useMemo(() => {
        const set = new Set<string>();
        events.forEach((e) => {
            const d = e.startDate ?? e.endDate;
            if (d) set.add(d.slice(0, 7));
        });
        return ["", ...Array.from(set).sort()];
    }, [events]);

    const locationOptions = useMemo(() => {
        const set = new Set(events.map((e) => e.location).filter(Boolean));
        return ["", ...Array.from(set).sort()];
    }, [events]);

    const formatOptions = useMemo(() => {
        const set = new Set(events.map((e) => (e.format ?? "").trim()).filter(Boolean));
        return ["", ...Array.from(set).sort()];
    }, [events]);

    if (!user) return null;

    return (
        <section className={css.section}>
            <div className={css.header_row}>
                <h2 className={css.section_title}>Tournaments I have created</h2>
                <RootLink
                    href={`/${locale}/events/create`}
                    className={css.create_btn}
                >
                    <Icon name="plus" className={css.create_btn_icon} />
                    Create new Event
                </RootLink>
            </div>
            <div className={css.filters_row}>
                <div className={css.filters}>
                    <select
                        className={css.filter_select}
                        value={dateFilter}
                        onChange={(e) => setDateFilter(e.target.value)}
                        aria-label="Date"
                    >
                        <option value="">Date</option>
                        {dateOptions.filter(Boolean).map((d) => (
                            <option key={d} value={d}>{d}</option>
                        ))}
                    </select>
                    <select
                        className={css.filter_select}
                        value={locationFilter}
                        onChange={(e) => setLocationFilter(e.target.value)}
                        aria-label="Location"
                    >
                        <option value="">Location</option>
                        {locationOptions.filter(Boolean).map((loc) => (
                            <option key={loc} value={loc}>{loc}</option>
                        ))}
                    </select>
                    <select
                        className={css.filter_select}
                        value={formatFilter}
                        onChange={(e) => setFormatFilter(e.target.value)}
                        aria-label="Format"
                    >
                        <option value="">Format</option>
                        {formatOptions.filter(Boolean).map((f) => (
                            <option key={f} value={f}>{f}</option>
                        ))}
                    </select>
                    <select
                        className={css.filter_select}
                        value={typeFilter}
                        onChange={(e) => setTypeFilter(e.target.value)}
                        aria-label="Type"
                    >
                        <option value="">Type</option>
                        <option value="ranked">Ranked</option>
                        <option value="unranked">Unranked</option>
                    </select>
                </div>
                <div className={css.view_tabs}>
                    <span className={css.view_tab_active}>List</span>
                    <span className={css.view_tab}>Grid</span>
                    <span className={css.view_tab}>Map</span>
                </div>
            </div>
            {loading ? (
                <div className={css.loading}>Loading…</div>
            ) : filteredEvents.length === 0 ? (
                <div className={css.empty}>
                    You have not created any events or tournaments yet.
                </div>
            ) : (
                <div className={css.grid}>
                    {filteredEvents.map((event) => (
                        <ProfileCreatedEventCard key={event.id} event={event} />
                    ))}
                </div>
            )}
        </section>
    );
}
