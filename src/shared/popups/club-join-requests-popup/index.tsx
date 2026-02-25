"use client";

import React, { useState, useCallback, useEffect } from "react";
import css from "../styles.module.scss";
import { Icon } from "@/shared/ui/icons";
import { usePopup } from "@/shared/contexts/popup-context";
import { useAuth } from "@/shared/hooks/use-auth";
import {
    getClubJoinRequestsForAdmin,
    updateClubJoinRequestStatus,
    invitePlayerToClub,
    incrementClubMembers,
    type ClubJoinRequestWithUser,
} from "@/shared/supabase/data";
import type { IClub } from "@/shared/types";
import cn from "classnames";

interface ClubJoinRequestsPopupData {
    club: IClub;
    onClosed?: () => void;
    onApproved?: () => void;
}

export const ClubJoinRequestsPopup: React.FC = () => {
    const { closePopup, getPopupData } = usePopup();
    const { user } = useAuth();
    const data = getPopupData("club-join-requests") as ClubJoinRequestsPopupData | undefined;
    const [requests, setRequests] = useState<ClubJoinRequestWithUser[]>([]);
    const [loading, setLoading] = useState(true);
    const [reviewingId, setReviewingId] = useState<number | null>(null);

    const loadRequests = useCallback(async () => {
        if (!data?.club?.id) return;
        setLoading(true);
        const list = await getClubJoinRequestsForAdmin(data.club.id, "pending");
        setRequests(list);
        setLoading(false);
    }, [data?.club?.id]);

    useEffect(() => {
        loadRequests();
    }, [loadRequests]);

    const handleApprove = async (requestId: number) => {
        if (!data?.club || !user?.id) return;
        const request = requests.find((r) => r.id === requestId);
        if (!request) return;
        setReviewingId(requestId);
        const ok = await updateClubJoinRequestStatus(requestId, "approved", user.id);
        if (ok) {
            await invitePlayerToClub(data.club.title, request.userId);
            await incrementClubMembers(data.club.id);
            data.onApproved?.();
        }
        await loadRequests();
        setReviewingId(null);
    };

    const handleReject = async (requestId: number) => {
        if (!data?.club || !user?.id) return;
        setReviewingId(requestId);
        await updateClubJoinRequestStatus(requestId, "rejected", user.id);
        await loadRequests();
        setReviewingId(null);
    };

    if (!data?.club) {
        return null;
    }

    const handleClose = () => {
        data.onClosed?.();
        closePopup("club-join-requests");
    };

    const formatDate = (iso: string) => {
        try {
            return new Date(iso).toLocaleDateString(undefined, {
                year: "numeric",
                month: "short",
                day: "numeric",
            });
        } catch {
            return iso;
        }
    };

    return (
        <div className={css.popup}>
            <div className={css.popup_close}>
                <Icon
                    name="x"
                    className={css.popup_close_icon}
                    onClick={handleClose}
                />
            </div>
            <div className={css.popup_content}>
                <h2>Join requests — {data.club.title}</h2>
                {loading ? (
                    <p>Loading…</p>
                ) : requests.length === 0 ? (
                    <p>No pending requests.</p>
                ) : (
                    <div className={css.popup_table_wrapper}>
                        <table className={css.popup_table}>
                            <thead>
                                <tr>
                                    <th className={css.popup_table_th}>Name</th>
                                    <th className={css.popup_table_th}>Country</th>
                                    <th className={css.popup_table_th}>Rating</th>
                                    <th className={css.popup_table_th}>Date</th>
                                    <th className={css.popup_table_th}>Actions</th>
                                </tr>
                            </thead>
                            <tbody>
                                {requests.map((req) => (
                                    <tr key={req.id} className={css.popup_table_row}>
                                        <td className={css.popup_table_td}>
                                            {req.playerName || req.userName || "—"}
                                        </td>
                                        <td className={css.popup_table_td}>
                                            {req.playerCountry || "—"}
                                        </td>
                                        <td className={css.popup_table_td}>
                                            {req.playerRating != null ? req.playerRating : "—"}
                                        </td>
                                        <td className={css.popup_table_td}>
                                            {formatDate(req.createdAt)}
                                        </td>
                                        <td className={css.popup_table_td}>
                                            <div className={css.popup_table_actions}>
                                                <button
                                                    type="button"
                                                    className={cn(css.popup_button, css.popup_button_primary)}
                                                    disabled={reviewingId !== null}
                                                    onClick={() => handleApprove(req.id)}
                                                >
                                                    Approve
                                                </button>
                                                <button
                                                    type="button"
                                                    className={cn(css.popup_button, css.popup_button_secondary)}
                                                    disabled={reviewingId !== null}
                                                    onClick={() => handleReject(req.id)}
                                                >
                                                    Reject
                                                </button>
                                            </div>
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
