"use client";

import React, { useMemo } from "react";
import { EventCard } from "@/widgets/events/components/event-card/EventCard";
import type { IEventCardProps } from "@/shared/types";
import css from "./EventDetailUpcomingEvents.module.scss";
import { useAuth } from "@/shared/hooks/use-auth";

export interface EventDetailUpcomingEventsProps {
    events: IEventCardProps[];
}

export function EventDetailUpcomingEvents({
    events,
}: EventDetailUpcomingEventsProps) {
    const { user, isMounted } = useAuth();

    const filteredEvents = useMemo(() => {
        if (!isMounted) return events;
        const viewerId = user?.id ?? null;
        return events.filter((e) => {
            const isTournament = (e.format ?? "").toLowerCase() === "tournament";
            const isDraft = (e.tournamentVisibility ?? "").toLowerCase() === "draft";
            if (!isTournament || !isDraft) return true;
            if (!viewerId) return false;
            return e.createdBy === viewerId;
        });
    }, [events, isMounted, user?.id]);

    if (!filteredEvents.length) return null;

    return (
        <section className={css.section}>
            <div className="container">
                <h2 className={css.title}>
                    Upcoming events at this location
                </h2>
                <div className={css.cards}>
                    {filteredEvents.map((event) => (
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
