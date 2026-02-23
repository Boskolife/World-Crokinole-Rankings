"use client";

import { useState, useCallback, useEffect } from "react";
import { useAuth } from "@/shared/hooks/use-auth";
import {
    getClubJoinRequest,
    createClubJoinRequest,
    type ClubJoinRequestStatus,
} from "@/shared/supabase/data";

export type ClubJoinState = "none" | ClubJoinRequestStatus;

export function useClubJoinRequest(clubId: number) {
    const { user, isAuth } = useAuth();
    const [status, setStatus] = useState<ClubJoinState>("none");
    const [isLoading, setIsLoading] = useState(true);
    const [isSubmitting, setIsSubmitting] = useState(false);

    const refetch = useCallback(async () => {
        if (!user?.id || !clubId) {
            setStatus("none");
            setIsLoading(false);
            return;
        }
        setIsLoading(true);
        const request = await getClubJoinRequest(user.id, clubId);
        setStatus(request?.status ?? "none");
        setIsLoading(false);
    }, [user?.id, clubId]);

    useEffect(() => {
        refetch();
    }, [refetch]);

    const createRequest = useCallback(async (): Promise<boolean> => {
        if (!user?.id || !clubId || status !== "none") return false;
        setIsSubmitting(true);
        const created = await createClubJoinRequest(user.id, clubId);
        setIsSubmitting(false);
        if (created) {
            setStatus("pending");
            return true;
        }
        return false;
    }, [user?.id, clubId, status]);

    return {
        status,
        isLoading,
        isSubmitting,
        createRequest,
        refetch,
        canJoin: isAuth && status === "none",
    };
}
