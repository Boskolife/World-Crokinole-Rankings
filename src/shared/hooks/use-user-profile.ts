"use client";

import { useCallback, useEffect, useState } from "react";
import { useAuth } from "@/shared/hooks/use-auth";
import { isSupabaseConfigured, supabase } from "@/shared/supabase/client";
import { ensurePlayerForUser } from "@/shared/supabase/data";
import type { IProfile } from "@/shared/types";

type ProfileCacheEntry = {
    profile: IProfile | null;
    updatedAt: number;
};

const cache = new Map<string, ProfileCacheEntry>();

export function invalidateProfileCache(userId: string) {
    cache.delete(userId);
}

export function notifyProfileUpdated(userId: string) {
    if (typeof window !== "undefined") {
        window.dispatchEvent(new CustomEvent("profile-updated", { detail: { userId } }));
    }
}

function getFallbackName(email?: string | null) {
    if (!email) return "User";
    const [name] = email.split("@");
    return name || "User";
}

export const useUserProfile = () => {
    const { user, isAuth } = useAuth();
    const userId = user?.id ?? null;

    const [profile, setProfile] = useState<IProfile | null>(null);
    const [isLoading, setIsLoading] = useState(false);
    const [error, setError] = useState<string | null>(null);

    useEffect(() => {
        if (!isAuth || !userId) {
            setProfile(null);
            setIsLoading(false);
            setError(null);
            cache.delete(userId || "");
        }
    }, [isAuth, userId]);

    const refetch = useCallback(async () => {
        if (!isSupabaseConfigured || !userId) {
            setProfile(null);
            setIsLoading(false);
            setError(null);
            return;
        }

        setIsLoading(true);
        setError(null);

        try {
            const { data, error: dbError } = await supabase
                .from("profiles")
                .select("id, full_name, country, club, avatar_url, subscription_plan, is_admin")
                .eq("id", userId)
                .maybeSingle();

            if (dbError) {
                setError(dbError.message);
                setProfile(null);
                return;
            }

            let nextProfile = (data ?? null) as IProfile | null;
            if (!nextProfile && userId) {
                await supabase.rpc("ensure_profile", { p_id: userId });
                await ensurePlayerForUser(userId);
                const { data: inserted } = await supabase
                    .from("profiles")
                    .select("id, full_name, country, club, avatar_url, subscription_plan, is_admin")
                    .eq("id", userId)
                    .maybeSingle();
                nextProfile = inserted as IProfile | null;
            }
            setProfile(nextProfile);
            cache.set(userId, { profile: nextProfile, updatedAt: Date.now() });
        } catch {
            setError(
                "Could not reach Supabase. Please check NEXT_PUBLIC_SUPABASE_URL and your DNS/Internet connection."
            );
            setProfile(null);
        } finally {
            setIsLoading(false);
        }
    }, [userId]);

    useEffect(() => {
        if (!isSupabaseConfigured || !userId) {
            setProfile(null);
            setIsLoading(false);
            setError(null);
            if (userId) {
                cache.delete(userId);
            }
            return;
        }

        const cached = cache.get(userId);
        const cacheAge = cached ? Date.now() - cached.updatedAt : Infinity;
        const CACHE_MAX_AGE = 5 * 60 * 1000;

        if (cached && cacheAge < CACHE_MAX_AGE) {
            setProfile(cached.profile);
        } else {
            setProfile(null);
        }

        refetch();
    }, [userId, refetch]);

    useEffect(() => {
        if (!userId) return;
        const handler = (e: CustomEvent<{ userId: string }>) => {
            if (e.detail?.userId === userId) refetch();
        };
        window.addEventListener("profile-updated", handler as EventListener);
        return () => window.removeEventListener("profile-updated", handler as EventListener);
    }, [userId, refetch]);

    const fullName =
        profile?.full_name?.trim() ||
        user?.user_metadata?.full_name ||
        getFallbackName(user?.email);

    return {
        profile,
        fullName,
        email: user?.email ?? null,
        isLoading,
        error,
        refetch,
    };
};



