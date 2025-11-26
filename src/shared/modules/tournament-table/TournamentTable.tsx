"use client";
import React from "react";
import css from "./styles.module.scss";
import { ITournament } from "@/shared/types/tournament.interface";
import cn from "classnames";
import { RootLink } from "@/shared/ui/links/root-link";

interface ITournamentTableProps {
    tournaments: ITournament[];
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

export const TournamentTable: React.FC<ITournamentTableProps> = ({
    tournaments,
    className,
}) => {
    return (
        <div className={cn(css.tournament_table_wrapper, className)}>
            <table className={css.tournament_table}>
                <thead>
                    <tr>
                        <th className={css.tournament_table_header}>
                            <span className={css.tournament_table_header_name}>
                                Tournament
                            </span>
                        </th>
                        <th className={css.tournament_table_header}>
                            <span className={css.tournament_table_header_name}>
                                Laurels
                            </span>
                        </th>
                        <th className={css.tournament_table_header}>
                            <span className={css.tournament_table_header_name}>
                                Strength of field
                            </span>
                        </th>
                        <th className={css.tournament_table_header}>
                            <span className={css.tournament_table_header_name}>
                                Wins
                            </span>
                        </th>
                        <th className={css.tournament_table_header}>
                            <span className={css.tournament_table_header_name}>
                                Loses
                            </span>
                        </th>
                        <th className={css.tournament_table_header}>
                            <span className={css.tournament_table_header_name}>
                                Ties
                            </span>
                        </th>
                        <th className={css.tournament_table_header}>
                            <span className={css.tournament_table_header_name}>
                                Place
                            </span>
                        </th>
                        <th className={css.tournament_table_header}>
                            <span className={css.tournament_table_header_name}>
                                Date
                            </span>
                        </th>
                        <th className={css.tournament_table_header}></th>
                    </tr>
                </thead>
                <tbody>
                    {tournaments.map((tournament, index) => (
                        <tr
                            key={tournament.id}
                            className={cn(css.tournament_table_row, {
                                [css.tournament_table_row_even]:
                                    index % 2 === 1,
                            })}
                        >
                            <td className={css.tournament_table_cell}>
                                {tournament.name}
                            </td>
                            <td className={css.tournament_table_cell}>
                                {tournament.laurels}
                            </td>
                            <td className={css.tournament_table_cell}>
                                {tournament.strengthOfField}
                            </td>
                            <td className={css.tournament_table_cell}>
                                {tournament.wins}
                            </td>
                            <td className={css.tournament_table_cell}>
                                {tournament.loses}
                            </td>
                            <td className={css.tournament_table_cell}>
                                {tournament.ties}
                            </td>
                            <td className={css.tournament_table_cell}>
                                <div
                                    className={css.tournament_table_cell_place}
                                >
                                    {getPlaceIcon(tournament.place) && (
                                        <span
                                            className={
                                                css.tournament_table_cell_place_icon
                                            }
                                        >
                                            {getPlaceIcon(tournament.place)}
                                        </span>
                                    )}
                                    <span>{tournament.place}</span>
                                </div>
                            </td>
                            <td className={css.tournament_table_cell}>
                                {formatDate(tournament.date)}
                            </td>
                            <td className={css.tournament_table_cell}>
                                <RootLink
                                    href={tournament.tournamentPageUrl}
                                    className={css.tournament_table_cell_link}
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
