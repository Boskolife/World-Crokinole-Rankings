"use client";
import React, { useState } from "react";
import css from "./styles.module.scss";
import { SwitcherModule, RatingChart } from "@/shared/modules";
import {
    ratingListSwitcherOptions,
    ratingListDropdownOptions,
} from "@/shared/constants/dropdown-options";
import { CustomRoundedDropdown } from "@/shared/ui";
import ratingChartData from "@/data/rating-chart-data.json";

export const RatingList: React.FC = () => {
    const [selectedType, setSelectedType] = useState<string>("Singles");

    const currentData =
        selectedType === "Singles"
            ? ratingChartData.singles
            : ratingChartData.doubles;

    return (
        <div className={css.rating_list}>
            <div className="container">
                <h3 className={css.rating_list_title}>
                    My rating list (24 months)
                </h3>
                <p className={css.rating_list_description}>
                    Monitor the dynamics of your game at all times
                </p>
                <div className={css.rating_list_head}>
                    <SwitcherModule
                        className={css.rating_list_switcher}
                        options={ratingListSwitcherOptions}
                        value={selectedType}
                        onChange={(value) => setSelectedType(value)}
                    />
                    <CustomRoundedDropdown
                        options={ratingListDropdownOptions}
                        placeholder="Jan 2025 - Sep 2025"
                        id="rating-list-switcher"
                    />
                </div>
                <div className={css.rating_list_chart_wrapper}>
                    <RatingChart
                        key={selectedType}
                        data={currentData.ratingData}
                        currentValue={currentData.currentValue}
                        change={currentData.change}
                        className={css.rating_list_chart}
                    />
                </div>
            </div>
        </div>
    );
};
