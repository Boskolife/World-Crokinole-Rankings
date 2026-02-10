"use client";

import { Events } from "@/widgets/events";
import type { IEventCardProps } from "@/shared/types";

interface EventsClientProps {
    title: string;
    events: IEventCardProps[];
    needViewAllButton?: boolean;
    totalItems?: number;
}

export function EventsClient({
    title,
    events,
    needViewAllButton,
    totalItems,
}: EventsClientProps) {
    return (
        <Events
            title={title}
            events={events}
            needViewAllButton={needViewAllButton}
            totalItems={totalItems}
        />
    );
}



