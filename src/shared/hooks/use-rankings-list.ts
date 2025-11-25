"use client";

import { useRef, useState } from "react";
import type { IRankList } from "@/shared/types/rank-list.interface";

const INITIAL_VISIBLE_ITEMS = 8;
const EXPANDED_VISIBLE_ITEMS = 20;

interface UseRankingsListOptions<Category extends string> {
    lists: Record<Category, IRankList[]>;
    initialCategory: Category;
}

interface UseRankingsListResult<Category extends string> {
    listRef: React.RefObject<HTMLDivElement>;
    displayedList: IRankList[];
    totalItems: number;
    pageSize: number;
    currentPage: number;
    activeCategory: Category;
    shouldShowButton: boolean;
    shouldShowPagination: boolean;
    isExpanded: boolean;
    handleViewFullList: () => void;
    handlePageChange: (page: number) => void;
    handleCategoryChange: (value: Category) => void;
}

export function useRankingsList<Category extends string>({
    lists,
    initialCategory,
}: UseRankingsListOptions<Category>): UseRankingsListResult<Category> {
    const [isExpanded, setIsExpanded] = useState(false);
    const [currentPage, setCurrentPage] = useState(1);
    const [activeCategory, setActiveCategory] =
        useState<Category>(initialCategory);
    const listRef = useRef<HTMLDivElement>(null!);

    const activeList = lists[activeCategory] ?? [];
    const totalItems = activeList.length;

    const displayedList = !isExpanded
        ? activeList.slice(0, INITIAL_VISIBLE_ITEMS)
        : activeList.slice(
              (currentPage - 1) * EXPANDED_VISIBLE_ITEMS,
              (currentPage - 1) * EXPANDED_VISIBLE_ITEMS +
                  EXPANDED_VISIBLE_ITEMS
          );

    const shouldShowButton = !isExpanded && totalItems > INITIAL_VISIBLE_ITEMS;
    const shouldShowPagination =
        isExpanded && totalItems > EXPANDED_VISIBLE_ITEMS;

    const scrollToListTop = () => {
        if (typeof window === "undefined") {
            return;
        }

        const container = listRef.current;
        if (!container) {
            return;
        }

        const scrollTarget =
            container.getBoundingClientRect().top + window.scrollY;
        window.scrollTo({
            top: scrollTarget,
            behavior: "smooth",
        });
    };

    const handleViewFullList = () => {
        if (isExpanded) return;
        setIsExpanded(true);
        setCurrentPage(1);
    };

    const handlePageChange = (page: number) => {
        setCurrentPage(page);
        // Используем setTimeout для того, чтобы прокрутка происходила после обновления DOM
        setTimeout(() => {
            scrollToListTop();
        }, 0);
    };

    const handleCategoryChange = (value: Category) => {
        if (value === activeCategory) return;
        setActiveCategory(value);
        setIsExpanded(false);
        setCurrentPage(1);
        scrollToListTop();
    };

    return {
        listRef,
        displayedList,
        totalItems,
        isExpanded,
        pageSize: EXPANDED_VISIBLE_ITEMS,
        currentPage,
        activeCategory,
        shouldShowButton,
        shouldShowPagination,
        handleViewFullList,
        handlePageChange,
        handleCategoryChange,
    };
}

