"use client";

import { useCallback, useEffect, useState } from "react";
import { useAuth } from "@/shared/hooks/use-auth";
import { isSupabaseConfigured, supabase } from "@/shared/supabase/client";
import type { IProfile } from "@/shared/types";

type ProfileCacheEntry = {
    profile: IProfile | null;
    updatedAt: number;
};

const cache = new Map<string, ProfileCacheEntry>();

function getFallbackName(email?: string | null) {
    if (!email) return "User";
    const [name] = email.split("@");
    return name || "User";
}

export const useUserProfile = () => {
    const { user } = useAuth();
    const userId = user?.id ?? null;

    const [profile, setProfile] = useState<IProfile | null>(null);
    const [isLoading, setIsLoading] = useState(false);
    const [error, setError] = useState<string | null>(null);

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
                .select("id, full_name, country, club, subscription_plan")
                .eq("id", userId)
                .maybeSingle();

            if (dbError) {
                setError(dbError.message);
                setProfile(null);
                return;
            }

            const nextProfile = (data ?? null) as IProfile | null;
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
            return;
        }

        const cached = cache.get(userId);
        if (cached) {
            setProfile(cached.profile);
        }

        refetch();
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



