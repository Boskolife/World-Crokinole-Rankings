"use client";
import React, { useState, useMemo } from "react";
import css from "./styles.module.scss";
import { SwitcherModule, RatingChart } from "@/shared/modules";
import type { RatingChartPeriodFilter } from "@/shared/modules/rating-chart/RatingChart";
import { ratingListSwitcherOptions, getRatingListPeriodOptions } from "@/shared/constants/dropdown-options";
import { CustomRoundedDropdown } from "@/shared/ui";
import ratingChartData from "@/data/rating-chart-data.json";
import type { IRatingHistoryFromSinglesDoubles } from "@/shared/supabase/data";

interface RatingListProps {
    ratingData?: IRatingHistoryFromSinglesDoubles | null;
    isLoading?: boolean;
}

export const RatingList: React.FC<RatingListProps> = ({ ratingData, isLoading = false }) => {
    const [selectedType, setSelectedType] = useState<string>("Singles");
    const [selectedPeriod, setSelectedPeriod] = useState<string>("both");

    const periodOptions = useMemo(() => getRatingListPeriodOptions(), []);
    const periodPlaceholder = periodOptions[0]?.label ?? "Last 24 months";

    if (isLoading) {
        return (
            <div className={css.rating_list}>
                <div className="container">
                    <div className={css.rating_list_head}>
                        <h3 className={css.rating_list_title}>My rating list (24 months)</h3>
                    </div>
                    <p className={css.rating_list_description} style={{ opacity: 0.7 }}>
                        Loading chart…
                    </p>
                </div>
            </div>
        );
    }

    const source: IRatingHistoryFromSinglesDoubles = ratingData ?? (ratingChartData as unknown as IRatingHistoryFromSinglesDoubles);
    const currentData =
        selectedType === "Singles"
            ? source.singles
            : source.doubles;

    const periodFilter: RatingChartPeriodFilter =
        selectedPeriod === "thisYear" ? "thisYear" : selectedPeriod === "lastYear" ? "lastYear" : "both";

    return (
        <div className={css.rating_list}>
            <div className="container">
                <div className={css.rating_list_head}>
                    <div className={css.rating_list_title_row}>
                        <h3 className={css.rating_list_title}>
                            My rating list (24 months)
                        </h3>
                        <SwitcherModule
                            className={css.rating_list_switcher}
                            options={ratingListSwitcherOptions}
                            value={selectedType}
                            onChange={(value) => setSelectedType(value)}
                        />
                    </div>
                    <CustomRoundedDropdown
                        className={css.rating_list_dropdown}
                        options={periodOptions}
                        value={selectedPeriod}
                        onChange={(value) => setSelectedPeriod(value)}
                        placeholder={periodPlaceholder}
                        id="rating-list-period"
                    />
                </div>
                <p className={css.rating_list_description}>
                    Monitor the dynamics of your game at all times
                </p>
                <div className={css.rating_list_chart_wrapper}>
                    <RatingChart
                        key={`${selectedType}-${selectedPeriod}`}
                        data={currentData.ratingData}
                        currentValue={currentData.currentValue}
                        change={currentData.change}
                        periodFilter={periodFilter}
                        className={css.rating_list_chart}
                    />
                </div>
            </div>
        </div>
    );
};
