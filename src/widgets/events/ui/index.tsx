"use client";
import React, { useState, useMemo } from "react";
import css from "./styles.module.scss";
import { CustomRoundedDropdown } from "@/shared/ui";
import { Icon } from "@/shared/ui/icons";
import cn from "classnames";
import { EventCard } from "../components/event-card/EventCard";
import { EventsMap } from "../components/events-map/EventsMap";
import { IEventCardProps } from "@/shared/types";
import { CustomButton } from "@/shared/ui/buttons";
import { clientRoutes } from "@/shared/routes/client";
import { useRouter } from "next/navigation";
import { Pagination } from "@/shared/modules";
import { useEvents } from "@/shared/hooks";

const dateOptions = [
    { value: "all", label: "All dates" },
    { value: "today", label: "Today" },
    { value: "tomorrow", label: "Tomorrow" },
    { value: "this week", label: "This week" },
    { value: "next week", label: "Next week" },
    { value: "this month", label: "This month" },
    { value: "next month", label: "Next month" },
];

const locationOptions = [
    { value: "all", label: "All locations" },
    { value: "Toronto, Canada", label: "Toronto, Canada" },
    { value: "Chicago, IL", label: "Chicago, IL" },
    { value: "London, UK", label: "London, UK" },
    { value: "New York, NY", label: "New York, NY" },
    { value: "Vancouver, BC", label: "Vancouver, BC" },
    { value: "Detroit, MI", label: "Detroit, MI" },
    { value: "Paris, France", label: "Paris, France" },
    { value: "Boston, MA", label: "Boston, MA" },
    { value: "Montreal, QC", label: "Montreal, QC" },
    { value: "Seattle, WA", label: "Seattle, WA" },
    { value: "Philadelphia, PA", label: "Philadelphia, PA" },
];

const formatOptions = [
    { value: "all", label: "All formats" },
    { value: "Double Elimination Tournament", label: "Double Elimination" },
    { value: "Round Robin / Single Elimination", label: "Round Robin / Single Elimination" },
    { value: "Swiss System Tournament", label: "Swiss System" },
    { value: "Best of 7 Series", label: "Best of 7 Series" },
    { value: "Double Round Robin", label: "Double Round Robin" },
    { value: "Single Tournament / Round Robin", label: "Single Tournament / Round Robin" },
    { value: "Knockout Tournament", label: "Knockout" },
    { value: "Round Robin", label: "Round Robin" },
    { value: "Multi-Format Tournament", label: "Multi-Format" },
    { value: "Single Elimination", label: "Single Elimination" },
    { value: "Casual Tournament", label: "Casual Tournament" },
];

const typeOptions = [
    { value: "all", label: "All types" },
    { value: "online", label: "Online" },
    { value: "in-person", label: "In-person" },
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
    const [dateFilter, setDateFilter] = useState<string>("all");
    const [locationFilter, setLocationFilter] = useState<string>("all");
    const [formatFilter, setFormatFilter] = useState<string>("all");
    const [typeFilter, setTypeFilter] = useState<string>("all");

    const filteredEvents = useMemo(() => {
        let filtered = [...events];

        if (dateFilter !== "all") {
            const now = new Date();
            const today = new Date(now.getFullYear(), now.getMonth(), now.getDate());
            const tomorrow = new Date(today);
            tomorrow.setDate(tomorrow.getDate() + 1);
            const thisWeekEnd = new Date(today);
            thisWeekEnd.setDate(thisWeekEnd.getDate() + 7);
            const nextWeekStart = new Date(today);
            nextWeekStart.setDate(nextWeekStart.getDate() + 7);
            const nextWeekEnd = new Date(nextWeekStart);
            nextWeekEnd.setDate(nextWeekEnd.getDate() + 7);
            const thisMonthEnd = new Date(today.getFullYear(), today.getMonth() + 1, 0);
            const nextMonthStart = new Date(today.getFullYear(), today.getMonth() + 1, 1);
            const nextMonthEnd = new Date(today.getFullYear(), today.getMonth() + 2, 0);

            filtered = filtered.filter((event) => {
                if (!event.startDate) return false;
                const eventDate = new Date(event.startDate);
                const eventDateOnly = new Date(eventDate.getFullYear(), eventDate.getMonth(), eventDate.getDate());
                
                switch (dateFilter) {
                    case "today":
                        return eventDateOnly.getTime() === today.getTime();
                    case "tomorrow":
                        return eventDateOnly.getTime() === tomorrow.getTime();
                    case "this week":
                        return eventDateOnly >= today && eventDateOnly <= thisWeekEnd;
                    case "next week":
                        return eventDateOnly >= nextWeekStart && eventDateOnly <= nextWeekEnd;
                    case "this month":
                        return eventDateOnly >= today && eventDateOnly <= thisMonthEnd;
                    case "next month":
                        return eventDateOnly >= nextMonthStart && eventDateOnly <= nextMonthEnd;
                    default:
                        return true;
                }
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
                if (typeFilter === "online") {
                    return event.location.toLowerCase().includes("online") || 
                           event.location.toLowerCase().includes("virtual");
                } else {
                    return !event.location.toLowerCase().includes("online") && 
                           !event.location.toLowerCase().includes("virtual");
                }
            });
        }

        return filtered;
    }, [events, dateFilter, locationFilter, formatFilter, typeFilter]);

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
                        <CustomRoundedDropdown
                            id="Date"
                            options={dateOptions}
                            placeholder="Date"
                            className={css.events_head_dropdown}
                            value={dateFilter}
                            onChange={setDateFilter}
                            defaultOpen
                        />
                        <CustomRoundedDropdown
                            id="Location"
                            options={locationOptions}
                            placeholder="Location"
                            className={css.events_head_dropdown}
                            value={locationFilter}
                            onChange={setLocationFilter}
                            defaultOpen
                        />
                        <CustomRoundedDropdown
                            id="Format"
                            options={formatOptions}
                            placeholder="Format"
                            className={css.events_head_dropdown}
                            value={formatFilter}
                            onChange={setFormatFilter}
                            defaultOpen
                        />
                        <CustomRoundedDropdown
                            id="Type"
                            options={typeOptions}
                            placeholder="Type"
                            className={css.events_head_dropdown}
                            value={typeFilter}
                            onChange={setTypeFilter}
                            defaultOpen
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
