"use client";
import React from "react";
import css from "./styles.module.scss";
import {
    LineChart,
    Line,
    XAxis,
    YAxis,
    Tooltip,
    ResponsiveContainer,
} from "recharts";
import cn from "classnames";

interface IRatingDataPoint {
    month: string;
    thisYear: number;
    lastYear: number;
}

interface IRatingChartProps {
    data: IRatingDataPoint[];
    currentValue?: number;
    change?: string;
    className?: string;
}

const formatYAxis = (value: number) => {
    if (value === 0) return "0";
    if (value >= 1000) return `${value / 1000}K`;
    return value.toString();
};

export const RatingChart: React.FC<IRatingChartProps> = ({
    data,
    currentValue = 3354,
    change = "+16",
    className,
}) => {
    const isPositive = Number(change) >= 0;

    return (
        <div className={cn(css.rating_chart, className)}>
            <div className={css.rating_chart_header}>
                <div className={css.rating_chart_header_value}>
                    <span className={css.rating_chart_header_number}>
                        {currentValue}
                    </span>
                    <div
                        className={cn(css.rating_chart_header_change, {
                            [css.rating_chart_header_change_positive]:
                                isPositive,
                            [css.rating_chart_header_change_negative]:
                                !isPositive,
                        })}
                    >
                        <span className={css.rating_chart_header_arrow}>
                            {isPositive ? "↑" : "↓"}
                        </span>
                        <span>{change}</span>
                    </div>
                </div>
                <span className={css.rating_chart_header_divider}></span>
                <div className={css.rating_chart_header_legend}>
                    <span className={css.rating_chart_header_legend_item}>
                        This year
                    </span>
                    <span className={css.rating_chart_header_legend_item}>
                        Last year
                    </span>
                </div>
            </div>
            <div className={css.rating_chart_container}>
                <ResponsiveContainer
                    width="100%"
                    height={270}
                    className={css.rating_chart_container_chart}
                >
                    <LineChart data={data}>
                        <XAxis
                            dataKey="month"
                            stroke="var(--black-30)"
                            tick={{ fill: "var(--black-40)", fontSize: 12 }}
                            axisLine={false}
                            tickLine={false}
                        />
                        <YAxis
                            tick={{ fill: "var(--black-40)", fontSize: 12 }}
                            axisLine={false}
                            tickLine={false}
                            tickFormatter={formatYAxis}
                            domain={[0, 5000]}
                            ticks={[0, 1000, 3000, 5000]}
                            allowDecimals={false}
                        />
                        <Tooltip
                            contentStyle={{
                                backgroundColor: "var(--white)",
                                border: "1px solid var(--blue-light)",
                                borderRadius: "8px",
                                color: "var(--black)",
                                boxShadow: "0 2px 8px rgba(0,0,0,0.1)",
                            }}
                            labelStyle={{ color: "var(--black)" }}
                        />
                        <Line
                            type="monotone"
                            dataKey="thisYear"
                            name="This year"
                            stroke="var(--black)"
                            strokeWidth={1}
                            dot={false}
                            activeDot={{ r: 6 }}
                            legendType="line"
                        />
                        <Line
                            type="monotone"
                            dataKey="lastYear"
                            name="Last year"
                            stroke="var(--blue-dark-2)"
                            strokeWidth={1}
                            strokeDasharray="5 5"
                            dot={false}
                            activeDot={{ r: 6 }}
                            legendType="line"
                        />
                    </LineChart>
                </ResponsiveContainer>
            </div>
        </div>
    );
};
