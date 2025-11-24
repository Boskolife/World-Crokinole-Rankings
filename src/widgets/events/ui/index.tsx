"use client";
import React, { useState } from "react";
import css from "./styles.module.scss";
import { CustomRoundedDropdown } from "@/shared/ui";
import { Icon } from "@/shared/ui/icons";
import cn from "classnames";
import { EventCard } from "../components/event-card/EventCard";
import eventsList from "@/data/events-list.json";
import { IEventCardProps } from "@/shared/types";
import { CustomButton } from "@/shared/ui/buttons";
import { clientRoutes } from "@/shared/routes/client";
import { useRouter } from "next/navigation";

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

export const Events: React.FC = () => {
    const router = useRouter();
    const [activeSwitcher, setActiveSwitcher] = useState<"list" | "map">(
        "list"
    );

    const handleSwitcherClick = (switcher: "list" | "map") => {
        setActiveSwitcher(switcher);
    };

    const events: IEventCardProps[] = eventsList.events;

    return (
        <div className={css.events}>
            <div className="container">
                <h2 className={css.events_title}>Future events</h2>
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
                    {events.map((event) => (
                        <EventCard key={event.id} {...event} />
                    ))}
                </div>
                <CustomButton
                    className={css.events_button}
                    onClick={() => router.push(clientRoutes.events)}
                >
                    View all events
                </CustomButton>
            </div>
        </div>
    );
};
