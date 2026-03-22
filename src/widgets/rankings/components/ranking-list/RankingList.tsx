import React from "react";
import css from "./styles.module.scss";
import { RanksItem } from "../ranks-item/RanksItem";
import { IRankList } from "@/shared/types/rank-list.interface";
import cn from "classnames";
import { Tooltip } from "@/shared/ui";
import Image from "next/image";

interface IProps {
    rankedList: IRankList[];
    className?: string;
}

export const RankingList: React.FC<IProps> = ({ rankedList, className }) => {
    return (
        <div className={cn(css.rankings_list, className)}>
            <table className={css.rankings_list_table}>
                <thead>
                    <tr className={css.rankings_list_head}>
                        <th className={css.rankings_list_head_item}>Rank</th>
                        <th className={css.rankings_list_head_item}>Name</th>
                        <th
                            className={cn(
                                css.rankings_list_head_item,
                                css.rankings_list_head_item_laurels
                            )}
                        >
                            Laurels
                            <Tooltip content="Top 8 tournament scores over the past 24 months. Tournament scores older than 12 months contribute only 75% of their original value.">
                                <Image
                                    src="/svg/info.svg"
                                    alt="info"
                                    width={16}
                                    height={16}
                                />
                            </Tooltip>
                        </th>
                        <th
                            className={cn(
                                css.rankings_list_head_item,
                                css.rankings_list_head_item_trend
                            )}
                        >
                            Trend
                            <Tooltip content="Change vs your rating after the last match on or before 90 days ago; if all matches are newer, vs rating before your earliest match.">
                                <Image
                                    src="/svg/info.svg"
                                    alt="info"
                                    width={16}
                                    height={16}
                                />
                            </Tooltip>
                        </th>
                        <th className={css.rankings_list_head_item}>Wins</th>
                        <th className={css.rankings_list_head_item}>Losses</th>
                        <th className={css.rankings_list_head_item}>Ties</th>
                        <th className={css.rankings_list_head_item}>
                            Kingdom(Country)
                        </th>
                        <th className={css.rankings_list_head_item}>Club</th>
                    </tr>
                </thead>
                <tbody>
                    {rankedList.map((item, index) => (
                        <RanksItem
                            key={`${item.rank}-${item.name}-${item.kingdom}-${index}`}
                            {...item}
                        />
                    ))}
                </tbody>
            </table>
        </div>
    );
};
