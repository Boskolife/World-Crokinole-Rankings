"use client";
import React from "react";
import css from "./styles.module.scss";
import cn from "classnames";
import { SwitcherModule } from "@/shared/modules";
import { CustomRoundedDropdown, SearchInput } from "@/shared/ui";
import { RankingList } from "../components/ranking-list/RankingList";
import { Pagination } from "@/shared/modules";

import rankedListData from "@/data/ranked-list.json";
import { CustomButton } from "@/shared/ui/buttons";
import { useRankingsList } from "@/shared/hooks";
import {
    worldOptions,
    kingdomFilterOptions,
    clubFilterOptions,
    rankingsSwitcherOptions,
    RankingsCategoryValue,
} from "@/shared/constants/dropdown-options";

type CategoryValue = RankingsCategoryValue;

export const Rankings: React.FC = () => {
    const {
        listRef,
        displayedList,
        activeCategory,
        totalItems,
        pageSize,
        currentPage,
        shouldShowButton,
        shouldShowPagination,
        isExpanded,
        handleCategoryChange,
        handlePageChange,
        handleViewFullList,
    } = useRankingsList<CategoryValue>({
        lists: rankedListData.rankedList,
        initialCategory: rankingsSwitcherOptions[0].value,
    });

    return (
        <div className={css.rankings} ref={listRef} id="rankings">
            <div className="container">
                <div className={css.rankings_head}>
                    <h2 className={css.rankings_head_title}>
                        World Crokinole Rankings
                    </h2>
                    <SearchInput
                        placeholder="Find player by name or club"
                        ariaLabel="Find player by name or club"
                        className={css.rankings_head_search}
                    />
                </div>
                <p className={css.rankings_description}>
                    See top players by rating & points
                </p>
                <div className={css.rankings_filters}>
                    <SwitcherModule
                        options={rankingsSwitcherOptions}
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
                            options={kingdomFilterOptions}
                        />
                        <CustomRoundedDropdown
                            className={css.rankings_filters_dropdown}
                            id="doubles"
                            placeholder="Club"
                            options={clubFilterOptions}
                        />
                    </div>
                </div>
            </div>
            <RankingList
                rankedList={displayedList}
                className={cn(css.rankings_list, {
                    [css.rankings_list_expanded]: isExpanded,
                })}
            />
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
                            pageSize={pageSize}
                            currentPage={currentPage}
                            onPageChange={handlePageChange}
                        />
                    )}
                </div>
            </div>
        </div>
    );
};
