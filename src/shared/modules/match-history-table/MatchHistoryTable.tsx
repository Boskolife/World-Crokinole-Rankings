"use client";
import React from "react";
import css from "./styles.module.scss";
import { IMatchHistory } from "@/shared/types/match-history.interface";
import cn from "classnames";
import { RootLink } from "@/shared/ui/links/root-link";

interface IMatchHistoryTableProps {
    matches: IMatchHistory[];
    className?: string;
}

const getPlaceIcon = (place: number) => {
    if (place === 1) {
        return "🥇";
    } else if (place === 2) {
        return "🥈";
    } else if (place === 3) {
        return "🥉";
    }
    return null;
};

const formatDate = (dateString: string) => {
    const date = new Date(dateString);
    return date.toLocaleDateString("en-US", {
        month: "long",
        day: "numeric",
        year: "numeric",
    });
};

export const MatchHistoryTable: React.FC<IMatchHistoryTableProps> = ({
    matches,
    className,
}) => {
    return (
        <div className={cn(css.match_history_table_wrapper, className)}>
            <table className={css.match_history_table}>
                <thead>
                    <tr>
                        <th className={css.match_history_table_header}>
                            <span
                                className={css.match_history_table_header_name}
                            >
                                Tournament
                            </span>
                        </th>
                        <th className={css.match_history_table_header}>
                            <span
                                className={css.match_history_table_header_name}
                            >
                                Opponents
                            </span>
                        </th>
                        <th className={css.match_history_table_header}>
                            <span
                                className={css.match_history_table_header_name}
                            >
                                Score
                            </span>
                        </th>
                        <th className={css.match_history_table_header}>
                            <span
                                className={css.match_history_table_header_name}
                            >
                                Place
                            </span>
                        </th>
                        <th className={css.match_history_table_header}>
                            <span
                                className={css.match_history_table_header_name}
                            >
                                Date
                            </span>
                        </th>
                        <th className={css.match_history_table_header}></th>
                    </tr>
                </thead>
                <tbody>
                    {matches.map((match, index) => (
                        <tr
                            key={match.id}
                            className={cn(css.match_history_table_row, {
                                [css.match_history_table_row_even]:
                                    index % 2 === 1,
                            })}
                        >
                            <td className={css.match_history_table_cell}>
                                {match.tournamentName}
                            </td>
                            <td className={css.match_history_table_cell}>
                                {match.playerName}
                            </td>
                            <td className={css.match_history_table_cell}>
                                {match.score}
                            </td>
                            <td className={css.match_history_table_cell}>
                                <div
                                    className={
                                        css.match_history_table_cell_place
                                    }
                                >
                                    {getPlaceIcon(match.place) && (
                                        <span
                                            className={
                                                css.match_history_table_cell_place_icon
                                            }
                                        >
                                            {getPlaceIcon(match.place)}
                                        </span>
                                    )}
                                    <span>{match.place}</span>
                                </div>
                            </td>
                            <td className={css.match_history_table_cell}>
                                {formatDate(match.date)}
                            </td>
                            <td className={css.match_history_table_cell}>
                                <RootLink
                                    href={match.tournamentPageUrl}
                                    className={
                                        css.match_history_table_cell_link
                                    }
                                >
                                    Tournament Page
                                </RootLink>
                            </td>
                        </tr>
                    ))}
                </tbody>
            </table>
        </div>
    );
};
