"use client";

import { useCallback, useEffect, useState } from "react";
import { useRouter } from "next/navigation";
import { Events } from "@/widgets/events";
import type { IEventCardProps } from "@/shared/types";
import { getFutureEvents, getPastEvents } from "@/shared/supabase/data";

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
    const [futureEventsState, setFutureEventsState] = useState<IEventCardProps[]>(futureEvents);
    const [pastEventsState, setPastEventsState] = useState<IEventCardProps[]>(pastEvents);

    const reloadEvents = useCallback(async () => {
        try {
            const [nextFuture, nextPast] = await Promise.all([
                getFutureEvents(),
                getPastEvents(),
            ]);
            setFutureEventsState(nextFuture);
            setPastEventsState(nextPast);
        } catch {
            router.refresh();
        }
    }, [router]);

    useEffect(() => {
        setFutureEventsState(futureEvents);
        setPastEventsState(pastEvents);
    }, [futureEvents, pastEvents]);

    useEffect(() => {
        void reloadEvents();

        const onVisible = () => {
            if (document.visibilityState === "visible") {
                void reloadEvents();
            }
        };
        document.addEventListener("visibilitychange", onVisible);

        const interval = setInterval(() => {
            if (document.visibilityState === "visible") {
                void reloadEvents();
            }
        }, EVENTS_REFRESH_INTERVAL_MS);

        return () => {
            document.removeEventListener("visibilitychange", onVisible);
            clearInterval(interval);
        };
    }, [reloadEvents]);

    return (
        <div id="events-list">
            <Events
                title="Future events"
                events={futureEventsState}
                needPagination
                totalItems={futureEventsState.length}
                isPastEvents={false}
            />
            <Events
                title="Past events"
                events={pastEventsState}
                needPagination
                totalItems={pastEventsState.length}
                isPastEvents
            />
        </div>
    );
}
