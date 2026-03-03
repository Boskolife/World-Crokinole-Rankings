"use client";

import { useState, useEffect, useCallback } from "react";
import { supabase } from "@/shared/supabase/client";

export type EventRegistrationStatus = {
    isRegistered: boolean;
    heatIndex: number | null;
};

function fetchRegistration(
    eventId: number,
    userId: string,
    setStatus: (s: EventRegistrationStatus) => void
) {
    supabase
        .from("event_registrations")
        .select("heat_index")
        .eq("event_id", eventId)
        .eq("user_id", userId)
        .maybeSingle()
        .then(
            ({ data }) => {
                if (!data) {
                    setStatus({ isRegistered: false, heatIndex: null });
                    return;
                }
                setStatus({
                    isRegistered: true,
                    heatIndex: data.heat_index ?? null,
                });
            },
            () => setStatus({ isRegistered: false, heatIndex: null })
        );
}

export function useEventRegistrationStatus(
    eventId: number,
    userId: string | undefined
) {
    const [status, setStatus] = useState<EventRegistrationStatus | null>(null);

    const refetch = useCallback(() => {
        if (!userId) return;
        fetchRegistration(eventId, userId, setStatus);
    }, [eventId, userId]);

    useEffect(() => {
        if (!userId) {
            setStatus({ isRegistered: false, heatIndex: null });
            return;
        }
        let cancelled = false;
        supabase
            .from("event_registrations")
            .select("heat_index")
            .eq("event_id", eventId)
            .eq("user_id", userId)
            .maybeSingle()
            .then(
                ({ data }) => {
                    if (cancelled) return;
                    if (!data) {
                        setStatus({ isRegistered: false, heatIndex: null });
                        return;
                    }
                    setStatus({
                        isRegistered: true,
                        heatIndex: data.heat_index ?? null,
                    });
                },
                () => {
                    if (!cancelled) setStatus({ isRegistered: false, heatIndex: null });
                }
            );
        return () => {
            cancelled = true;
        };
    }, [eventId, userId]);

    useEffect(() => {
        const handler = (e: CustomEvent<{ eventId: number }>) => {
            if (e.detail?.eventId === eventId) refetch();
        };
        window.addEventListener("event-registration-updated", handler as EventListener);
        return () => window.removeEventListener("event-registration-updated", handler as EventListener);
    }, [eventId, refetch]);

    return { status, refetch };
}
