"use client";

import React, { useState, useEffect, useMemo } from "react";
import { useParams } from "next/navigation";
import { useAuth } from "@/shared/hooks/use-auth";
import { useEvents, useDebounce } from "@/shared/hooks";
import { getEventsCreatedByUser } from "@/shared/supabase/data";
import { RootLink } from "@/shared/ui/links/root-link";
import { CustomRoundedDropdown, SearchInput } from "@/shared/ui";
import { Icon } from "@/shared/ui/icons";
import { clientRoutes } from "@/shared/routes/client";
import { EventCard } from "@/widgets/events/components/event-card/EventCard";
import { EventsMap } from "@/widgets/events/components/events-map/EventsMap";
import type { IEventCardProps } from "@/shared/types";
import { localeConfig } from "@/app/localization/config";
import cn from "classnames";
import css from "./styles.module.scss";
import eventsCss from "@/widgets/events/ui/styles.module.scss";

const SEARCH_DEBOUNCE_MS = 300;

const createdEventsDateOptions = [
    { value: "all", label: "All dates" },
    { value: "30d", label: "Next 30 days" },
    { value: "3m", label: "Next 3 months" },
    { value: "6m", label: "Next 6 months" },
    { value: "9m", label: "Next 9 months" },
    { value: "1y", label: "Next 1 year" },
    { value: "past_30d", label: "Last 30 days" },
    { value: "past_3m", label: "Last 3 months" },
    { value: "past_6m", label: "Last 6 months" },
    { value: "past_9m", label: "Last 9 months" },
    { value: "past_1y", label: "Last 1 year" },
];

const typeOptions = [
    { value: "all", label: "All types" },
    { value: "ranked", label: "Ranked" },
    { value: "unranked", label: "Unranked" },
];

function filterByDateRange(
    list: IEventCardProps[],
    dateFilter: string
): IEventCardProps[] {
    if (dateFilter === "all") return list;
    const now = new Date();
    const today = new Date(now.getFullYear(), now.getMonth(), now.getDate());
    const todayTime = today.getTime();

    const addPeriod = (months: number, days = 0) => {
        const d = new Date(today);
        d.setMonth(d.getMonth() + months);
        d.setDate(d.getDate() + days);
        return d.getTime();
    };

    const isPast = dateFilter.startsWith("past_");
    const key = isPast ? dateFilter.replace("past_", "") : dateFilter;
    let rangeStart: number;
    let rangeEnd: number;
    switch (key) {
        case "30d":
            rangeStart = todayTime;
            rangeEnd = addPeriod(0, 30);
            break;
        case "3m":
            rangeStart = todayTime;
            rangeEnd = addPeriod(3);
            break;
        case "6m":
            rangeStart = todayTime;
            rangeEnd = addPeriod(6);
            break;
        case "9m":
            rangeStart = todayTime;
            rangeEnd = addPeriod(9);
            break;
        case "1y":
            rangeStart = todayTime;
            rangeEnd = addPeriod(12);
            break;
        default:
            return list;
    }

    return list.filter((event) => {
        const dateStr = isPast ? event.endDate ?? event.startDate : event.startDate;
        if (!dateStr) return false;
        const eventDate = new Date(dateStr);
        const eventDateOnly = new Date(
            eventDate.getFullYear(),
            eventDate.getMonth(),
            eventDate.getDate()
        );
        const eventTime = eventDateOnly.getTime();
        if (isPast) {
            return eventTime <= todayTime && eventTime >= todayTime - (rangeEnd - rangeStart);
        }
        return eventTime >= rangeStart && eventTime <= rangeEnd;
    });
}

