"use client";
import React, { useState, useRef } from "react";
import css from "./styles.module.scss";
import cn from "classnames";
import { Icon } from "@/shared/ui/icons";
import { SwitcherModule } from "@/shared/modules";
import { CustomRoundedDropdown } from "@/shared/ui";
import { RankingList } from "../components/ranking-list/RankingList";
import { Pagination } from "@/shared/modules";

import rankedListData from "@/data/ranked-list.json";
import { CustomButton } from "@/shared/ui/buttons";
import type { IRankList } from "@/shared/types/rank-list.interface";

const INITIAL_VISIBLE_ITEMS = 8;
const EXPANDED_VISIBLE_ITEMS = 20;

const worldOptions = [
    { value: "world", label: "World" },
    { value: "kingdom", label: "Kingdom" },
    { value: "region", label: "Region" },
];
const kingdomOptions = [
    { value: "kingdom", label: "Kingdom" },
    { value: "region", label: "Region" },
];

const clubOptions = [
    { value: "club", label: "Club" },
    { value: "region", label: "Region" },
];

type CategoryValue = "laurels" | "singles" | "doubles";

const switcherOptions: { value: CategoryValue; label: string }[] = [
    { value: "laurels", label: "Laurels" },
    { value: "singles", label: "Singles" },
    { value: "doubles", label: "Doubles" },
];

export const Rankings: React.FC = () => {
    const [isExpanded, setIsExpanded] = useState(false);
    const [currentPage, setCurrentPage] = useState(1);
    const [activeCategory, setActiveCategory] = useState<CategoryValue>(
        switcherOptions[0].value
    );
    const listRef = useRef<HTMLDivElement | null>(null);

    const categoryLists = rankedListData
        .rankedList as Record<CategoryValue, IRankList[]>;
    const activeList = categoryLists[activeCategory] ?? [];

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

    const handleViewFullList = () => {
        if (isExpanded) return;
        setIsExpanded(true);
        setCurrentPage(1);
    };

    const handlePageChange = (page: number) => {
        setCurrentPage(page);
        if (typeof window !== "undefined") {
            listRef.current?.scrollIntoView({
                behavior: "smooth",
                block: "start",
            });
        }
    };

    const handleCategoryChange = (value: CategoryValue) => {
        if (value === activeCategory) return;
        setActiveCategory(value);
        setIsExpanded(false);
        setCurrentPage(1);
        if (typeof window !== "undefined") {
            listRef.current?.scrollIntoView({
                behavior: "smooth",
                block: "start",
            });
        }
    };

    return (
        <div className={css.rankings}>
            <div className="container">
                <div className={css.rankings_head}>
                    <h2 className={css.rankings_head_title}>
                        World Crokinole Rankings
                    </h2>
                    <div className={css.rankings_head_search}>
                        <input
                            type="search"
                            placeholder="Find player by name or club"
                        />
                        <button
                            type="submit"
                            className={css.rankings_head_search_button}
                        >
                            <Icon
                                name="search"
                                className={css.rankings_head_search_button_icon}
                            />
                        </button>
                    </div>
                </div>
                <p className={css.rankings_description}>
                    See top players by rating & points
                </p>
                <div className={css.rankings_filters}>
                    <SwitcherModule
                        options={switcherOptions}
                        value={activeCategory}
                        onChange={handleCategoryChange}
                        className={css.rankings_filters_switcher}
                    />
                    <div className={css.rankings_filters_dropdowns}>
                        <CustomRoundedDropdown
                            className={css.rankings_filters_dropdown}
                            id="rating"
                            placeholder="World"
                            options={worldOptions}
                        />
                        <CustomRoundedDropdown
                            className={css.rankings_filters_dropdown}
                            id="singles"
                            placeholder="Kingdom"
                            options={kingdomOptions}
                        />
                        <CustomRoundedDropdown
                            className={css.rankings_filters_dropdown}
                            id="doubles"
                            placeholder="Club"
                            options={clubOptions}
                        />
                    </div>
                </div>
            </div>
            <div ref={listRef}>
                <RankingList
                    rankedList={displayedList}
                    className={cn(css.rankings_list, {
                        [css.rankings_list_expanded]: isExpanded,
                    })}
                />
            </div>
            <div className="container">
                <div className={css.rankings_footer}>
                    {shouldShowButton && (
                        <CustomButton
                            className={css.rankings_button}
                            onClick={handleViewFullList}
                        >
                            View Full Ranking List
                        </CustomButton>
                    )}
                    {shouldShowPagination && (
                        <Pagination
                            totalItems={totalItems}
                            pageSize={EXPANDED_VISIBLE_ITEMS}
                            currentPage={currentPage}
                            onPageChange={handlePageChange}
                        />
                    )}
                </div>
            </div>
        </div>
    );
};
