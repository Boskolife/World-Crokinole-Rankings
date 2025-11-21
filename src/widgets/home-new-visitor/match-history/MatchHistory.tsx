import React, { useState, useMemo } from "react";
import css from "./styles.module.scss";
import { FormField } from "@/shared/ui/input";
import { useForm } from "react-hook-form";
import { IMatchHistoryFormData } from "@/shared/types/form.interface";
import { CustomDropdown } from "@/shared/ui/custom-dropdown";
import { Button } from "@/shared/ui/buttons";
import matchHistoryData from "@/data/match-history.json";
import { MatchHistoryItem } from "../components/match-history-item/MatchHistoryItem";
import { CustomCheckbox } from "@/shared/ui/checkbox";
import { usePopup } from "@/shared/contexts/popup-context";
import { useRouter } from "next/navigation";
import { useLocale } from "next-intl";
import { clientRoutes } from "@/shared/routes/client";
export const MatchHistory: React.FC = () => {
    const { openPopup } = usePopup();
    const router = useRouter();
    const locale = useLocale();
    const {
        register,
        formState: { errors },
    } = useForm<IMatchHistoryFormData>();

    const [selectedMatches, setSelectedMatches] = useState<Set<number>>(
        new Set()
    );

    const allMatchesSelected = useMemo(() => {
        return (
            matchHistoryData.matchHistory.length > 0 &&
            matchHistoryData.matchHistory.every((item) =>
                selectedMatches.has(item.rank)
            )
        );
    }, [selectedMatches]);

    const handleSelectAll = (checked: boolean) => {
        if (checked) {
            const allRanks = new Set(
                matchHistoryData.matchHistory.map((item) => item.rank)
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
                            rules={{ required: "Full name is required" }}
                            error={errors.fullName?.message as string}
                            className={css.match_history_head_input}
                            labelClassName={css.match_history_head_input_label}
                        />
                        <CustomDropdown
                            id="country"
                            name="country"
                            label="Kingdom (Country)"
                            placeholder="Select state/country"
                            options={[
                                {
                                    value: "United Kingdom",
                                    label: "United Kingdom",
                                },
                                {
                                    value: "United States",
                                    label: "United States",
                                },
                                { value: "Canada", label: "Canada" },
                                { value: "Australia", label: "Australia" },
                                { value: "New Zealand", label: "New Zealand" },
                                { value: "Other", label: "Other" },
                            ]}
                            register={register}
                            rules={{ required: "Country is required" }}
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
                        {matchHistoryData.matchHistory.map((item) => (
                            <MatchHistoryItem
                                key={item.rank}
                                {...item}
                                checked={selectedMatches.has(item.rank)}
                                onChange={(checked) =>
                                    handleMatchToggle(item.rank, checked)
                                }
                            />
                        ))}
                    </tbody>
                </table>
            </div>
        </section>
    );
};
