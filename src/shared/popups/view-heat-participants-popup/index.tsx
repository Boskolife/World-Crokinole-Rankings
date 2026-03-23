"use client";

import React from "react";
import Image from "next/image";
import { useRouter } from "next/navigation";
import cn from "classnames";
import { Icon } from "@/shared/ui/icons";
import { usePopup } from "@/shared/contexts/popup-context";
import { useAuth } from "@/shared/hooks/use-auth";
import type { IPlayer } from "@/shared/types";
import { getCountryFlagUrl } from "@/shared/lib/country-flag";
import css from "../styles.module.scss";
import modCss from "./ViewHeatParticipantsPopup.module.scss";

type ViewHeatParticipantsPopupData = {
    heatLabel?: string;
    heatDateTime?: string;
    players?: IPlayer[];
    eventId?: number;
    createdBy?: string | null;
    isTournament?: boolean;
};

export const ViewHeatParticipantsPopup: React.FC = () => {
    const router = useRouter();
    const { openPopup, closePopup, getPopupData } = usePopup();
    const { user } = useAuth();
    const data = getPopupData("view-heat-participants") as ViewHeatParticipantsPopupData | undefined;
    const heatLabel = data?.heatLabel ?? "Qualifying Heat";
    const heatDateTime = data?.heatDateTime ?? "";
    const players = data?.players ?? [];
    const eventId = data?.eventId;
    const createdBy = data?.createdBy;
    const isTournament = Boolean(data?.isTournament);
    const showRemove = Boolean(eventId && user?.id && createdBy === user?.id);
    const removeFromLabel = isTournament ? "Remove from tournament" : "Remove from event";

    const handleRemoveClick = (player: IPlayer) => {
        if (eventId == null) return;
        closePopup("view-heat-participants");
        openPopup("remove-event-participant-confirm", {
            eventId,
            userId: player.id,
            playerName: player.name,
            isTournament,
            onSuccess: () => {
                window.dispatchEvent(
                    new CustomEvent("event-registration-updated", { detail: { eventId } })
                );
                router.refresh();
            },
        });
    };

    return (
        <div className={cn(css.popup, modCss.popupWithTable)}>
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
                            {showRemove && <div className={modCss.thRemove} />}
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
                                                    src={getCountryFlagUrl(player.countryCode, 160)}
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
                                        {showRemove && eventId != null && (
                                            <div className={modCss.cellRemove}>
                                                <button
                                                    type="button"
                                                    className={modCss.removeBtn}
                                                    title={removeFromLabel}
                                                    onClick={() => handleRemoveClick(player)}
                                                >
                                                    <Icon
                                                        name="trash"
                                                        className={modCss.removeIcon}
                                                        aria-hidden
                                                    />
                                                </button>
                                            </div>
                                        )}
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
