"use client";
import React from "react";
import css from "./styles.module.scss";
import { IPlayer } from "@/shared/types/player.interface";
import { Icon } from "@/shared/ui/icons";
import cn from "classnames";
import { RootLink } from "@/shared/ui/links/root-link";
import Image from "next/image";
import { useTableSort } from "@/shared/hooks";

interface IPlayerTableProps {
    players: IPlayer[];
}

const getCountryFlagUrl = (countryCode: string) => {
    // Using a flag icon service - you can replace with your own flag images
    return `https://flagcdn.com/w160/${countryCode.toLowerCase()}.png`;
};

export const PlayerTable: React.FC<IPlayerTableProps> = ({ players }) => {
    const {
        sortColumn,
        sortDirection,
        sortedData: sortedPlayers,
        handleSort,
    } = useTableSort<IPlayer>({
        data: players,
        sortFn: (player, column) => {
            switch (column) {
                case "name":
                    return player.name.toLowerCase();
                case "kingdom":
                    return player.kingdom.toLowerCase();
                case "club":
                    return player.club.toLowerCase();
                case "rating":
                    return player.rating;
                default:
                    return "";
            }
        },
    });

    const getSortIcon = (column: string) => {
        if (sortColumn !== column) {
            return "chevron_down";
        }
        return sortDirection === "asc" ? "chevron_up" : "chevron_down";
    };
    return (
        <div className={css.player_table_wrapper}>
            <table className={css.player_table}>
                <thead>
                    <tr>
                        <th className={css.player_table_header}>
                            <button
                                type="button"
                                className={css.player_table_header_name}
                                onClick={() => handleSort("name")}
                            >
                                <span>Name</span>
                                <Icon
                                    name={getSortIcon("name")}
                                    className={cn(
                                        css.player_table_header_icon,
                                        {
                                            [css.player_table_header_icon_active]:
                                                sortColumn === "name",
                                        }
                                    )}
                                />
                            </button>
                        </th>
                        <th className={css.player_table_header}>
                            <button
                                type="button"
                                className={css.player_table_header_name}
                                onClick={() => handleSort("kingdom")}
                            >
                                <span>Kingdom</span>
                                <Icon
                                    name={getSortIcon("kingdom")}
                                    className={cn(
                                        css.player_table_header_icon,
                                        {
                                            [css.player_table_header_icon_active]:
                                                sortColumn === "kingdom",
                                        }
                                    )}
                                />
                            </button>
                        </th>
                        <th className={css.player_table_header}>
                            <button
                                type="button"
                                className={css.player_table_header_name}
                                onClick={() => handleSort("club")}
                            >
                                <span>Club</span>
                                <Icon
                                    name={getSortIcon("club")}
                                    className={cn(
                                        css.player_table_header_icon,
                                        {
                                            [css.player_table_header_icon_active]:
                                                sortColumn === "club",
                                        }
                                    )}
                                />
                            </button>
                        </th>
                        <th className={css.player_table_header}>
                            <button
                                type="button"
                                className={css.player_table_header_name}
                                onClick={() => handleSort("rating")}
                            >
                                <span>Rating</span>
                                <Icon
                                    name={getSortIcon("rating")}
                                    className={cn(
                                        css.player_table_header_icon,
                                        {
                                            [css.player_table_header_icon_active]:
                                                sortColumn === "rating",
                                        }
                                    )}
                                />
                            </button>
                        </th>
                        <th className={css.player_table_header}></th>
                    </tr>
                </thead>
                <tbody>
                    {sortedPlayers.map((player, index) => (
                        <tr
                            key={player.id}
                            className={cn(css.player_table_row, {
                                [css.player_table_row_even]: index % 2 === 1,
                            })}
                        >
                            <td className={css.player_table_cell}>
                                <div className={css.player_table_cell_name}>
                                    <Image
                                        src={getCountryFlagUrl(
                                            player.countryCode
                                        )}
                                        alt={player.countryCode}
                                        className={css.player_table_cell_flag}
                                        width={36}
                                        height={36}
                                    />
                                    <span>{player.name}</span>
                                </div>
                            </td>
                            <td className={css.player_table_cell}>
                                {player.kingdom}
                            </td>
                            <td className={css.player_table_cell}>
                                {player.club}
                            </td>
                            <td className={css.player_table_cell}>
                                {player.rating}
                            </td>
                            <td className={css.player_table_cell}>
                                <RootLink
                                    href={`/players/${player.id}`}
                                    className={css.player_table_cell_link}
                                >
                                    View profile
                                </RootLink>
                            </td>
                        </tr>
                    ))}
                </tbody>
            </table>
        </div>
    );
};
