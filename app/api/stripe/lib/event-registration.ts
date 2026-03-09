import { createClient } from "@supabase/supabase-js";

const supabase = createClient(
    process.env.NEXT_PUBLIC_SUPABASE_URL || "",
    process.env.SUPABASE_SERVICE_ROLE_KEY || ""
);

export async function applyEventRegistrationFromMetadata(metadata: {
    eventId?: string;
    userId?: string;
    heatIndex?: string;
}): Promise<void> {
    const userId = metadata.userId;
    const eventIdRaw = metadata.eventId;
    if (!userId || !eventIdRaw) return;
    const eventIdNum = parseInt(String(eventIdRaw), 10);
    if (Number.isNaN(eventIdNum)) {
        console.warn("Invalid eventId in event_registration metadata");
        return;
    }
    const heatIndexStr = metadata.heatIndex;
    const { data: eventData } = await supabase
        .from("events")
        .select("total_participants, capacity")
        .eq("id", eventIdNum)
        .single();
    const capacity = eventData?.total_participants ?? eventData?.capacity ?? null;
    let shouldInsert = true;
    if (capacity != null) {
        const { count, error: countError } = await supabase
            .from("event_registrations")
            .select("*", { count: "exact", head: true })
            .eq("event_id", eventIdNum);
        if (!countError && count != null && count >= capacity) {
            console.warn(`Event ${eventIdNum} is full, skipping registration for user ${userId}`);
            shouldInsert = false;
        }
    }
    if (!shouldInsert) return;
    const row: { event_id: number; user_id: string; heat_index?: number } = {
        event_id: eventIdNum,
        user_id: userId,
    };
    if (heatIndexStr !== "" && heatIndexStr != null) {
        const hi = parseInt(String(heatIndexStr), 10);
        if (!Number.isNaN(hi)) row.heat_index = hi;
    }
    const { error: insertError } = await supabase.from("event_registrations").insert(row);
    if (insertError) {
        if (insertError.code === "23505") {
            console.warn(`User ${userId} already registered for event ${eventIdNum}`);
        } else {
            console.error("Event registration insert error:", insertError);
            throw new Error(`Failed to register for event: ${insertError.message}`);
        }
    } else {
        console.log(`Event registration completed for user ${userId}, event ${eventIdNum}`);
    }
}
