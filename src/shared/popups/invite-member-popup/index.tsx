"use client";

import React, { useState, useCallback, useEffect } from "react";
import css from "../styles.module.scss";
import { Icon } from "@/shared/ui/icons";
import { usePopup } from "@/shared/contexts/popup-context";
import {
    getPlayersForInvite,
    createClubInvite,
} from "@/shared/supabase/data";
import type { IClub } from "@/shared/types";
import type { IPlayer } from "@/shared/types";
import cn from "classnames";

interface InviteMemberPopupData {
    club: IClub;
    onClosed?: () => void;
}

export const InviteMemberPopup: React.FC = () => {
    const { closePopup, getPopupData } = usePopup();
    const data = getPopupData("invite-member") as InviteMemberPopupData | undefined;
    const [players, setPlayers] = useState<IPlayer[]>([]);
    const [total, setTotal] = useState(0);
    const [loading, setLoading] = useState(true);
    const [search, setSearch] = useState("");
    const [invitingId, setInvitingId] = useState<string | null>(null);
    const [pendingIds, setPendingIds] = useState<Set<string>>(new Set());

    const loadPlayers = useCallback(async () => {
        if (!data?.club?.title) return;
        setLoading(true);
        const result = await getPlayersForInvite({
            clubTitle: data.club.title,
            search: search.trim() || undefined,
            page: 1,
            pageSize: 30,
        });
        const clubTitleNorm = data.club.title.trim().toLowerCase();
        const filtered = result.players.filter(
            (p) => (p.club ?? "").trim().toLowerCase() !== clubTitleNorm
        );
        setPlayers(filtered);
        setTotal(result.total);
        setLoading(false);
    }, [data?.club?.title, search]);

    useEffect(() => {
        const t = setTimeout(loadPlayers, 300);
        return () => clearTimeout(t);
    }, [loadPlayers]);

    const handleInvite = async (player: IPlayer) => {
        if (!data?.club?.id || !data?.club?.title || !player.id) return;
        setInvitingId(player.id);
        const ok = await createClubInvite(data.club.id, data.club.title, player.id);
        setInvitingId(null);
        if (ok) {
            setPendingIds((prev) => new Set(prev).add(player.id));
        }
    };

    if (!data?.club) {
        return null;
    }

    const handleClose = () => {
        data.onClosed?.();
        closePopup("invite-member");
    };

    return (
        <div className={css.popup}>
            <div className={css.invite_member_header}>
                <div className={css.popup_close}>
                    <Icon
                        name="x"
                        className={css.popup_close_icon}
                        onClick={handleClose}
                    />
                </div>
                <h2>Invite member — {data.club.title}</h2>
                <div className={css.invite_member_search_wrap}>
                    <input
                        type="text"
                        className={css.invite_member_search}
                        placeholder="Search by name…"
                        value={search}
                        onChange={(e) => setSearch(e.target.value)}
                    />
                </div>
            </div>
            <div className={css.popup_content}>
                {loading ? (
                    <p>Loading…</p>
                ) : players.length === 0 ? (
                    <p>{search.trim() ? "No players found." : "No players to invite (all are already in this club)."}</p>
                ) : (
                    <div className={css.popup_table_wrapper}>
                        <table className={css.popup_table}>
                            <thead>
                                <tr>
                                    <th className={css.popup_table_th}>Player</th>
                                    <th className={css.popup_table_th}>Club</th>
                                    <th className={css.popup_table_th}>Rating</th>
                                    <th className={css.popup_table_th}>Actions</th>
                                </tr>
                            </thead>
                            <tbody>
                                {players.map((player) => (
                                    <tr key={player.id} className={css.popup_table_row}>
                                        <td className={css.popup_table_td}>
                                            {player.name || "—"}
                                        </td>
                                        <td className={css.popup_table_td}>
                                            {player.club || "—"}
                                        </td>
                                        <td className={css.popup_table_td}>
                                            {player.rating != null ? player.rating : "—"}
                                        </td>
                                        <td className={css.popup_table_td}>
                                            <button
                                                type="button"
                                                className={cn(
                                                    css.popup_button,
                                                    !pendingIds.has(player.id) && css.popup_button_primary,
                                                    css.invite_member_btn,
                                                    pendingIds.has(player.id) && css.invite_member_btn_pending
                                                )}
                                                disabled={invitingId !== null || pendingIds.has(player.id)}
                                                onClick={() => handleInvite(player)}
                                            >
                                                {invitingId === player.id
                                                    ? "Inviting…"
                                                    : pendingIds.has(player.id)
                                                      ? "Invite sent"
                                                      : "Invite"}
                                            </button>
                                        </td>
                                    </tr>
                                ))}
                            </tbody>
                        </table>
                    </div>
                )}
            </div>
        </div>
    );
};
