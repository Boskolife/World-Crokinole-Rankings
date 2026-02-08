"use client";

import { Events } from "@/widgets/events";
import type { IEventCardProps } from "@/shared/types";

interface EventsClientProps {
    title: string;
    events: IEventCardProps[];
    needPagination?: boolean;
    totalItems?: number;
    isPastEvents?: boolean;
}

export function EventsClient({
    title,
    events,
    needPagination,
    totalItems,
    isPastEvents,
}: EventsClientProps) {
    return (
        <Events
            title={title}
            events={events}
            needPagination={needPagination}
            totalItems={totalItems}
            isPastEvents={isPastEvents}
        />
    );
}


