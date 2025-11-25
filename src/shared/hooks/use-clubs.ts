"use client";

import type { IClub } from "@/shared/types";
import { usePagination } from "./use-pagination";

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
    const {
        containerRef: clubsContainerRef,
        displayedItems: displayedClubs,
        effectiveTotalItems,
        totalPages,
        resolvedCurrentPage,
        pageSize: paginationPageSize,
        handlePageChange,
    } = usePagination<IClub>({
        items: clubs,
        needPagination,
        totalItems,
        pageSize,
    });

    return {
        clubsContainerRef,
        displayedClubs,
        effectiveTotalItems,
        totalPages,
        resolvedCurrentPage,
        pageSize: paginationPageSize,
        handlePageChange,
    };
};

