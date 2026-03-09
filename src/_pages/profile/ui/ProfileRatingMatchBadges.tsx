"use client";

import React, { useState, useEffect } from "react";
import { RatingList } from "@/widgets/rating-list";
import { MatchHistory } from "@/widgets/match-history";
import { Badges } from "@/widgets/badges";
import { useCurrentUserPlayer } from "@/shared/hooks";
import {
    getRatingHistoryFromSinglesAndDoubles,
    getMatchHistoryFromSinglesAndDoubles,
} from "@/shared/supabase/data";
import type { IRatingHistoryFromSinglesDoubles } from "@/shared/supabase/data";
import type { IMatchHistory } from "@/shared/types/match-history.interface";

export function ProfileRatingMatchBadges() {
    const { player, isLoading: playerLoading } = useCurrentUserPlayer();
    const [ratingData, setRatingData] = useState<IRatingHistoryFromSinglesDoubles | null>(null);
    const [matchHistory, setMatchHistory] = useState<IMatchHistory[]>([]);
    const [dataLoading, setDataLoading] = useState(false);

    useEffect(() => {
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
                setRatingData(null);
                setMatchHistory([]);
            })
            .finally(() => setDataLoading(false));
    }, [player?.id]);

    if (playerLoading) {
        return (
            <div className="container" style={{ padding: "24px 0", textAlign: "center" }}>
                Loading...
            </div>
        );
    }

    return (
        <>
            <RatingList ratingData={ratingData ?? undefined} />
            <MatchHistory matches={matchHistory} />
            <Badges player={player ?? undefined} />
        </>
    );
}
