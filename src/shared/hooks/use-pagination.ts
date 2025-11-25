"use client";

import { useEffect, useRef, useState } from "react";

interface UsePaginationOptions<T> {
    items: T[];
    needPagination?: boolean;
    totalItems?: number;
    pageSize?: number;
}

interface UsePaginationResult<T> {
    containerRef: React.RefObject<HTMLDivElement | null>;
    displayedItems: T[];
    effectiveTotalItems: number;
    totalPages: number;
    resolvedCurrentPage: number;
    pageSize: number;
    handlePageChange: (page: number) => void;
}

export const usePagination = <T,>({
    items,
    needPagination = false,
    totalItems,
    pageSize = 6,
}: UsePaginationOptions<T>): UsePaginationResult<T> => {
    const containerRef = useRef<HTMLDivElement>(null);
    const hasUserInteractedRef = useRef(false);
    const [currentPage, setCurrentPage] = useState(1);

    const effectiveTotalItems = totalItems ?? items.length;
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

        const container = containerRef.current;
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

    const displayedItems = needPagination
        ? items.slice(
              (resolvedCurrentPage - 1) * pageSize,
              (resolvedCurrentPage - 1) * pageSize + pageSize
          )
        : items.slice(0, effectiveTotalItems);

    return {
        containerRef,
        displayedItems,
        effectiveTotalItems,
        totalPages,
        resolvedCurrentPage,
        pageSize,
        handlePageChange,
    };
};

