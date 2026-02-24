import React, { useState, useMemo, useEffect, useCallback } from "react";
import css from "./styles.module.scss";
import { SearchInput, CustomRoundedDropdown } from "@/shared/ui";
import { Button } from "@/shared/ui/buttons";
import { MatchHistoryItem } from "../components/match-history-item/MatchHistoryItem";
import { CustomCheckbox } from "@/shared/ui/checkbox";
import { Pagination } from "@/shared/modules";
import { usePopup } from "@/shared/contexts/popup-context";
import { useRouter } from "next/navigation";
import { useLocale } from "next-intl";
import { clientRoutes } from "@/shared/routes/client";
import { getMatchHistoryForClaim } from "@/shared/supabase/data";

const kingdomOptions = [
    { value: "United Kingdom", label: "United Kingdom" },
    { value: "United States", label: "United States" },
    { value: "Canada", label: "Canada" },
    { value: "Australia", label: "Australia" },
    { value: "New Zealand", label: "New Zealand" },
    { value: "Other", label: "Other" },
];

export const MatchHistory: React.FC = () => {
    const { openPopup } = usePopup();
    const router = useRouter();
    const locale = useLocale();

    const [matchHistoryData, setMatchHistoryData] = useState<Array<{
        rank: number;
        name: string;
        tournament: string;
        date: string;
        kingdom: string;
        club: string;
        myMatches: string;
        id: string;
    }>>([]);
    const [isLoading, setIsLoading] = useState(false);
    const [selectedMatches, setSelectedMatches] = useState<Set<string>>(
        new Set()
    );
    const [currentPage, setCurrentPage] = useState(1);
    const pageSize = 5;

    const [searchValue, setSearchValue] = useState("");
    const [search, setSearch] = useState("");
    const [country, setCountry] = useState("");

    const loadMatchHistory = useCallback(async () => {
        setIsLoading(true);
        try {
            const data = await getMatchHistoryForClaim({
                search: search,
                kingdom: country || undefined,
            });
            setMatchHistoryData(data);
            setCurrentPage(1);
        } catch (error) {
            console.error("Error loading match history:", error);
            setMatchHistoryData([]);
        } finally {
            setIsLoading(false);
        }
    }, [search, country]);

    useEffect(() => {
        loadMatchHistory();
    }, [loadMatchHistory]);

    const paginatedData = useMemo(() => {
        const startIndex = (currentPage - 1) * pageSize;
        const endIndex = startIndex + pageSize;
        return matchHistoryData.slice(startIndex, endIndex).map((item, index) => ({
            ...item,
            rank: startIndex + index + 1,
        }));
    }, [matchHistoryData, currentPage, pageSize]);

    const totalPages = Math.ceil(matchHistoryData.length / pageSize);

    useEffect(() => {
        if (currentPage > totalPages && totalPages > 0) {
            setCurrentPage(totalPages);
        }
    }, [totalPages, currentPage]);

    const allMatchesSelected = useMemo(() => {
        return (
            matchHistoryData.length > 0 &&
            matchHistoryData.every((item) =>
                selectedMatches.has(item.id)
            )
        );
    }, [selectedMatches, matchHistoryData]);

    const handleSelectAll = (checked: boolean) => {
        if (checked) {
            const allIds = new Set(
                matchHistoryData.map((item) => item.id)
            );
            setSelectedMatches(allIds);
        } else {
            setSelectedMatches(new Set());
        }
    };

    const handleMatchToggle = (id: string, checked: boolean) => {
        setSelectedMatches((prev) => {
            const newSet = new Set(prev);
            if (checked) {
                newSet.add(id);
            } else {
                newSet.delete(id);
            }
            return newSet;
        });
    };

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

    return (
        <section className={css.match_history}>
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
                                options={kingdomOptions}
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
                                    `/${locale}${clientRoutes.steps(4)}`
                                )
                            }
                        >
                            Skip for now
                        </Button>
                        <Button
                            buttonType="secondary"
                            className={css.match_history_head_button}
                            onClick={() => openPopup("verify")}
                        >
                            View Details
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
                                Tournament
                            </th>
                            <th className={css.match_history_list_head_item}>
                                Date
                            </th>
                            <th className={css.match_history_list_head_item}>
                                Kingdom(Country)
                            </th>
                            <th className={css.match_history_list_head_item}>
                                Club
                            </th>
                            <td className={css.match_history_list_head_item}>
                                <CustomCheckbox
                                    label="All matches"
                                    name="allMatches"
                                    checked={allMatchesSelected}
                                    onChange={(e) =>
                                        handleSelectAll(e.target.checked)
                                    }
                                    className={
                                        css.match_history_list_head_checkbox
                                    }
                                    classNameLabel={
                                        css.match_history_list_head_checkbox_label
                                    }
                                />
                            </td>
                        </tr>
                    </thead>
                    <tbody className={css.match_history_list_body}>
                        {isLoading ? (
                            <tr>
                                <td colSpan={7} style={{ textAlign: "center", padding: "20px" }}>
                                    Loading...
                                </td>
                            </tr>
                        ) : matchHistoryData.length === 0 ? (
                            <tr>
                                <td colSpan={7} style={{ textAlign: "center", padding: "20px" }}>
                                    No matches found
                                </td>
                            </tr>
                        ) : (
                            paginatedData.map((item) => (
                                <MatchHistoryItem
                                    key={item.id}
                                    {...item}
                                    checked={selectedMatches.has(item.id)}
                                    onChange={(checked) =>
                                        handleMatchToggle(item.id, checked)
                                    }
                                />
                            ))
                        )}
                    </tbody>
                </table>
            </div>
            {matchHistoryData.length > 0 && (
                <div className={css.match_history_pagination}>
                    <Pagination
                        totalItems={matchHistoryData.length}
                        pageSize={pageSize}
                        currentPage={currentPage}
                        onPageChange={handlePageChange}
                    />
                </div>
            )}
        </section>
    );
};
