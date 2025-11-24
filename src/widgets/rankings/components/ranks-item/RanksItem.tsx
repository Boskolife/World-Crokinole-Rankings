"use client";
import React from "react";
import css from "./styles.module.scss";
import { IRankList } from "@/shared/types/rank-list.interface";
import { Icon } from "@/shared/ui/icons";
import cn from "classnames";

export const RanksItem: React.FC<IRankList> = ({
    rank,
    name,
    laurels,
    trend,
    wins,
    losses,
    ties,
    kingdom,
    club,
    trendUp,
}) => {
    return (
        <tr className={css.ranks_item}>
            <td className={css.ranks_item_value}>{rank}</td>
            <td className={css.ranks_item_value}>{name}</td>
            <td className={css.ranks_item_value}>{laurels}</td>
            <td
                className={cn(css.ranks_item_value, css.ranks_item_value_trend)}
            >
                {trendUp ? (
                    <Icon
                        name="arrow_up"
                        className={cn(css.ranks_item_value_trend_icon, css.up)}
                    />
                ) : (
                    <Icon
                        name="arrow_down"
                        className={cn(
                            css.ranks_item_value_trend_icon,
                            css.down
                        )}
                    />
                )}
                {trend}
            </td>
            <td className={css.ranks_item_value}>{wins}</td>
            <td className={css.ranks_item_value}>{losses}</td>
            <td className={css.ranks_item_value}>{ties}</td>
            <td className={css.ranks_item_value}>{kingdom}</td>
            <td className={css.ranks_item_value}>{club}</td>
        </tr>
    );
};
