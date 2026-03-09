"use client";
import React, { useState, useEffect, useCallback } from "react";
import css from "./styles.module.scss";
import { CustomRoundedDropdown, SearchInput } from "@/shared/ui";
import { Pagination } from "@/shared/modules";
import { PlayerTable } from "../../../shared/modules/player-table/PlayerTable";
import { IPlayer } from "@/shared/types";
import {
    getPlayersWithFilters,
    getUniqueKingdoms,
    getUniqueClubs,
} from "@/shared/supabase/data";
import { useDebounce } from "@/shared/hooks";

const SEARCH_DEBOUNCE_MS = 300;

interface PlayersProps {
    initialPlayers?: IPlayer[];
}

export const Players: React.FC<PlayersProps> = ({ initialPlayers = [] }) => {
    const [players, setPlayers] = useState<IPlayer[]>(initialPlayers);
    const [totalPlayers, setTotalPlayers] = useState(0);
    const [isLoading, setIsLoading] = useState(false);
    const [currentPage, setCurrentPage] = useState(1);
    const [searchValue, setSearchValue] = useState("");
    const debouncedSearch = useDebounce(searchValue, SEARCH_DEBOUNCE_MS);
    const [selectedKingdom, setSelectedKingdom] = useState("");
    const [selectedClub, setSelectedClub] = useState("");
    const [kingdomOptions, setKingdomOptions] = useState<
        Array<{ value: string; label: string }>
    >([]);
    const [clubOptions, setClubOptions] = useState<
        Array<{ value: string; label: string }>
    >([]);

    const pageSize = 10;

    const loadPlayers = useCallback(async () => {
        setIsLoading(true);
        try {
            const result = await getPlayersWithFilters({
                search: debouncedSearch || undefined,
                kingdom: selectedKingdom || undefined,
                club: selectedClub || undefined,
                page: currentPage,
                pageSize,
            });
            setPlayers(result.players);
            setTotalPlayers(result.total);
        } catch (error) {
            console.error("Error loading players:", error);
            setPlayers([]);
            setTotalPlayers(0);
        } finally {
            setIsLoading(false);
        }
    }, [debouncedSearch, selectedKingdom, selectedClub, currentPage, pageSize]);

    const loadFilterOptions = useCallback(async () => {
        try {
            const [kingdoms, clubs] = await Promise.all([
                getUniqueKingdoms(),
                getUniqueClubs(),
            ]);
            setKingdomOptions(kingdoms);
            setClubOptions(clubs);
        } catch (error) {
            console.error("Error loading filter options:", error);
        }
    }, []);

    useEffect(() => {
        loadFilterOptions();
    }, [loadFilterOptions]);

    useEffect(() => {
        loadPlayers();
    }, [loadPlayers]);

    const handleSearch = () => {
        setCurrentPage(1);
    };

    const handleSearchChange = (e: React.ChangeEvent<HTMLInputElement>) => {
        setSearchValue(e.target.value);
    };

    useEffect(() => {
        setCurrentPage(1);
    }, [debouncedSearch]);

    const handleKingdomChange = (value: string) => {
        setSelectedKingdom(value);
        setCurrentPage(1);
    };

    const handleClubChange = (value: string) => {
        setSelectedClub(value);
        setCurrentPage(1);
    };

    const handlePageChange = (page: number) => {
        setCurrentPage(page);
        window.scrollTo({ top: 0, behavior: "smooth" });
    };

    return (
        <div className={css.players}>
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
                        value={searchValue}
                        onChange={handleSearchChange}
                        onSearch={handleSearch}
                    />
                    <div className={css.players_filters}>
                        <CustomRoundedDropdown
                            id="kingdom"
                            options={[
                                { value: "", label: "All Kingdoms" },
                                ...kingdomOptions,
                            ]}
                            placeholder="Kingdom"
                            className={css.players_filters_dropdown}
                            value={selectedKingdom}
                            onChange={handleKingdomChange}
                        />
                        <CustomRoundedDropdown
                            id="club"
                            options={[
                                { value: "", label: "All Clubs" },
                                ...clubOptions,
                            ]}
                            placeholder="Club"
                            className={css.players_filters_dropdown}
                            value={selectedClub}
                            onChange={handleClubChange}
                        />
                    </div>
                </div>
                {isLoading ? (
                    <div className={css.players_loading}>Loading...</div>
                ) : (
                    <>
                        <PlayerTable players={players} />
                        {totalPlayers > 0 && (
                            <div className={css.players_pagination}>
                                <Pagination
                                    totalItems={totalPlayers}
                                    pageSize={pageSize}
                                    currentPage={currentPage}
                                    onPageChange={handlePageChange}
                                />
                            </div>
                        )}
                    </>
                )}
            </div>
        </div>
    );
};
