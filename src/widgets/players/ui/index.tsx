"use client";
import React from "react";
import css from "./styles.module.scss";
import { CustomRoundedDropdown, SearchInput } from "@/shared/ui";
import { Pagination } from "@/shared/modules";
import { PlayerTable } from "../../../shared/modules/player-table/PlayerTable";
import { usePagination } from "@/shared/hooks";
import { IPlayer } from "@/shared/types";
import { exampleKingdomOptions } from "@/shared/constants";

const clubOptions = [
    { value: "club-1", label: "Club 1" },
    { value: "club-2", label: "Club 2" },
    { value: "club-3", label: "Club 3" },
];

interface PlayersProps {
    players: IPlayer[];
}

export const Players: React.FC<PlayersProps> = ({ players }) => {

    const {
        containerRef,
        displayedItems: displayedPlayers,
        effectiveTotalItems,
        resolvedCurrentPage,
        pageSize,
        handlePageChange,
    } = usePagination<IPlayer>({
        items: players,
        needPagination: true,
        pageSize: 10,
    });

    return (
        <div className={css.players} ref={containerRef}>
            <div className="container">
                <h2 className={css.players_title}>Players</h2>
                <p className={css.players_description}>
                    Explore player profiles and stats
                </p>
                <div className={css.players_head}>
                    <SearchInput
                        placeholder="Find player by name or club"
                        ariaLabel="Find player by name or club"
                        className={css.players_head_search}
                    />
                    <div className={css.players_filters}>
                        <CustomRoundedDropdown
                            id="kingdom"
                            options={exampleKingdomOptions}
                            placeholder="Kingdom"
                            className={css.players_filters_dropdown}
                        />
                        <CustomRoundedDropdown
                            id="club"
                            options={clubOptions}
                            placeholder="Club"
                            className={css.players_filters_dropdown}
                        />
                    </div>
                </div>
                <PlayerTable players={displayedPlayers} />
                <div className={css.players_pagination}>
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
