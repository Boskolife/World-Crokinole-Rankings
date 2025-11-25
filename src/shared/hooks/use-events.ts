"use client";

import { useState } from "react";
import type { IEventCardProps } from "@/shared/types";
import { usePagination } from "./use-pagination";

interface UseEventsOptions {
    events: IEventCardProps[];
    needPagination?: boolean;
    totalItems?: number;
    pageSize?: number;
}

interface UseEventsResult {
    eventsContainerRef: React.RefObject<HTMLDivElement | null>;
    activeSwitcher: "list" | "map";
    displayedEvents: IEventCardProps[];
    effectiveTotalItems: number;
    totalPages: number;
    resolvedCurrentPage: number;
    pageSize: number;
    handleSwitcherClick: (switcher: "list" | "map") => void;
    handlePageChange: (page: number) => void;
}

export const useEvents = ({
    events,
    needPagination = false,
    totalItems,
    pageSize = 6,
}: UseEventsOptions): UseEventsResult => {
    const [activeSwitcher, setActiveSwitcher] = useState<"list" | "map">("list");

    const {
        containerRef: eventsContainerRef,
        displayedItems: displayedEvents,
        effectiveTotalItems,
        totalPages,
        resolvedCurrentPage,
        pageSize: paginationPageSize,
        handlePageChange,
    } = usePagination<IEventCardProps>({
        items: events,
        needPagination,
        totalItems,
        pageSize,
    });

    const handleSwitcherClick = (switcher: "list" | "map") => {
        setActiveSwitcher(switcher);
    };

    return {
        eventsContainerRef,
        activeSwitcher,
        displayedEvents,
        effectiveTotalItems,
        totalPages,
        resolvedCurrentPage,
        pageSize: paginationPageSize,
        handleSwitcherClick,
        handlePageChange,
    };
};

