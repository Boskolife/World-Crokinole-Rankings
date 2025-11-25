"use client";

import { useEffect, useRef, useState } from "react";
import type { IClub } from "@/shared/types";

interface UseClubsOptions {
    clubs: IClub[];
    needPagination?: boolean;
    totalItems?: number;
    pageSize?: number;
}

interface UseClubsResult {
    clubsContainerRef: React.RefObject<HTMLDivElement | null>;
    displayedClubs: IClub[];
    effectiveTotalItems: number;
    totalPages: number;
    resolvedCurrentPage: number;
    pageSize: number;
    handlePageChange: (page: number) => void;
}

export const useClubs = ({
    clubs,
    needPagination = false,
    totalItems,
    pageSize = 6,
}: UseClubsOptions): UseClubsResult => {
    const clubsContainerRef = useRef<HTMLDivElement>(null);
    const hasUserInteractedRef = useRef(false);
    const [currentPage, setCurrentPage] = useState(1);

    const effectiveTotalItems = totalItems ?? clubs.length;
    const totalPages = needPagination
        ? Math.max(1, Math.ceil(effectiveTotalItems / pageSize))
        : 1;
    const resolvedCurrentPage = needPagination
        ? Math.min(currentPage, totalPages)
        : 1;

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

        const container = clubsContainerRef.current;
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

    const displayedClubs = needPagination
        ? clubs.slice(
              (resolvedCurrentPage - 1) * pageSize,
              (resolvedCurrentPage - 1) * pageSize + pageSize
          )
        : clubs.slice(0, effectiveTotalItems);

    return {
        clubsContainerRef,
        displayedClubs,
        effectiveTotalItems,
        totalPages,
        resolvedCurrentPage,
        pageSize,
        handlePageChange,
    };
};

