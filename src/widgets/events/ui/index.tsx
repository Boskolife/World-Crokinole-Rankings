"use client";
import React, { useState, useMemo, useEffect } from "react";
import css from "./styles.module.scss";
import { CustomRoundedDropdown, SearchInput } from "@/shared/ui";
import { Icon } from "@/shared/ui/icons";
import cn from "classnames";
import { EventCard } from "../components/event-card/EventCard";
import { EventsMap } from "../components/events-map/EventsMap";
import { IEventCardProps } from "@/shared/types";
import { CustomButton } from "@/shared/ui/buttons";
import { clientRoutes } from "@/shared/routes/client";
import { useRouter } from "next/navigation";
import { Pagination } from "@/shared/modules";
import { useEvents, useDebounce } from "@/shared/hooks";
import { getUniqueEventLocations, getUniqueEventFormats } from "@/shared/supabase/data";
import { useAuth } from "@/shared/hooks/use-auth";

const SEARCH_DEBOUNCE_MS = 300;

const getDateOptions = (isPastEvents: boolean) => {
    const prefix = isPastEvents ? "Last" : "Next";
    return [
        { value: "all", label: "All dates" },
        { value: "30d", label: `${prefix} 30 days` },
        { value: "3m", label: `${prefix} 3 months` },
        { value: "6m", label: `${prefix} 6 months` },
        { value: "9m", label: `${prefix} 9 months` },
        { value: "1y", label: `${prefix} 1 year` },
    ];
};


const typeOptions = [
    { value: "all", label: "All types" },
    { value: "ranked", label: "Ranked" },
    { value: "unranked", label: "Unranked" },
];

interface IEventsProps {
    title: string;
    events: IEventCardProps[];
    needViewAllButton?: boolean;
    needPagination?: boolean;
    totalItems?: number;
    isPastEvents?: boolean;
}

