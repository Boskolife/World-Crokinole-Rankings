"use client";

import { useEffect, useRef, useState } from "react";
import type { IEventCardProps } from "@/shared/types";

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
    const eventsContainerRef = useRef<HTMLDivElement>(null);
    const hasUserInteractedRef = useRef(false);
    const [activeSwitcher, setActiveSwitcher] = useState<"list" | "map">("list");
    const [currentPage, setCurrentPage] = useState(1);

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

    return {
        eventsContainerRef,
        activeSwitcher,
        displayedEvents,
        effectiveTotalItems,
        totalPages,
        resolvedCurrentPage,
        pageSize,
        handleSwitcherClick,
        handlePageChange,
    };
};

