import React, { useState, useMemo, useEffect, useCallback } from "react";
import css from "./styles.module.scss";
import { FormField } from "@/shared/ui/input";
import { useForm } from "react-hook-form";
import { IMatchHistoryFormData } from "@/shared/types/form.interface";
import { CustomDropdown } from "@/shared/ui/custom-dropdown";
import { Button } from "@/shared/ui/buttons";
import { MatchHistoryItem } from "../components/match-history-item/MatchHistoryItem";
import { CustomCheckbox } from "@/shared/ui/checkbox";
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
    const {
        register,
        watch,
        formState: { errors },
    } = useForm<IMatchHistoryFormData>();

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
    const [selectedMatches, setSelectedMatches] = useState<Set<number>>(
        new Set()
    );

    const fullName = watch("fullName") || "";
    const country = watch("country") || "";
    const [debouncedFullName, setDebouncedFullName] = useState("");

    useEffect(() => {
        const timer = setTimeout(() => {
            setDebouncedFullName(fullName);
        }, 300);

        return () => clearTimeout(timer);
    }, [fullName]);

    const loadMatchHistory = useCallback(async () => {
        setIsLoading(true);
        try {
            const data = await getMatchHistoryForClaim({
                search: debouncedFullName,
                kingdom: country || undefined,
            });
            setMatchHistoryData(data);
        } catch (error) {
            console.error("Error loading match history:", error);
            setMatchHistoryData([]);
        } finally {
            setIsLoading(false);
        }
    }, [debouncedFullName, country]);

    useEffect(() => {
        loadMatchHistory();
    }, [loadMatchHistory]);

    const allMatchesSelected = useMemo(() => {
        return (
            matchHistoryData.length > 0 &&
            matchHistoryData.every((item) =>
                selectedMatches.has(item.rank)
            )
        );
    }, [selectedMatches, matchHistoryData]);

    const handleSelectAll = (checked: boolean) => {
        if (checked) {
            const allRanks = new Set(
                matchHistoryData.map((item) => item.rank)
            );
            setSelectedMatches(allRanks);
        } else {
            setSelectedMatches(new Set());
        }
    };

    const handleMatchToggle = (rank: number, checked: boolean) => {
        setSelectedMatches((prev) => {
            const newSet = new Set(prev);
            if (checked) {
                newSet.add(rank);
            } else {
                newSet.delete(rank);
            }
            return newSet;
        });
    };

    return (
        <section className={css.match_history}>
            <div className="container">
                <div className={css.match_history_head}>
                    <div className={css.match_history_head_inputs}>
                        <FormField
                            id="fullName"
                            label="Full name"
                            name="fullName"
                            type="text"
                            placeholder="Enter your full name"
                            register={register}
                            error={errors.fullName?.message as string}
                            className={css.match_history_head_input}
                            labelClassName={css.match_history_head_input_label}
                        />
                        <CustomDropdown
                            id="country"
                            name="country"
                            label="Kingdom (Country)"
                            placeholder="Select state/country"
                            options={kingdomOptions}
                            register={register}
                            error={errors.country?.message as string}
                            className={css.match_history_head_input}
                            labelClassName={css.match_history_head_input_label}
                        />
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
                            matchHistoryData.map((item) => (
                                <MatchHistoryItem
                                    key={item.id}
                                    {...item}
                                    checked={selectedMatches.has(item.rank)}
                                    onChange={(checked) =>
                                        handleMatchToggle(item.rank, checked)
                                    }
                                />
                            ))
                        )}
                    </tbody>
                </table>
            </div>
        </section>
    );
};
