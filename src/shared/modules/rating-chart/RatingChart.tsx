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

export type RatingChartPeriodFilter = "both" | "thisYear" | "lastYear";

interface IRatingChartProps {
    data: IRatingDataPoint[];
    currentValue?: number;
    change?: string;
    className?: string;
    periodFilter?: RatingChartPeriodFilter;
}

const formatYAxis = (value: number) => {
    if (value === 0) return "0";
    if (value >= 1000) return `${value / 1000}K`;
    return value.toString();
};

function getYDomainAndTicks(data: IRatingDataPoint[], periodFilter: RatingChartPeriodFilter): { domain: [number, number]; ticks: number[] } {
    const values = periodFilter === "lastYear"
        ? data.map((d) => d.lastYear).filter((v) => v > 0)
        : periodFilter === "thisYear"
            ? data.map((d) => d.thisYear).filter((v) => v > 0)
            : data.flatMap((d) => [d.thisYear, d.lastYear]).filter((v) => v > 0);
    if (values.length === 0) return { domain: [0, 2000], ticks: [0, 500, 1000, 1500, 2000] };
    const min = Math.min(...values);
    const max = Math.max(...values);
    const padding = Math.max(80, (max - min) * 0.15);
    const domainMin = Math.max(0, Math.floor(min - padding));
    const domainMax = Math.ceil(max + padding);
    const range = domainMax - domainMin;
    const step = range <= 500 ? 100 : range <= 1500 ? 250 : range <= 3000 ? 500 : 1000;
    const ticks: number[] = [];
    for (let t = domainMin; t <= domainMax; t += step) ticks.push(t);
    if (ticks[ticks.length - 1] < domainMax) ticks.push(domainMax);
    return { domain: [domainMin, domainMax], ticks };
}

export const RatingChart: React.FC<IRatingChartProps> = ({
    data,
    currentValue = 3354,
    change = "+16",
    className,
    periodFilter = "both",
}) => {
    const changeParsed = /^([+-]?\d+(?:\.\d+)?)/.exec(String(change).trim());
    const changeNum = changeParsed ? Number(changeParsed[1]) : 0;
    const isPositive = !Number.isNaN(changeNum) && changeNum >= 0;
    const { domain, ticks } = getYDomainAndTicks(data, periodFilter);
    const showThisYear = periodFilter === "both" || periodFilter === "thisYear";
    const showLastYear = periodFilter === "both" || periodFilter === "lastYear";

    return (
        <div className={cn(css.rating_chart, className)}>
            <div className={css.rating_chart_header}>
                <div className={css.rating_chart_header_value}>
                    <span className={css.rating_chart_header_number}>
                        {Math.round(Number(currentValue))}
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
                    {showThisYear && (
                        <span className={css.rating_chart_header_legend_item}>
                            This year
                        </span>
                    )}
                    {showLastYear && (
                        <span className={css.rating_chart_header_legend_item}>
                            Last year
                        </span>
                    )}
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
                            domain={domain}
                            ticks={ticks}
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
                        {showThisYear && (
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
                        )}
                        {showLastYear && (
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
                        )}
                    </LineChart>
                </ResponsiveContainer>
            </div>
        </div>
    );
};
