"use client";

import { useState, useCallback } from "react";
import { supabase } from "@/shared/supabase/client";

export type EventRegistrationState =
    | { status: "idle" }
    | { status: "loading" }
    | { status: "success" }
    | { status: "error"; message: string };

export function useEventRegistration() {
    const [state, setState] = useState<EventRegistrationState>({ status: "idle" });

    const registerForEvent = useCallback(
        async (
            eventId: number,
            userId: string,
            heatIndex?: number,
            capacity?: number | null
        ) => {
            setState({ status: "loading" });
            try {
                if (capacity != null) {
                    const { count, error: countError } = await supabase
                        .from("event_registrations")
                        .select("*", { count: "exact", head: true })
                        .eq("event_id", eventId);
                    if (!countError && count != null && count >= capacity) {
                        setState({ status: "error", message: "Event is full." });
                        return false;
                    }
                }
                const row: { event_id: number; user_id: string; heat_index?: number } = {
                    event_id: eventId,
                    user_id: userId,
                };
                if (heatIndex != null) {
                    row.heat_index = heatIndex;
                }
                const { error } = await supabase.from("event_registrations").insert(row);

                if (error) {
                    if (error.code === "23505") {
                        setState({ status: "error", message: "You are already registered for this event." });
                    } else {
                        setState({ status: "error", message: error.message });
                    }
                    return false;
                }
                setState({ status: "success" });
                return true;
            } catch (err) {
                setState({
                    status: "error",
                    message: err instanceof Error ? err.message : "Registration failed",
                });
                return false;
            }
        },
        []
    );

    const resetState = useCallback(() => {
        setState({ status: "idle" });
    }, []);

    return { registerForEvent, state, resetState };
}

export function useRemoveEventRegistration() {
    const [state, setState] = useState<EventRegistrationState>({ status: "idle" });

    const removeFromEvent = useCallback(
        async (eventId: number, userId: string) => {
            setState({ status: "loading" });
            try {
                const { error } = await supabase
                    .from("event_registrations")
                    .delete()
                    .eq("event_id", eventId)
                    .eq("user_id", userId);
                if (error) {
                    setState({ status: "error", message: error.message });
                    return false;
                }
                setState({ status: "success" });
                return true;
            } catch (err) {
                setState({
                    status: "error",
                    message: err instanceof Error ? err.message : "Failed to remove",
                });
                return false;
            }
        },
        []
    );

    const resetState = useCallback(() => {
        setState({ status: "idle" });
    }, []);

    return { removeFromEvent, state, resetState };
}
