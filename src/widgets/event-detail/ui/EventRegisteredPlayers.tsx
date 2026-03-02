"use client";

import React from "react";
import Image from "next/image";
import cn from "classnames";
import { Icon } from "@/shared/ui/icons";
import { useTableSort } from "@/shared/hooks";
import { RootLink } from "@/shared/ui/links/root-link";
import { clientRoutes } from "@/shared/routes/client";
import type { IPlayer } from "@/shared/types";
import css from "./EventRegisteredPlayers.module.scss";

export interface EventRegisteredPlayersProps {
    players: IPlayer[];
}

const getCountryFlagUrl = (countryCode: string) =>
    `https://flagcdn.com/w160/${countryCode.toLowerCase()}.png`;

export function EventRegisteredPlayers({ players }: EventRegisteredPlayersProps) {
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
        if (sortColumn !== column) return "chevron_down";
        return sortDirection === "asc" ? "chevron_up" : "chevron_down";
    };

    return (
        <section className={css.section}>
            <div className="container">
                <h2 className={css.title}>List of registered players</h2>
                <div className={css.tableWrap}>
                    <div className={css.tableHeader}>
                        <button
                            type="button"
                            className={css.thName}
                            onClick={() => handleSort("name")}
                        >
                            <span>Name</span>
                            <Icon
                                name={getSortIcon("name")}
                                className={cn(css.thIcon, {
                                    [css.thIconActive]: sortColumn === "name",
                                })}
                            />
                        </button>
                        <button
                            type="button"
                            className={css.thKingdom}
                            onClick={() => handleSort("kingdom")}
                        >
                            <span>Kingdom</span>
                            <Icon
                                name={getSortIcon("kingdom")}
                                className={cn(css.thIcon, {
                                    [css.thIconActive]: sortColumn === "kingdom",
                                })}
                            />
                        </button>
                        <button
                            type="button"
                            className={css.thClub}
                            onClick={() => handleSort("club")}
                        >
                            <span>Club</span>
                            <Icon
                                name={getSortIcon("club")}
                                className={cn(css.thIcon, {
                                    [css.thIconActive]: sortColumn === "club",
                                })}
                            />
                        </button>
                        <button
                            type="button"
                            className={css.thRating}
                            onClick={() => handleSort("rating")}
                        >
                            <span>Rating</span>
                            <Icon
                                name={getSortIcon("rating")}
                                className={cn(css.thIcon, {
                                    [css.thIconActive]: sortColumn === "rating",
                                })}
                            />
                        </button>
                        <div className={css.thProfile} />
                    </div>
                    <div className={css.tableBody}>
                        {sortedPlayers.map((player, index) => (
                            <div
                                key={player.id}
                                className={cn(css.row, {
                                    [css.rowAlt]: index % 2 === 1,
                                })}
                            >
                                <div className={css.cellName}>
                                    <div className={css.avatarWrap}>
                                        {player.avatarUrl ? (
                                            <Image
                                                src={player.avatarUrl}
                                                alt=""
                                                width={36}
                                                height={36}
                                                className={css.avatar}
                                                unoptimized={
                                                    player.avatarUrl.includes(
                                                        "supabase.co"
                                                    )
                                                }
                                            />
                                        ) : (
                                            <div className={css.avatarPlaceholder} />
                                        )}
                                        <Image
                                            src={getCountryFlagUrl(
                                                player.countryCode
                                            )}
                                            alt=""
                                            width={36}
                                            height={36}
                                            className={css.flag}
                                            aria-hidden
                                        />
                                    </div>
                                    <span className={css.name}>{player.name}</span>
                                </div>
                                <div className={css.cellKingdom}>
                                    {player.kingdom}
                                </div>
                                <div className={css.cellClub}>
                                    {player.club}
                                </div>
                                <div className={css.cellRating}>
                                    {player.rating}
                                </div>
                                <div className={css.cellProfile}>
                                    <RootLink
                                        href={clientRoutes.playerProfile(
                                            player.id
                                        )}
                                        className={css.profileLink}
                                    >
                                        View profile
                                    </RootLink>
                                </div>
                            </div>
                        ))}
                    </div>
                </div>
            </div>
        </section>
    );
}
