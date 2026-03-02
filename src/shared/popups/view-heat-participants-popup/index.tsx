"use client";

import React from "react";
import Image from "next/image";
import cn from "classnames";
import { Icon } from "@/shared/ui/icons";
import { usePopup } from "@/shared/contexts/popup-context";
import type { IPlayer } from "@/shared/types";
import css from "../styles.module.scss";
import modCss from "./ViewHeatParticipantsPopup.module.scss";

const getCountryFlagUrl = (countryCode: string) =>
    `https://flagcdn.com/w160/${countryCode.toLowerCase()}.png`;

type ViewHeatParticipantsPopupData = {
    heatLabel?: string;
    heatDateTime?: string;
    players?: IPlayer[];
};

export const ViewHeatParticipantsPopup: React.FC = () => {
    const { closePopup, getPopupData } = usePopup();
    const data = getPopupData("view-heat-participants") as ViewHeatParticipantsPopupData | undefined;
    const heatLabel = data?.heatLabel ?? "Qualifying Heat";
    const heatDateTime = data?.heatDateTime ?? "";
    const players = data?.players ?? [];

    return (
        <div className={css.popup}>
            <div className={css.popup_close}>
                <Icon
                    name="x"
                    className={css.popup_close_icon}
                    onClick={() => closePopup("view-heat-participants")}
                />
            </div>
            <div className={css.popup_content}>
                <div className={modCss.section}>
                    <div className={modCss.header}>
                        <h2 className={modCss.title}>{heatLabel}</h2>
                        {heatDateTime && (
                            <p className={modCss.subtitle}>{heatDateTime}</p>
                        )}
                    </div>
                    <div className={modCss.tableWrap}>
                        <div className={modCss.tableHeader}>
                            <div className={modCss.thName}>Name</div>
                            <div className={modCss.thKingdom}>Kingdom</div>
                            <div className={modCss.thClub}>Club</div>
                            <div className={modCss.thRating}>Rating</div>
                        </div>
                        <div className={modCss.tableBody}>
                            {players.length === 0 ? (
                                <div className={modCss.empty}>
                                    No participants yet.
                                </div>
                            ) : (
                                players.map((player, index) => (
                                    <div
                                        key={player.id}
                                        className={cn(modCss.row, {
                                            [modCss.row_alt]: index % 2 === 1,
                                        })}
                                    >
                                        <div className={modCss.cellName}>
                                            <div className={modCss.avatarWrap}>
                                                {player.avatarUrl ? (
                                                    <Image
                                                        src={player.avatarUrl}
                                                        alt=""
                                                        width={36}
                                                        height={36}
                                                        className={modCss.avatar}
                                                        unoptimized={
                                                            player.avatarUrl.includes("supabase.co")
                                                        }
                                                    />
                                                ) : (
                                                    <div className={modCss.avatarPlaceholder} />
                                                )}
                                                <Image
                                                    src={getCountryFlagUrl(player.countryCode)}
                                                    alt=""
                                                    width={36}
                                                    height={36}
                                                    className={modCss.flag}
                                                    aria-hidden
                                                />
                                            </div>
                                            <span className={modCss.name}>{player.name}</span>
                                        </div>
                                        <div className={modCss.cellKingdom}>
                                            {player.kingdom}
                                        </div>
                                        <div className={modCss.cellClub}>
                                            {player.club}
                                        </div>
                                        <div className={modCss.cellRating}>
                                            {player.rating}
                                        </div>
                                    </div>
                                ))
                            )}
                        </div>
                    </div>
                </div>
            </div>
        </div>
    );
};
