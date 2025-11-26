"use client";
import React from "react";
import css from "./styles.module.scss";
import { MatchHistoryTable } from "@/shared/modules/match-history-table/MatchHistoryTable";
import matchHistoryList from "@/data/match-history-list.json";
import { IMatchHistory } from "@/shared/types/match-history.interface";
import { Pagination } from "@/shared/modules";
import { usePagination } from "@/shared/hooks";

export const MatchHistory: React.FC = () => {
    const matches: IMatchHistory[] = matchHistoryList.matches;

    const {
        containerRef,
        displayedItems: displayedMatches,
        effectiveTotalItems,
        resolvedCurrentPage,
        pageSize,
        handlePageChange,
    } = usePagination<IMatchHistory>({
        items: matches,
        needPagination: true,
        pageSize: 10,
    });

    return (
        <div className={css.match_history} ref={containerRef}>
            <div className="container">
                <h3 className={css.match_history_title}>Match history</h3>
                <MatchHistoryTable
                    matches={displayedMatches}
                    className={css.match_history_table}
                />
                <div className={css.match_history_pagination}>
                    <Pagination
                        totalItems={effectiveTotalItems}
                        pageSize={pageSize}
                        currentPage={resolvedCurrentPage}
                        onPageChange={handlePageChange}
                    />
                </div>
            </div>
        </div>
    );
};
