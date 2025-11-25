"use client";
import React from "react";
import css from "./styles.module.scss";
import { CustomRoundedDropdown } from "@/shared/ui";
import { Icon } from "@/shared/ui/icons";
import cn from "classnames";
import { EventCard } from "../components/event-card/EventCard";
import { IEventCardProps } from "@/shared/types";
import { CustomButton } from "@/shared/ui/buttons";
import { clientRoutes } from "@/shared/routes/client";
import { useRouter } from "next/navigation";
import { Pagination } from "@/shared/modules";
import { useEvents } from "@/shared/hooks";
import { locationOptions, formatOptions } from "@/shared/constants/dropdown-options";

const dateOptions = [
    { value: "today", label: "Today" },
    { value: "tomorrow", label: "Tomorrow" },
    { value: "this week", label: "This week" },
    { value: "next week", label: "Next week" },
    { value: "this month", label: "This month" },
    { value: "next month", label: "Next month" },
];

const typeOptions = [
    { value: "online", label: "Online" },
    { value: "in-person", label: "In-person" },
];

interface IEventsProps {
    title: string;
    events: IEventCardProps[];
    needViewAllButton?: boolean;
    needPagination?: boolean;
    totalItems?: number;
}

export const Events: React.FC<IEventsProps> = ({
    title,
    events,
    needViewAllButton = false,
    totalItems,
    needPagination = false,
}) => {
    const router = useRouter();
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
        events,
        needPagination,
        totalItems,
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
                        />
                        <CustomRoundedDropdown
                            id="Location"
                            options={locationOptions}
                            placeholder="Location"
                            className={css.events_head_dropdown}
                        />
                        <CustomRoundedDropdown
                            id="Format"
                            options={formatOptions}
                            placeholder="Format"
                            className={css.events_head_dropdown}
                        />
                        <CustomRoundedDropdown
                            id="Type"
                            options={typeOptions}
                            placeholder="Type"
                            className={css.events_head_dropdown}
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
                <div className={css.events_content}>
                    {displayedEvents.map((event) => (
                        <EventCard key={event.id} {...event} />
                    ))}
                </div>
                {needViewAllButton && (
                    <CustomButton
                        className={css.events_button}
                        onClick={() => router.push(clientRoutes.events)}
                    >
                        View all events
                    </CustomButton>
                )}
                {needPagination && (
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