export function ProfileCreatedEvents() {
    const { user } = useAuth();
    const [events, setEvents] = useState<IEventCardProps[]>([]);
    const [loading, setLoading] = useState(true);
    const [searchQuery, setSearchQuery] = useState("");
    const debouncedSearchQuery = useDebounce(searchQuery, SEARCH_DEBOUNCE_MS);
    const [dateFilter, setDateFilter] = useState("all");
    const [locationFilter, setLocationFilter] = useState("all");
    const [formatFilter, setFormatFilter] = useState("all");
    const [typeFilter, setTypeFilter] = useState("all");
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

    const locationOptions = useMemo(() => {
        const set = new Set(events.map((e) => e.location).filter(Boolean));
        return [
            { value: "all", label: "All locations" },
            ...Array.from(set)
                .sort()
                .map((loc) => ({ value: loc, label: loc })),
        ];
    }, [events]);

    const formatOptions = useMemo(() => {
        const set = new Set(events.map((e) => (e.format ?? "").trim()).filter(Boolean));
        return [
            { value: "all", label: "All formats" },
            ...Array.from(set)
                .sort()
                .map((f) => ({ value: f, label: f })),
        ];
    }, [events]);

    const filteredEvents = useMemo(() => {
        let list = [...events];
        if (debouncedSearchQuery.trim()) {
            const q = debouncedSearchQuery.trim().toLowerCase();
            list = list.filter(
                (e) =>
                    (e.title ?? "").toLowerCase().includes(q) ||
                    (e.location ?? "").toLowerCase().includes(q) ||
                    (e.format ?? "").toLowerCase().includes(q)
            );
        }
        list = filterByDateRange(list, dateFilter);
        if (locationFilter !== "all") list = list.filter((e) => e.location === locationFilter);
        if (formatFilter !== "all") list = list.filter((e) => (e.format ?? "") === formatFilter);
        if (typeFilter !== "all") {
            if (typeFilter === "ranked") list = list.filter((e) => e.isRanked);
            if (typeFilter === "unranked") list = list.filter((e) => !e.isRanked);
        }
        return list;
    }, [
        events,
        debouncedSearchQuery,
        dateFilter,
        locationFilter,
        formatFilter,
        typeFilter,
    ]);

    const {
        activeSwitcher,
        displayedEvents,
        handleSwitcherClick,
    } = useEvents({
        events: filteredEvents,
        needPagination: false,
        totalItems: filteredEvents.length,
    });

    if (!user) return null;

    return (
        <section className={css.section}>
            <h2 className={css.account_title}>My Admin account</h2>
            <div className={css.header_row}>
                <h3 className={css.section_title}>Tournaments I have created</h3>
                <RootLink
                    href={`/${locale}/events/create`}
                    className={css.create_btn}
                >
                    <Icon name="plus" className={css.create_btn_icon} />
                    Create new Event
                </RootLink>
            </div>
            <div className={css.filters_row}>
                <div className={eventsCss.events_head_filters}>
                    <div className={eventsCss.events_head_search}>
                        <SearchInput
                            placeholder="Search events"
                            value={searchQuery}
                            onChange={(e) => setSearchQuery(e.target.value)}
                            ariaLabel="Search events by title, location or format"
                        />
                    </div>
                    <CustomRoundedDropdown
                        id="Date"
                        options={createdEventsDateOptions}
                        placeholder="Date"
                        className={eventsCss.events_head_dropdown}
                        value={dateFilter}
                        onChange={setDateFilter}
                    />
                    <CustomRoundedDropdown
                        id="Location"
                        options={locationOptions}
                        placeholder="Location"
                        className={eventsCss.events_head_dropdown}
                        value={locationFilter}
                        onChange={setLocationFilter}
                    />
                    <CustomRoundedDropdown
                        id="Format"
                        options={formatOptions}
                        placeholder="Format"
                        className={eventsCss.events_head_dropdown}
                        value={formatFilter}
                        onChange={setFormatFilter}
                    />
                    <CustomRoundedDropdown
                        id="Type"
                        options={typeOptions}
                        placeholder="Type"
                        className={eventsCss.events_head_dropdown}
                        value={typeFilter}
                        onChange={setTypeFilter}
                    />
                </div>
                <div
                    className={cn(eventsCss.events_head_switcher, {
                        [eventsCss.events_head_switcher_list]: activeSwitcher === "list",
                        [eventsCss.events_head_switcher_map]: activeSwitcher === "map",
                    })}
                >
                    <button
                        className={cn(eventsCss.events_head_switcher_button, {
                            [eventsCss.events_head_switcher_button_active]:
                                activeSwitcher === "list",
                        })}
                        onClick={() => handleSwitcherClick("list")}
                        type="button"
                        aria-label="Show events as list"
                    >
                        <Icon
                            name="list"
                            className={eventsCss.events_head_switcher_button_icon}
                        />
                    </button>
                    <button
                        className={cn(eventsCss.events_head_switcher_button, {
                            [eventsCss.events_head_switcher_button_active]:
                                activeSwitcher === "map",
                        })}
                        onClick={() => handleSwitcherClick("map")}
                        type="button"
                        aria-label="Show events on map"
                    >
                        <Icon
                            name="map"
                            className={eventsCss.events_head_switcher_button_icon}
                        />
                    </button>
                </div>
            </div>
            {loading ? (
                <div className={css.loading}>Loading…</div>
            ) : filteredEvents.length === 0 ? (
                <div className={css.empty}>
                    You have not created any events or tournaments yet.
                </div>
            ) : activeSwitcher === "map" ? (
                <EventsMap events={filteredEvents} />
            ) : (
                <div className={eventsCss.events_content}>
                    {displayedEvents.map((event) => (
                        <EventCard
                            key={event.id}
                            {...event}
                            isPastEvent={
                                event.endDate
                                    ? new Date(event.endDate) < new Date()
                                    : false
                            }
                        />
                    ))}
                </div>
            )}
        </section>
    );
}
