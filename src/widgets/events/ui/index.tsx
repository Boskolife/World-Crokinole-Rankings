"use client";
import React, { useEffect, useRef, useState } from "react";
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

const dateOptions = [
    { value: "today", label: "Today" },
    { value: "tomorrow", label: "Tomorrow" },
    { value: "this week", label: "This week" },
    { value: "next week", label: "Next week" },
    { value: "this month", label: "This month" },
    { value: "next month", label: "Next month" },
];

const locationOptions = [
    { value: "world", label: "World" },
    { value: "kingdom", label: "Kingdom" },
    { value: "region", label: "Region" },
];

const formatOptions = [
    { value: "singles", label: "Singles" },
    { value: "doubles", label: "Doubles" },
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
    const eventsContainerRef = useRef<HTMLDivElement>(null);
    const hasUserInteractedRef = useRef(false);
    const [activeSwitcher, setActiveSwitcher] = useState<"list" | "map">(
        "list"
    );
    const [currentPage, setCurrentPage] = useState(1);
    const pageSize = 6;
    const effectiveTotalItems = totalItems ?? events.length;
    const totalPages = needPagination
        ? Math.max(1, Math.ceil(effectiveTotalItems / pageSize))
        : 1;
    const resolvedCurrentPage = needPagination
        ? Math.min(currentPage, totalPages)
        : 1;

    const handleSwitcherClick = (switcher: "list" | "map") => {
        setActiveSwitcher(switcher);
    };

    const handlePageChange = (page: number) => {
        if (!needPagination) {
            return;
        }

        hasUserInteractedRef.current = true;
        const nextPage = Math.min(Math.max(page, 1), totalPages);
        setCurrentPage(nextPage);
    };

    useEffect(() => {
        if (!needPagination) {
            hasUserInteractedRef.current = false;
            return;
        }

        if (!hasUserInteractedRef.current) {
            return;
        }

        const container = eventsContainerRef.current;
        if (!container) {
            return;
        }

        const scrollTarget =
            container.getBoundingClientRect().top + window.scrollY;
        window.scrollTo({
            top: scrollTarget,
            behavior: "smooth",
        });
    }, [resolvedCurrentPage, needPagination]);

    const displayedEvents = needPagination
        ? events.slice(
              (resolvedCurrentPage - 1) * pageSize,
              (resolvedCurrentPage - 1) * pageSize + pageSize
          )
        : events.slice(0, effectiveTotalItems);

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
