import React, { useState, useMemo, useEffect, useCallback } from "react";
import cn from "classnames";
import css from "./styles.module.scss";
import { SearchInput, CustomRoundedDropdown } from "@/shared/ui";
import { Button } from "@/shared/ui/buttons";
import { MatchHistoryItem } from "../components/match-history-item/MatchHistoryItem";
import { CustomCheckbox } from "@/shared/ui/checkbox";
import { Pagination } from "@/shared/modules";
import { useRouter } from "next/navigation";
import { useLocale } from "next-intl";
import { clientRoutes } from "@/shared/routes/client";
import { getPlayersWithFilters, getUniqueKingdoms, linkPlayerToAccount } from "@/shared/supabase/data";
import { useUserProfile } from "@/shared/hooks/use-user-profile";
import { useAuth } from "@/shared/hooks/use-auth";

interface MatchHistoryProps {
    compact?: boolean;
}

function normalizeName(name: string): string {
    return (name || "").trim().toLowerCase();
}

export const MatchHistory: React.FC<MatchHistoryProps> = ({ compact }) => {
    const router = useRouter();
    const locale = useLocale();
    const { profile } = useUserProfile();
    const { user } = useAuth();
    const [isLinking, setIsLinking] = useState(false);
    const [selectedRowId, setSelectedRowId] = useState<string | null>(null);

    const [playersData, setPlayersData] = useState<Array<{
        rank: number;
        name: string;
        rating: number;
        kingdom: string;
        club: string;
        myMatches: string;
        id: string;
        rowId: string;
        isMe: boolean;
    }>>([]);
    const [totalPlayers, setTotalPlayers] = useState(0);
    const [isLoading, setIsLoading] = useState(false);
    const [currentPage, setCurrentPage] = useState(1);
    const pageSize = compact ? 4 : 10;

    const [searchValue, setSearchValue] = useState("");
    const [search, setSearch] = useState("");
    const [country, setCountry] = useState("");
    const [kingdomOptions, setKingdomOptions] = useState<Array<{ value: string; label: string }>>([]);

    useEffect(() => {
        getUniqueKingdoms().then(setKingdomOptions);
    }, []);

    const userFullNameNorm = profile?.full_name?.trim() ? normalizeName(profile.full_name) : "";

    const loadPlayers = useCallback(async () => {
        setIsLoading(true);
        try {
            const { players, total } = await getPlayersWithFilters({
                search: search || undefined,
                kingdom: country || undefined,
                page: currentPage,
                pageSize,
            });
            const startRank = (currentPage - 1) * pageSize;
            const rows = players.map((p, index) => ({
                rank: startRank + index + 1,
                name: p.name || "",
                rating: p.rating ?? 0,
                kingdom: p.kingdom || "",
                club: p.club || "",
                myMatches: "This is me",
                id: p.id,
                rowId: p.rowId ?? p.id,
                isMe: userFullNameNorm ? normalizeName(p.name) === userFullNameNorm : false,
            }));
            const matchIndex = rows.findIndex((r) => r.isMe);
            const orderedRows =
                matchIndex >= 0
                    ? [rows[matchIndex], ...rows.slice(0, matchIndex), ...rows.slice(matchIndex + 1)]
                    : rows;
            const withRanks = orderedRows.map((r, i) => ({
                ...r,
                rank: startRank + i + 1,
            }));
            setPlayersData(withRanks);
            setTotalPlayers(total);
            setSelectedRowId(null);
        } catch (error) {
            console.error("Error loading players:", error);
            setPlayersData([]);
            setTotalPlayers(0);
        } finally {
            setIsLoading(false);
        }
    }, [search, country, currentPage, pageSize, userFullNameNorm]);

    useEffect(() => {
        loadPlayers();
    }, [loadPlayers]);

    const totalPages = Math.ceil(totalPlayers / pageSize) || 1;

    useEffect(() => {
        if (currentPage > totalPages && totalPages > 0) {
            setCurrentPage(totalPages);
        }
    }, [totalPages, currentPage]);

    const handlePageChange = (page: number) => {
        setCurrentPage(page);
        window.scrollTo({ top: 0, behavior: "smooth" });
    };

    const handleSearchChange = (e: React.ChangeEvent<HTMLInputElement>) => {
        setSearchValue(e.target.value);
    };

    const handleSearch = () => {
        setSearch(searchValue);
        setCurrentPage(1);
    };

    const linkRow = selectedRowId
        ? playersData.find((r) => r.rowId === selectedRowId)
        : playersData.find((r) => r.isMe);

    const handleLinkMyData = async () => {
        if (!user?.id || !linkRow?.rowId) return;
        setIsLinking(true);
        try {
            const { error } = await linkPlayerToAccount(linkRow.rowId, user.id);
            if (!error) {
                router.push(`/${locale}${clientRoutes.steps(5)}`);
            }
        } finally {
            setIsLinking(false);
        }
    };

    const handleThisIsMeToggle = (rowId: string, checked: boolean) => {
        setSelectedRowId(checked ? rowId : null);
    };

    return (
        <section className={cn(css.match_history, compact && css.match_history_compact)}>
            <div className="container">
                <div className={css.match_history_head}>
                    <div className={css.match_history_head_inputs}>
                        <div className={css.match_history_head_input}>
                            <label className={css.match_history_head_input_label}>Full name</label>
                            <SearchInput
                                id="fullName"
                                name="fullName"
                                placeholder="Enter your full name"
                                ariaLabel="Enter your full name"
                                searchButtonAriaLabel="Search by full name"
                                value={searchValue}
                                onChange={handleSearchChange}
                                onSearch={handleSearch}
                            />
                        </div>
                        <div className={css.match_history_head_input}>
                            <label className={css.match_history_head_input_label}>Kingdom (Country)</label>
                            <CustomRoundedDropdown
                                id="country"
                                placeholder="Select state/country"
                                options={[{ value: "", label: "All Kingdoms" }, ...kingdomOptions]}
                                value={country}
                                onChange={(value) => {
                                    setCountry(value);
                                    setCurrentPage(1);
                                }}
                            />
                        </div>
                    </div>
                    <div className={css.match_history_head_buttons}>
                        <Button
                            buttonType="primary"
                            className={css.match_history_head_button}
                            onClick={() =>
                                router.push(
                                    `/${locale}${clientRoutes.steps(5)}`
                                )
                            }
                        >
                            Skip for now
                        </Button>
                        <Button
                            buttonType="secondary"
                            className={css.match_history_head_button}
                            onClick={handleLinkMyData}
                            disabled={!linkRow || isLinking}
                        >
                            {isLinking ? "Linking…" : "Link my data to this account"}
                        </Button>
                    </div>
                </div>
            </div>
            <div className={css.match_history_list_wrapper}>
                <table className={css.match_history_table}>
                    <thead>
                        <tr className={css.match_history_list_head}>
                            <th className={css.match_history_list_head_item}>
                                Rank
                            </th>
                            <th className={css.match_history_list_head_item}>
                                Name
                            </th>
                            <th className={css.match_history_list_head_item}>
                                Rating
                            </th>
                            <th className={css.match_history_list_head_item}>
                                Kingdom(Country)
                            </th>
                            <th className={css.match_history_list_head_item}>
                                Club
                            </th>
                            <td className={css.match_history_list_head_item}>
                                <span className={css.match_history_list_head_checkbox_label}>
                                    This is me
                                </span>
                            </td>
                        </tr>
                    </thead>
                    <tbody className={css.match_history_list_body}>
                        {isLoading ? (
                            <tr>
                                <td colSpan={6} style={{ textAlign: "center", padding: "20px" }}>
                                    Loading...
                                </td>
                            </tr>
                        ) : playersData.length === 0 ? (
                            <tr>
                                <td colSpan={6} style={{ textAlign: "center", padding: "20px" }}>
                                    No players found
                                </td>
                            </tr>
                        ) : (
                            playersData.map((item) => {
                                const isSelected = selectedRowId !== null ? item.rowId === selectedRowId : item.isMe;
                                return (
                                    <MatchHistoryItem
                                        key={item.id}
                                        rank={item.rank}
                                        name={item.name}
                                        rating={item.rating}
                                        kingdom={item.kingdom}
                                        club={item.club}
                                        myMatches={item.myMatches}
                                        checked={isSelected}
                                        isHighlighted={isSelected}
                                        onChange={(checked) => handleThisIsMeToggle(item.rowId, checked)}
                                    />
                                );
                            })
                        )}
                    </tbody>
                </table>
            </div>
            {totalPlayers > 0 && (
                <div className={css.match_history_pagination}>
                    <Pagination
                        totalItems={totalPlayers}
                        pageSize={pageSize}
                        currentPage={currentPage}
                        onPageChange={handlePageChange}
                    />
                </div>
            )}
        </section>
    );
};
