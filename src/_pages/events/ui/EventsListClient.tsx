"use client";

import { useEffect } from "react";
import { useRouter } from "next/navigation";
import { Events } from "@/widgets/events";
import type { IEventCardProps } from "@/shared/types";

const EVENTS_REFRESH_INTERVAL_MS = 60 * 1000;

interface EventsListClientProps {
    futureEvents: IEventCardProps[];
    pastEvents: IEventCardProps[];
}

export function EventsListClient({
    futureEvents,
    pastEvents,
}: EventsListClientProps) {
    const router = useRouter();

    useEffect(() => {
        const onVisible = () => {
            if (document.visibilityState === "visible") router.refresh();
        };
        document.addEventListener("visibilitychange", onVisible);

        const interval = setInterval(() => {
            if (document.visibilityState === "visible") router.refresh();
        }, EVENTS_REFRESH_INTERVAL_MS);

        return () => {
            document.removeEventListener("visibilitychange", onVisible);
            clearInterval(interval);
        };
    }, [router]);

    return (
        <div id="events-list">
            <Events
                title="Future events"
                events={futureEvents}
                needPagination
                totalItems={futureEvents.length}
                isPastEvents={false}
            />
            <Events
                title="Past events"
                events={pastEvents}
                needPagination
                totalItems={pastEvents.length}
                isPastEvents
            />
        </div>
    );
}
