"use client";
import React, { useMemo, useState } from "react";
import css from "./styles.module.scss";
import cn from "classnames";
import { SwitcherModule } from "@/shared/modules";
import { CustomRoundedDropdown, SearchInput } from "@/shared/ui";
import { RankingList } from "../components/ranking-list/RankingList";
import { Pagination } from "@/shared/modules";
import { CustomButton } from "@/shared/ui/buttons";
import { useRankingsList, useDebounce } from "@/shared/hooks";

const SEARCH_DEBOUNCE_MS = 300;
import {
    rankingsSwitcherOptions,
    RankingsCategoryValue,
} from "@/shared/constants/dropdown-options";
import type { IRankList } from "@/shared/types";

type CategoryValue = RankingsCategoryValue;

function filterList(
    list: IRankList[],
    searchQuery: string,
    kingdomFilter: string,
    clubFilter: string
): IRankList[] {
    return list.filter((item) => {
        const q = searchQuery.trim().toLowerCase();
        if (q && !item.name.toLowerCase().includes(q) && !(item.club || "").toLowerCase().includes(q)) {
            return false;
        }
        if (kingdomFilter && item.kingdom !== kingdomFilter) return false;
        if (clubFilter && item.club !== clubFilter) return false;
        return true;
    });
}

function getUniqueKingdoms(rankings: {
    laurels: IRankList[];
    singles: IRankList[];
    doubles: IRankList[];
}): { value: string; label: string }[] {
    const set = new Set<string>();
    [rankings.laurels, rankings.singles, rankings.doubles].forEach((list) =>
        list.forEach((r) => r.kingdom && set.add(r.kingdom))
    );
    const options = [{ value: "", label: "All Kingdoms" }];
    Array.from(set)
        .sort()
        .forEach((k) => options.push({ value: k, label: k }));
    return options;
}

function getUniqueClubs(rankings: {
    laurels: IRankList[];
    singles: IRankList[];
    doubles: IRankList[];
}): { value: string; label: string }[] {
    const set = new Set<string>();
    [rankings.laurels, rankings.singles, rankings.doubles].forEach((list) =>
        list.forEach((r) => r.club && set.add(r.club))
    );
    const options = [{ value: "", label: "All Clubs" }];
    Array.from(set)
        .sort()
        .forEach((c) => options.push({ value: c, label: c }));
    return options;
}

interface RankingsProps {
    rankings: {
        laurels: IRankList[];
        singles: IRankList[];
        doubles: IRankList[];
    };
    defaultExpanded?: boolean;
    viewFullListHref?: string;
}

export const Rankings: React.FC<RankingsProps> = ({
    rankings,
    defaultExpanded = false,
    viewFullListHref,
}) => {
    const [searchQuery, setSearchQuery] = useState("");
    const debouncedSearchQuery = useDebounce(searchQuery, SEARCH_DEBOUNCE_MS);
    const [kingdomFilter, setKingdomFilter] = useState("");
    const [clubFilter, setClubFilter] = useState("");

    const kingdomOptions = useMemo(() => getUniqueKingdoms(rankings), [rankings]);
    const clubOptions = useMemo(() => getUniqueClubs(rankings), [rankings]);

    const filteredRankings = useMemo(
        () => ({
            laurels: filterList(
                rankings.laurels,
                debouncedSearchQuery,
                kingdomFilter,
                clubFilter
            ),
            singles: filterList(
                rankings.singles,
                debouncedSearchQuery,
                kingdomFilter,
                clubFilter
            ),
            doubles: filterList(
                rankings.doubles,
                debouncedSearchQuery,
                kingdomFilter,
                clubFilter
            ),
        }),
        [rankings, debouncedSearchQuery, kingdomFilter, clubFilter]
    );

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
        lists: filteredRankings,
        initialCategory: rankingsSwitcherOptions[0].value,
        initialExpanded: defaultExpanded,
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
                        value={searchQuery}
                        onChange={(e) => setSearchQuery(e.target.value)}
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
                            id="kingdom"
                            placeholder="Kingdom"
                            options={kingdomOptions}
                            value={kingdomFilter}
                            onChange={setKingdomFilter}
                        />
                        <CustomRoundedDropdown
                            className={css.rankings_filters_dropdown}
                            id="club"
                            placeholder="Club"
                            options={clubOptions}
                            value={clubFilter}
                            onChange={setClubFilter}
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
                    {shouldShowButton &&
                        (viewFullListHref ? (
                            <CustomButton
                                className={css.rankings_button}
                                href={viewFullListHref}
                            >
                                View Full Ranking List
                            </CustomButton>
                        ) : (
                            <CustomButton
                                className={css.rankings_button}
                                onClick={handleViewFullList}
                            >
                                View Full Ranking List
                            </CustomButton>
                        ))}
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
