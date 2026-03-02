"use client";

import React from "react";
import { EventCard } from "@/widgets/events/components/event-card/EventCard";
import type { IEventCardProps } from "@/shared/types";
import css from "./EventDetailUpcomingEvents.module.scss";

export interface EventDetailUpcomingEventsProps {
    events: IEventCardProps[];
}

export function EventDetailUpcomingEvents({
    events,
}: EventDetailUpcomingEventsProps) {
    if (!events.length) return null;

    return (
        <section className={css.section}>
            <div className="container">
                <h2 className={css.title}>
                    Upcoming events at this location
                </h2>
                <div className={css.cards}>
                    {events.map((event) => (
                        <EventCard
                            key={event.id}
                            {...event}
                            isPastEvent={false}
                        />
                    ))}
                </div>
            </div>
        </section>
    );
}