export const Events: React.FC<IEventsProps> = ({
    title,
    events,
    needViewAllButton = false,
    totalItems,
    needPagination = false,
    isPastEvents = false,
}) => {
    const router = useRouter();
    const { user, isMounted } = useAuth();
    const [searchQuery, setSearchQuery] = useState<string>("");
    const debouncedSearchQuery = useDebounce(searchQuery, SEARCH_DEBOUNCE_MS);
    const [dateFilter, setDateFilter] = useState<string>("all");
    const [locationFilter, setLocationFilter] = useState<string>("all");
    const [formatFilter, setFormatFilter] = useState<string>("all");
    const [typeFilter, setTypeFilter] = useState<string>("all");
    const [locationOptions, setLocationOptions] = useState<Array<{ value: string; label: string }>>([
        { value: "all", label: "All locations" },
    ]);
    const [formatOptions, setFormatOptions] = useState<Array<{ value: string; label: string }>>([
        { value: "all", label: "All formats" },
    ]);

    useEffect(() => {
        Promise.all([getUniqueEventLocations(), getUniqueEventFormats()]).then(
            ([locations, formats]) => {
                setLocationOptions([{ value: "all", label: "All locations" }, ...locations]);
                setFormatOptions([{ value: "all", label: "All formats" }, ...formats]);
            }
        );
    }, []);

    const filteredEvents = useMemo(() => {
        let filtered = [...events];

        if (isMounted) {
            const viewerId = user?.id ?? null;
            filtered = filtered.filter((e) => {
                const isTournament = (e.format ?? "").toLowerCase() === "tournament";
                const isDraft = (e.tournamentVisibility ?? "").toLowerCase() === "draft";
                if (!isTournament || !isDraft) return true;
                if (!viewerId) return false;
                return e.createdBy === viewerId;
            });
        }

        if (debouncedSearchQuery.trim()) {
            const q = debouncedSearchQuery.trim().toLowerCase();
            filtered = filtered.filter(
                (event) =>
                    (event.title ?? "").toLowerCase().includes(q) ||
                    (event.location ?? "").toLowerCase().includes(q) ||
                    (event.format ?? "").toLowerCase().includes(q)
            );
        }

        if (dateFilter !== "all") {
            const now = new Date();
            const today = new Date(now.getFullYear(), now.getMonth(), now.getDate());
            const todayTime = today.getTime();

            const addPeriod = (months: number, days = 0) => {
                const d = new Date(today);
                d.setMonth(d.getMonth() + months);
                d.setDate(d.getDate() + days);
                return d.getTime();
            };

            let rangeStart: number;
            let rangeEnd: number;
            switch (dateFilter) {
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
                    rangeStart = 0;
                    rangeEnd = 0;
            }

            filtered = filtered.filter((event) => {
                const dateStr = isPastEvents ? event.endDate ?? event.startDate : event.startDate;
                if (!dateStr) return false;
                const eventDate = new Date(dateStr);
                const eventDateOnly = new Date(eventDate.getFullYear(), eventDate.getMonth(), eventDate.getDate());
                const eventTime = eventDateOnly.getTime();

                if (isPastEvents) {
                    return eventTime <= todayTime && eventTime >= todayTime - (rangeEnd - rangeStart);
                }
                return eventTime >= rangeStart && eventTime <= rangeEnd;
            });
        }

        if (locationFilter !== "all") {
            filtered = filtered.filter((event) => event.location === locationFilter);
        }

        if (formatFilter !== "all") {
            filtered = filtered.filter((event) => event.format === formatFilter);
        }

        if (typeFilter !== "all") {
            filtered = filtered.filter((event) => {
                if (typeFilter === "ranked") return event.isRanked === true;
                if (typeFilter === "unranked") return event.isRanked !== true;
                return true;
            });
        }

        return filtered;
    }, [events, debouncedSearchQuery, dateFilter, locationFilter, formatFilter, typeFilter, isPastEvents, user?.id, isMounted]);

    const {
        eventsContainerRef,
        activeSwitcher,
        displayedEvents,
        effectiveTotalItems,
        resolvedCurrentPage,
        pageSize,
        handleSwitcherClick,
        handlePageChange,
    } = useEvents({
        events: filteredEvents,
        needPagination,
        totalItems: filteredEvents.length,
    });

    return (
        <div className={css.events} ref={eventsContainerRef}>
            <div className="container">
                <h2 className={css.events_title}>{title}</h2>
                <div className={css.events_head}>
                    <div className={css.events_head_filters}>
                        <div className={css.events_head_search}>
                            <SearchInput
                                placeholder="Search events"
                                value={searchQuery}
                                onChange={(e) => setSearchQuery(e.target.value)}
                                ariaLabel="Search events by title, location or format"
                            />
                        </div>
                        <CustomRoundedDropdown
                            id="Date"
                            options={getDateOptions(isPastEvents)}
                            placeholder="Date"
                            className={css.events_head_dropdown}
                            value={dateFilter}
                            onChange={setDateFilter}
                        />
                        <CustomRoundedDropdown
                            id="Location"
                            options={locationOptions}
                            placeholder="Location"
                            className={css.events_head_dropdown}
                            value={locationFilter}
                            onChange={setLocationFilter}
                        />
                        <CustomRoundedDropdown
                            id="Format"
                            options={formatOptions}
                            placeholder="Format"
                            className={css.events_head_dropdown}
                            value={formatFilter}
                            onChange={setFormatFilter}
                        />
                        <CustomRoundedDropdown
                            id="Type"
                            options={typeOptions}
                            placeholder="Type"
                            className={css.events_head_dropdown}
                            value={typeFilter}
                            onChange={setTypeFilter}
                        />
                    </div>
                    <div
                        className={cn(css.events_head_switcher, {
                            [css.events_head_switcher_list]:
                                activeSwitcher === "list",
                            [css.events_head_switcher_map]:
                                activeSwitcher === "map",
                        })}
                    >
                        <button
                            className={cn(css.events_head_switcher_button, {
                                [css.events_head_switcher_button_active]:
                                    activeSwitcher === "list",
                            })}
                            onClick={() => handleSwitcherClick("list")}
                            type="button"
                            aria-label="Show events as list"
                        >
                            <Icon
                                name="list"
                                className={css.events_head_switcher_button_icon}
                            />
                        </button>
                        <button
                            className={cn(css.events_head_switcher_button, {
                                [css.events_head_switcher_button_active]:
                                    activeSwitcher === "map",
                            })}
                            onClick={() => handleSwitcherClick("map")}
                            type="button"
                            aria-label="Show events on map"
                        >
                            <Icon
                                name="map"
                                className={css.events_head_switcher_button_icon}
                            />
                        </button>
                    </div>
                </div>
                {activeSwitcher === "map" ? (
                    <EventsMap events={filteredEvents} />
                ) : (
                    <div className={css.events_content}>
                        {displayedEvents.map((event) => (
                            <EventCard key={event.id} {...event} isPastEvent={isPastEvents} />
                        ))}
                    </div>
                )}
                {needViewAllButton && activeSwitcher === "list" && (
                    <CustomButton
                        className={css.events_button}
                        onClick={() => router.push(clientRoutes.events)}
                    >
                        View all events
                    </CustomButton>
                )}
                {needPagination && activeSwitcher === "list" && (
                    <Pagination
                        totalItems={effectiveTotalItems}
                        pageSize={pageSize}
                        currentPage={resolvedCurrentPage}
                        onPageChange={handlePageChange}
                    />
                )}
            </div>
        </div>
    );
};
