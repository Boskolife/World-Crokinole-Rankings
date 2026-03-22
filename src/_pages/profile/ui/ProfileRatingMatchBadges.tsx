"use client";

import React, { useState, useEffect, useCallback } from "react";
import { RatingList } from "@/widgets/rating-list";
import { MatchHistory } from "@/widgets/match-history";
import { Badges } from "@/widgets/badges";
import { useCurrentUserPlayer, useAuth } from "@/shared/hooks";
import {
    getRatingHistoryFromSinglesAndDoubles,
    getMatchHistoryFromSinglesAndDoubles,
    createEmptyRatingHistory,
} from "@/shared/supabase/data";
import type { IRatingHistoryFromSinglesDoubles } from "@/shared/supabase/data";
import type { IMatchHistory } from "@/shared/types/match-history.interface";

export function ProfileRatingMatchBadges() {
    const { user } = useAuth();
    const authUserId = user?.id ?? null;
    const { player, isLoading: playerLoading } = useCurrentUserPlayer();
    const [ratingData, setRatingData] = useState<IRatingHistoryFromSinglesDoubles | null>(null);
    const [matchHistory, setMatchHistory] = useState<IMatchHistory[]>([]);
    const [dataLoading, setDataLoading] = useState(false);

    const loadRatingAndMatches = useCallback(() => {
        if (!player?.id) {
            setRatingData(null);
            setMatchHistory([]);
            return;
        }
        setDataLoading(true);
        Promise.all([
            getRatingHistoryFromSinglesAndDoubles(player.id),
            getMatchHistoryFromSinglesAndDoubles(player.id),
        ])
            .then(([rating, matches]) => {
                setRatingData(rating);
                setMatchHistory(matches);
            })
            .catch(() => {
                setRatingData(createEmptyRatingHistory());
                setMatchHistory([]);
            })
            .finally(() => setDataLoading(false));
    }, [player?.id]);

    useEffect(() => {
        loadRatingAndMatches();
    }, [loadRatingAndMatches]);

    useEffect(() => {
        if (!authUserId) return;
        const handler = (e: Event) => {
            const ce = e as CustomEvent<{ userId?: string }>;
            if (ce.detail?.userId === authUserId) loadRatingAndMatches();
        };
        window.addEventListener("profile-updated", handler as EventListener);
        return () => window.removeEventListener("profile-updated", handler as EventListener);
    }, [authUserId, loadRatingAndMatches]);

    if (playerLoading) {
        return (
            <div className="container" style={{ padding: "24px 0", textAlign: "center" }}>
                Loading...
            </div>
        );
    }

    return (
        <>
            <RatingList isLoading={dataLoading} ratingData={ratingData} />
            <MatchHistory matches={matchHistory} />
            <Badges player={player ?? undefined} />
        </>
    );
}
