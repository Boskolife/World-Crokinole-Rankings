"use client";

import { useState, useEffect, useCallback } from "react";
import { useAuth } from "@/shared/hooks/use-auth";
import { getPlayerById } from "@/shared/supabase/data";
import type { IPlayer } from "@/shared/types/player.interface";

export const useCurrentUserPlayer = () => {
    const { user } = useAuth();
    const userId = user?.id ?? null;

    const [player, setPlayer] = useState<IPlayer | null>(null);
    const [isLoading, setIsLoading] = useState(false);

    const refetch = useCallback(async () => {
        if (!userId) {
            setPlayer(null);
            return;
        }
        setIsLoading(true);
        try {
            const p = await getPlayerById(userId);
            setPlayer(p);
        } catch {
            setPlayer(null);
        } finally {
            setIsLoading(false);
        }
    }, [userId]);

    useEffect(() => {
        if (!userId) {
            setPlayer(null);
            setIsLoading(false);
            return;
        }
        refetch();
    }, [refetch, userId]);

    useEffect(() => {
        if (!userId) return;
        const handler = (e: CustomEvent<{ userId: string }>) => {
            if (e.detail?.userId === userId) refetch();
        };
        window.addEventListener("profile-updated", handler as EventListener);
        return () => window.removeEventListener("profile-updated", handler as EventListener);
    }, [userId, refetch]);

    return { player, isLoading, refetch };
};
