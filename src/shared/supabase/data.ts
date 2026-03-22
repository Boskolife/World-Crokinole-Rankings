import type { SupabaseClient } from "@supabase/supabase-js";
import { supabase } from "./client";
import type {
    IEventCardProps,
    QualifyingHeatsData,
    IPlayer,
    IClub,
    ITournament,
    IRankList,
    IMatchHistory,
    INewsItem,
    TournamentBracketResultsMap,
} from "@/shared/types";

function formatEventDate(startDate: string, endDate: string, timezone?: string | null): string {
    const start = new Date(startDate);
    const end = new Date(endDate);
    const tzOpt = timezone ? { timeZone: timezone } : {};
    const startMonth = start.toLocaleDateString("en-US", { month: "short", ...tzOpt });
    const startDay = parseInt(start.toLocaleDateString("en-US", { day: "numeric", ...tzOpt }), 10);
    const startTime = start.toLocaleTimeString("en-US", {
        hour: "numeric",
        minute: "2-digit",
        hour12: true,
        ...tzOpt,
    });
    const endMonth = end.toLocaleDateString("en-US", { month: "short", ...tzOpt });
    const endDay = parseInt(end.toLocaleDateString("en-US", { day: "numeric", ...tzOpt }), 10);
    const endTime = end.toLocaleTimeString("en-US", {
        hour: "numeric",
        minute: "2-digit",
        hour12: true,
        ...tzOpt,
    });
    const dayPart = (month: string, day: number) => `${month} ${day}`;
    let result: string;
    if (startMonth === endMonth && startDay === endDay) {
        result = `${dayPart(startMonth, startDay)}, ${startTime} - ${endTime}`;
    } else {
        result = `${dayPart(startMonth, startDay)}, ${startTime} - ${dayPart(endMonth, endDay)}, ${endTime}`;
    }
    if (timezone) result += " (local time)";
    return result;
}

export async function getEvents(): Promise<IEventCardProps[]> {
    const { data, error } = await supabase
        .from("events")
        .select("*")
        .order("start_date", { ascending: true });

    if (error) {
        console.error("Error fetching events:", error);
        return [];
    }

    if (!data?.length) return [];
    const countMap = await getEventRegistrationCounts(data.map((e) => e.id));
    return data.map((e) => {
        const row = e as Record<string, unknown>;
        const totalParticipantsVal = row.total_participants ?? row.capacity ?? null;
        return mapEventRowToCard({
            ...e,
            current_rank: countMap.get(e.id) ?? 0,
            total_participants: totalParticipantsVal as number | null,
            capacity: (row.capacity ?? row.total_participants ?? null) as number | null,
        });
    });
}

const mapEventRowToCard = (event: {
    id: number;
    created_by?: string | null;
    image: string | null;
    title: string;
    price: string;
    start_date: string | null;
    end_date: string | null;
    location: string;
    format: string;
    is_ranked: boolean;
    is_registration_required: boolean;
    winner: string | null;
    current_rank: number | null;
    total_participants: number | null;
    tournament_visibility?: string | null;
    capacity?: number | null;
    strength_of_field?: number | null;
    tournament_points_available?: number | null;
    structure?: string | null;
    latitude?: number | null;
    longitude?: number | null;
    timezone?: string | null;
    qualifying_heats?: QualifyingHeatsData | null;
}): IEventCardProps => {
    const row = event as Record<string, unknown>;
    const totalParticipants = (row.total_participants ?? row.capacity ?? row.totalParticipants ?? undefined) as number | undefined;
    const currentRank = totalParticipants != null ? (event.current_rank ?? 0) : (event.current_rank ?? undefined);
    return {
    id: event.id,
    createdBy: event.created_by ?? undefined,
    image: event.image || "",
    title: event.title,
    price: event.price,
    date: event.start_date && event.end_date
        ? formatEventDate(event.start_date, event.end_date, event.timezone ?? undefined)
        : "",
    location: event.location,
    format: event.format,
    tournamentVisibility: event.tournament_visibility ?? undefined,
    isRanked: event.is_ranked,
    isRegistrationRequired: event.is_registration_required,
    winner: event.winner || undefined,
    currentRank,
    totalParticipants,
    startDate: event.start_date || undefined,
    endDate: event.end_date || undefined,
    timezone: event.timezone ?? undefined,
    strengthOfField: event.strength_of_field ?? undefined,
    tournamentPointsAvailable: event.tournament_points_available ?? undefined,
    structure: event.structure ?? undefined,
    latitude: event.latitude ?? undefined,
    longitude: event.longitude ?? undefined,
    qualifyingHeats: event.qualifying_heats ?? undefined,
    tournamentBracketResults: (() => {
        const raw = (row as Record<string, unknown>).tournament_bracket_results;
        if (raw == null) return null;
        if (typeof raw === "string") {
            try {
                return JSON.parse(raw) as TournamentBracketResultsMap;
            } catch {
                return null;
            }
        }
        return raw as TournamentBracketResultsMap;
    })(),
};
};

export async function getEventRegistrationCount(eventId: number): Promise<number> {
    const { count, error } = await supabase
        .from("event_registrations")
        .select("*", { count: "exact", head: true })
        .eq("event_id", eventId);

    if (error) return 0;
    return count ?? 0;
}

export async function getEventRegistrationCounts(
    eventIds: number[]
): Promise<Map<number, number>> {
    const map = new Map<number, number>();
    if (eventIds.length === 0) return map;

    const { data, error } = await supabase
        .from("event_registrations")
        .select("event_id")
        .in("event_id", eventIds);

    if (error) return map;

    for (const row of data ?? []) {
        const id = (row as { event_id: number }).event_id;
        map.set(id, (map.get(id) ?? 0) + 1);
    }
    return map;
}

export async function getEventById(id: number): Promise<IEventCardProps | null> {
    const { data, error } = await supabase
        .from("events")
        .select("*")
        .eq("id", id)
        .single();

    if (error || !data) return null;

    const registeredCount = await getEventRegistrationCount(id);
    const totalParticipants = data.total_participants ?? data.capacity ?? undefined;
    const currentRank =
        totalParticipants != null ? registeredCount : (data.current_rank ?? undefined);

    return mapEventRowToCard({
        ...data,
        current_rank: currentRank ?? null,
    });
}

export async function getTournamentBracketResultsFromSingles(
    eventId: number
): Promise<TournamentBracketResultsMap> {
    const base =
        typeof window !== "undefined"
            ? ""
            : (process.env.NEXT_PUBLIC_APP_URL?.replace(/\/$/, "") ||
                  (process.env.VERCEL_URL ? `https://${process.env.VERCEL_URL}` : "") ||
                  "http://127.0.0.1:3000");
    try {
        const res = await fetch(
            `${base}/api/tournament-bracket-singles?eventId=${encodeURIComponent(String(eventId))}`,
            { cache: "no-store" }
        );
        if (!res.ok) return {};
        const json = (await res.json()) as unknown;
        if (json && typeof json === "object" && !Array.isArray(json)) {
            return json as TournamentBracketResultsMap;
        }
        return {};
    } catch {
        return {};
    }
}

export async function getFutureEvents(): Promise<IEventCardProps[]> {
    const now = new Date().toISOString();
    const { data, error } = await supabase
        .from("events")
        .select("*")
        .gte("start_date", now)
        .order("start_date", { ascending: true });

    if (error) {
        console.error("Error fetching future events:", error);
        return [];
    }

    if (!data?.length) return [];
    const countMap = await getEventRegistrationCounts(data.map((e) => e.id));
    return data.map((e) => {
        const row = e as Record<string, unknown>;
        const totalParticipantsVal = row.total_participants ?? row.capacity ?? null;
        return mapEventRowToCard({
            ...e,
            current_rank: countMap.get(e.id) ?? 0,
            total_participants: totalParticipantsVal as number | null,
            capacity: (row.capacity ?? row.total_participants ?? null) as number | null,
        });
    });
}

export async function getEventsCreatedByUser(userId: string): Promise<IEventCardProps[]> {
    if (!userId?.trim()) return [];
    const { data, error } = await supabase
        .from("events")
        .select("*")
        .eq("created_by", userId.trim())
        .order("start_date", { ascending: false });

    if (error) {
        console.error("Error fetching events by user:", error);
        return [];
    }
    if (!data?.length) return [];
    const countMap = await getEventRegistrationCounts(data.map((e) => e.id));
    return data.map((e) => {
        const row = e as Record<string, unknown>;
        const totalParticipantsVal = row.total_participants ?? row.capacity ?? null;
        return mapEventRowToCard({
            ...e,
            current_rank: countMap.get(e.id) ?? 0,
            total_participants: totalParticipantsVal as number | null,
            capacity: (row.capacity ?? row.total_participants ?? null) as number | null,
        });
    });
}

const UPCOMING_AT_LOCATION_LIMIT = 6;

export async function getUpcomingEventsAtLocation(
    location: string,
    excludeEventId: number,
    limit: number = UPCOMING_AT_LOCATION_LIMIT
): Promise<IEventCardProps[]> {
    if (!location?.trim()) return [];
    const now = new Date().toISOString();
    const { data, error } = await supabase
        .from("events")
        .select("*")
        .gte("start_date", now)
        .neq("id", excludeEventId)
        .ilike("location", location.trim())
        .order("start_date", { ascending: true })
        .limit(limit);

    if (error) {
        console.error("Error fetching upcoming events at location:", error);
        return [];
    }

    if (!data?.length) return [];
    const countMap = await getEventRegistrationCounts(data.map((e) => e.id));
    return data.map((e) => {
        const row = e as Record<string, unknown>;
        const totalParticipantsVal = row.total_participants ?? row.capacity ?? null;
        return mapEventRowToCard({
            ...e,
            current_rank: countMap.get(e.id) ?? 0,
            total_participants: totalParticipantsVal as number | null,
            capacity: (row.capacity ?? row.total_participants ?? null) as number | null,
        });
    });
}

export async function getPastEvents(): Promise<IEventCardProps[]> {
    const now = new Date().toISOString();
    const { data, error } = await supabase
        .from("events")
        .select("*")
        .lt("end_date", now)
        .order("start_date", { ascending: false });

    if (error) {
        console.error("Error fetching past events:", error);
        return [];
    }

    if (!data?.length) return [];
    const countMap = await getEventRegistrationCounts(data.map((e) => e.id));
    return data.map((e) => {
        const row = e as Record<string, unknown>;
        const totalParticipantsVal = row.total_participants ?? row.capacity ?? null;
        return mapEventRowToCard({
            ...e,
            current_rank: countMap.get(e.id) ?? 0,
            total_participants: totalParticipantsVal as number | null,
            capacity: (row.capacity ?? row.total_participants ?? null) as number | null,
        });
    });
}

const EVENT_COVERS_BUCKET = "event-covers";

export interface CreateEventParams {
    title: string;
    startDate: string;
    endDate: string;
    location: string;
    format: string;
    isRanked: boolean;
    isRegistrationRequired: boolean;
    price: string;
    structure: string;
    coverFile: File | null;
    capacity: number | null;
    latitude?: number | null;
    longitude?: number | null;
    timezone?: string | null;
    qualifyingHeats?: QualifyingHeatsData | null;
    createdByUserId?: string | null;
    tournamentPointsAvailable?: number | null;
    tournamentVisibility?: string | null;
}

export async function createEvent(params: CreateEventParams): Promise<IEventCardProps> {
    const {
        title,
        startDate,
        endDate,
        location,
        format,
        isRanked,
        isRegistrationRequired,
        price,
        structure,
        coverFile,
        capacity,
        latitude,
        longitude,
        timezone,
        qualifyingHeats,
        createdByUserId,
        tournamentPointsAvailable,
        tournamentVisibility,
    } = params;

    const { data: newEvent, error: insertError } = await supabase
        .from("events")
        .insert({
            title: title.trim(),
            price: (price || "0").trim(),
            location: (location || "").trim(),
            format: format.trim(),
            is_ranked: !!isRanked,
            is_registration_required: !!isRegistrationRequired,
            start_date: startDate,
            end_date: endDate,
            structure: (structure || "").trim() || null,
            capacity: capacity ?? null,
            latitude: latitude ?? null,
            longitude: longitude ?? null,
            timezone: timezone ?? null,
            qualifying_heats: qualifyingHeats ?? null,
            image: null,
            winner: null,
            current_rank: 0,
            total_participants: capacity ?? null,
            strength_of_field: null,
            tournament_points_available: tournamentPointsAvailable ?? null,
            created_by: createdByUserId ?? null,
            tournament_visibility: tournamentVisibility ?? null,
        })
        .select("id")
        .single();

    if (insertError || !newEvent?.id) {
        throw new Error(insertError?.message ?? "Failed to create event");
    }

    const eventId = newEvent.id;
    let imageUrl: string | null = null;

    if (coverFile) {
        const ext = getFileExtension(coverFile.name);
        const path = `${eventId}/cover.${ext}`;
        const { error: uploadError } = await supabase.storage
            .from(EVENT_COVERS_BUCKET)
            .upload(path, coverFile, { upsert: true });

        if (!uploadError) {
            const { data: urlData } = supabase.storage
                .from(EVENT_COVERS_BUCKET)
                .getPublicUrl(path);
            imageUrl = urlData.publicUrl;
        }
    }

    if (imageUrl) {
        await supabase
            .from("events")
            .update({ image: imageUrl })
            .eq("id", eventId);
    }

    const event = await getEventById(eventId);
    if (!event) throw new Error("Event not found after creation");
    return event;
}

export async function getActiveEventsCountByUser(userId: string): Promise<number> {
    const now = new Date().toISOString();
    const { count, error } = await supabase
        .from("events")
        .select("id", { count: "exact", head: true })
        .eq("created_by", userId)
        .gt("end_date", now);
    if (error) return 0;
    return count ?? 0;
}

export interface UpdateEventParams {
    title?: string;
    startDate?: string;
    endDate?: string;
    location?: string;
    format?: string;
    isRanked?: boolean;
    isRegistrationRequired?: boolean;
    price?: string;
    structure?: string;
    coverFile?: File | null;
    capacity?: number | null;
    latitude?: number | null;
    longitude?: number | null;
    timezone?: string | null;
    qualifyingHeats?: QualifyingHeatsData | null;
    strengthOfField?: number | null;
    tournamentPointsAvailable?: number | null;
    winner?: string | null;
    tournamentVisibility?: string | null;
}

export async function updateEvent(
    eventId: number,
    params: UpdateEventParams
): Promise<IEventCardProps> {
    const {
        title,
        startDate,
        endDate,
        location,
        format,
        isRanked,
        isRegistrationRequired,
        price,
        structure,
        coverFile,
        capacity,
        latitude,
        longitude,
        timezone,
        qualifyingHeats,
        strengthOfField,
        tournamentPointsAvailable,
        winner,
        tournamentVisibility,
    } = params;

    const updatePayload: Record<string, unknown> = {};
    if (title !== undefined) updatePayload.title = title.trim();
    if (price !== undefined) updatePayload.price = (price || "0").trim();
    if (location !== undefined) updatePayload.location = (location || "").trim();
    if (format !== undefined) updatePayload.format = format.trim();
    if (isRanked !== undefined) updatePayload.is_ranked = !!isRanked;
    if (isRegistrationRequired !== undefined)
        updatePayload.is_registration_required = !!isRegistrationRequired;
    if (startDate !== undefined) updatePayload.start_date = startDate;
    if (endDate !== undefined) updatePayload.end_date = endDate;
    if (structure !== undefined)
        updatePayload.structure = (structure || "").trim() || null;
    if (capacity !== undefined) updatePayload.capacity = capacity ?? null;
    if (capacity !== undefined)
        updatePayload.total_participants = capacity ?? null;
    if (latitude !== undefined) updatePayload.latitude = latitude ?? null;
    if (longitude !== undefined) updatePayload.longitude = longitude ?? null;
    if (timezone !== undefined) updatePayload.timezone = timezone ?? null;
    if (qualifyingHeats !== undefined)
        updatePayload.qualifying_heats = qualifyingHeats ?? null;
    if (strengthOfField !== undefined)
        updatePayload.strength_of_field = strengthOfField ?? null;
    if (tournamentPointsAvailable !== undefined)
        updatePayload.tournament_points_available = tournamentPointsAvailable ?? null;
    if (winner !== undefined) updatePayload.winner = winner ?? null;
    if (tournamentVisibility !== undefined)
        updatePayload.tournament_visibility = tournamentVisibility ?? null;

    if (Object.keys(updatePayload).length > 0) {
        const { error: updateError } = await supabase
            .from("events")
            .update(updatePayload)
            .eq("id", eventId);
        if (updateError) throw new Error(updateError.message);
    }

    if (coverFile) {
        const ext = getFileExtension(coverFile.name);
        const path = `${eventId}/cover.${ext}`;
        const { error: uploadError } = await supabase.storage
            .from(EVENT_COVERS_BUCKET)
            .upload(path, coverFile, { upsert: true });
        if (!uploadError) {
            const { data: urlData } = supabase.storage
                .from(EVENT_COVERS_BUCKET)
                .getPublicUrl(path);
            await supabase
                .from("events")
                .update({ image: urlData.publicUrl })
                .eq("id", eventId);
        }
    }

    const event = await getEventById(eventId);
    if (!event) throw new Error("Event not found after update");
    return event;
}

export interface EventHeatMatchRow {
    player1Id: string;
    player2Id: string;
    score1: number;
    score2: number;
}

export interface EventHeatResultsData {
    roundsByHeat: Record<number, number[]>;
    matchesByHeatRound: Record<string, EventHeatMatchRow[]>;
}

export async function getEventHeatResults(
    eventId: number
): Promise<EventHeatResultsData | null> {
    const { data, error } = await supabase
        .from("events")
        .select("heat_results")
        .eq("id", eventId)
        .single();
    if (error || data?.heat_results == null) return null;
    const raw = data.heat_results as unknown;
    if (typeof raw !== "object" || raw === null) return null;
    const o = raw as Record<string, unknown>;
    if (!o.roundsByHeat || !o.matchesByHeatRound) return null;
    return {
        roundsByHeat: o.roundsByHeat as Record<number, number[]>,
        matchesByHeatRound: o.matchesByHeatRound as Record<
            string,
            EventHeatMatchRow[]
        >,
    };
}

export async function saveEventHeatResults(
    eventId: number,
    payload: EventHeatResultsData
): Promise<void> {
    const { error } = await supabase
        .from("events")
        .update({ heat_results: payload })
        .eq("id", eventId);
    if (error) throw new Error(error.message);
}

export async function getPlayers(): Promise<IPlayer[]> {
    const { data, error } = await supabase
        .from("players")
        .select("*")
        .order("rating", { ascending: false });

    if (error) {
        console.error("Error fetching players:", error);
        return [];
    }

    return (
        data?.map((player) => ({
            id: player.user_id || player.id,
            name: player.name,
            countryCode: player.country_code,
            kingdom: player.kingdom,
            club: player.club,
            rating: player.rating,
        })) || []
    );
}

type PlayerRow = {
    user_id?: string | null;
    id?: number | string;
    name?: string | null;
    country_code?: string | null;
    kingdom?: string | null;
    club?: string | null;
    rating?: number | null;
    profiles?: { avatar_url?: string | null } | null;
    singles_rating?: number | null;
    doubles_rating?: number | null;
    combined_rating?: number | null;
    laurels_24mo?: number | null;
    laurels24mo?: number | null;
    laurels_24_mo?: number | null;
    singles_won?: number | null;
    singles_played?: number | null;
    win_pct_singles?: string | null;
    doubles_won?: number | null;
    doubles_played?: number | null;
    win_pct_doubles?: string | null;
    total_won?: number | null;
    total_played?: number | null;
    win_pct_total?: string | null;
    title?: string | null;
    club_title?: string | null;
    full_name_with_titles?: string | null;
    gender?: string | null;
    player_identifier?: string | null;
    is_auto_created?: boolean | null;
};

const UUID_REGEX = /^[0-9a-f]{8}-[0-9a-f]{4}-[0-9a-f]{4}-[0-9a-f]{4}-[0-9a-f]{12}$/i;

function mapPlayerRowToIPlayer(data: PlayerRow): IPlayer {
    const profile = (data as { profiles?: { avatar_url?: string | null } | null }).profiles;
    const avatarUrl = profile?.avatar_url ?? null;
    const rowId = data.id != null ? String(data.id) : undefined;
    return {
        id: String(data.user_id ?? data.id),
        rowId,
        name: data.name ?? "",
        countryCode: data.country_code ?? "",
        kingdom: data.kingdom ?? "",
        club: data.club ?? "",
        rating: data.rating ?? data.combined_rating ?? 0,
        avatarUrl: avatarUrl?.trim() || null,
        singlesRating: data.singles_rating ?? null,
        doublesRating: data.doubles_rating ?? null,
        combinedRating: data.combined_rating ?? null,
        laurels24mo: data.laurels_24mo ?? data.laurels24mo ?? data.laurels_24_mo ?? null,
        singlesWon: data.singles_won ?? null,
        singlesPlayed: data.singles_played ?? null,
        winPctSingles: data.win_pct_singles ?? null,
        doublesWon: data.doubles_won ?? null,
        doublesPlayed: data.doubles_played ?? null,
        winPctDoubles: data.win_pct_doubles ?? null,
        totalWon: data.total_won ?? null,
        totalPlayed: data.total_played ?? null,
        winPctTotal: data.win_pct_total ?? null,
        title: data.title ?? null,
        clubTitle: data.club_title ?? null,
        fullNameWithTitles: data.full_name_with_titles ?? null,
        gender: data.gender ?? null,
        playerIdentifier: data.player_identifier ?? null,
        isAutoCreated: data.is_auto_created ?? false,
    };
}

export async function getPlayerByIdWithClient(
    client: SupabaseClient,
    id: string
): Promise<IPlayer | null> {
    let data: PlayerRow | null = null;
    const isUuid = UUID_REGEX.test(id);
    const isNumeric = /^\d+$/.test(id);

    const byUserId = await client
        .from("players")
        .select("*")
        .eq("user_id", id)
        .maybeSingle();
    if (byUserId.error) {
        console.error("getPlayerById by user_id:", byUserId.error);
    }
    if (byUserId.data) data = byUserId.data as PlayerRow;

    if (!data && isNumeric) {
        const byNumericId = await client
            .from("players")
            .select("*, profiles(avatar_url)")
            .eq("id", parseInt(id, 10))
            .maybeSingle();
        if (!byNumericId.error && byNumericId.data) data = byNumericId.data as PlayerRow;
    }
    if (!data) {
        const byId = await client
            .from("players")
            .select("*, profiles(avatar_url)")
            .eq("id", id)
            .maybeSingle();
        if (!byId.error && byId.data) data = byId.data as PlayerRow;
    }
    if (!data) return null;

    return mapPlayerRowToIPlayer(data);
}

export async function getPlayerById(id: string): Promise<IPlayer | null> {
    return getPlayerByIdWithClient(supabase, id);
}

export interface GetPlayersParams {
    search?: string;
    kingdom?: string;
    club?: string;
    page?: number;
    pageSize?: number;
}

export interface GetPlayersResult {
    players: IPlayer[];
    total: number;
}

export async function getPlayersWithFilters(
    params: GetPlayersParams = {}
): Promise<GetPlayersResult> {
    const {
        search = "",
        kingdom = "",
        club = "",
        page = 1,
        pageSize = 10,
    } = params;

    let query = supabase
        .from("players")
        .select("*", { count: "exact" });

    if (search) {
        const searchPattern = `%${search}%`;
        query = query.or(`name.ilike.${searchPattern},club.ilike.${searchPattern}`);
    }

    if (kingdom) {
        query = query.eq("kingdom", kingdom);
    }

    if (club) {
        query = query.eq("club", club);
    }

    query = query.order("rating", { ascending: false });

    const from = (page - 1) * pageSize;
    const to = from + pageSize - 1;

    query = query.range(from, to);

    const { data, error, count } = await query;

    if (error) {
        console.error("Error fetching players with filters:", error);
        return { players: [], total: 0 };
    }

    const players =
        data?.map((player) => ({
            id: player.user_id || player.id,
            rowId: player.id,
            name: player.name,
            countryCode: player.country_code,
            kingdom: player.kingdom,
            club: player.club,
            rating: player.rating,
        })) || [];

    return {
        players,
        total: count || 0,
    };
}

export async function ensurePlayerForUser(userId: string): Promise<void> {
    const { data: existing } = await supabase
        .from("players")
        .select("id")
        .eq("user_id", userId)
        .maybeSingle();
    if (existing) return;

    const { data: profile } = await supabase
        .from("profiles")
        .select("full_name, country")
        .eq("id", userId)
        .maybeSingle();
    const row = profile as { full_name?: string | null; country?: string | null } | null;
    const name = row?.full_name?.trim() ?? "";
    const countryCode = row?.country?.trim() ?? "";

    const { error } = await supabase.from("players").insert({
        user_id: userId,
        name,
        country_code: countryCode,
    });
    if (error) {
        const err = error as { message?: string; code?: string };
        if (err.code === "23505") return;
        console.error("ensurePlayerForUser insert error:", err.message ?? err.code ?? String(error));
    }
}

export async function linkPlayerToAccount(
    playerRowId: string,
    userId: string,
    playerName?: string
): Promise<{ error: Error | null }> {
    const numericId = typeof playerRowId === "string" && /^\d+$/.test(playerRowId)
        ? parseInt(playerRowId, 10)
        : playerRowId;

    const { data: targetRows, error: targetError } = await supabase
        .from("players")
        .select("id")
        .eq("id", numericId)
        .limit(1);
    if (targetError) {
        console.error("Error checking target player before link:", targetError);
        return { error: targetError };
    }
    if (!targetRows || targetRows.length === 0) {
        return { error: new Error("Target player row was not found") };
    }

    const { error: deleteError } = await supabase
        .from("players")
        .delete()
        .eq("user_id", userId)
        .neq("id", numericId);
    if (deleteError) {
        console.error("Error deleting auto-created player before link:", deleteError);
    }

    const { data: linkedRows, error } = await supabase
        .from("players")
        .update({ user_id: userId })
        .eq("id", numericId)
        .select("id");

    if (error) {
        console.error("Error linking player to account:", error);
        return { error };
    }
    if (!linkedRows || linkedRows.length === 0) {
        return { error: new Error("No player row was linked to account") };
    }
    const linkedName = typeof playerName === "string" ? playerName.trim() : "";
    if (linkedName) {
        const { error: ensureProfileError } = await supabase.rpc("ensure_profile", { p_id: userId });
        if (ensureProfileError) {
            console.error("Error ensuring profile before name sync:", ensureProfileError);
        }
        const { error: profileUpdateError } = await supabase
            .from("profiles")
            .update({ full_name: linkedName })
            .eq("id", userId);
        if (profileUpdateError) {
            console.error("Error updating profile full_name after link:", profileUpdateError);
        }
    }
    return { error: null };
}

export async function getUniqueKingdoms(): Promise<
    Array<{ value: string; label: string }>
> {
    const { data, error } = await supabase
        .from("players")
        .select("kingdom")
        .not("kingdom", "is", null);

    if (error) {
        console.error("Error fetching kingdoms:", error);
        return [];
    }

    const uniqueKingdoms = Array.from(
        new Set(data?.map((p) => p.kingdom).filter(Boolean) || [])
    ).sort();

    return uniqueKingdoms.map((kingdom) => ({
        value: kingdom,
        label: kingdom,
    }));
}

export async function getUniqueClubs(): Promise<
    Array<{ value: string; label: string }>
> {
    const { data, error } = await supabase
        .from("players")
        .select("club")
        .not("club", "is", null)
        .neq("club", "");

    if (error) {
        console.error("Error fetching clubs:", error);
        return [];
    }

    const uniqueClubs = Array.from(
        new Set(data?.map((p) => p.club).filter(Boolean) || [])
    ).sort();

    return uniqueClubs.map((club) => ({
        value: club,
        label: club,
    }));
}

function mapRegsToPlayers(
    playersData: { user_id?: string; name: string; country_code: string; kingdom: string; club: string; rating: number; profiles?: { avatar_url?: string | null } | null }[]
): IPlayer[] {
    return playersData.map((p) => {
        const profile = p.profiles as { avatar_url?: string | null } | null;
        const avatarUrl = profile?.avatar_url ?? null;
        return {
            id: String(p.user_id ?? ""),
            name: p.name,
            countryCode: p.country_code,
            kingdom: p.kingdom,
            club: p.club,
            rating: p.rating,
            avatarUrl: avatarUrl?.trim() || null,
        };
    });
}

export async function getEventRegisteredPlayers(eventId: number): Promise<IPlayer[]> {
    try {
        const { data: regs, error: regError } = await supabase
            .from("event_registrations")
            .select("user_id")
            .eq("event_id", eventId);

        if (regError || !regs?.length) return [];

        const userIds = regs.map((r) => r.user_id);
        const { data: playersData, error: playersError } = await supabase
            .from("players")
            .select("*, profiles(avatar_url)")
            .in("user_id", userIds)
            .order("rating", { ascending: false });

        if (playersError || !playersData?.length) return [];

        return mapRegsToPlayers(playersData);
    } catch {
        return [];
    }
}

export async function getEventRegisteredPlayersByHeat(
    eventId: number,
    heatIndex: number
): Promise<IPlayer[]> {
    try {
        const { data: regs, error: regError } = await supabase
            .from("event_registrations")
            .select("user_id")
            .eq("event_id", eventId)
            .eq("heat_index", heatIndex);

        if (regError || !regs?.length) return [];

        const userIds = regs.map((r) => r.user_id);
        const { data: playersData, error: playersError } = await supabase
            .from("players")
            .select("*, profiles(avatar_url)")
            .in("user_id", userIds)
            .order("rating", { ascending: false });

        if (playersError || !playersData?.length) return [];

        return mapRegsToPlayers(playersData);
    } catch {
        return [];
    }
}

export async function getClubs(): Promise<IClub[]> {
    const { data, error } = await supabase
        .from("clubs")
        .select("*")
        .order("id", { ascending: true });

    if (error) {
        console.error("Error fetching clubs:", error);
        return [];
    }

    return (
        data?.map((club) => ({
            id: club.id,
            title: club.title,
            image: club.image || "",
            description: club.description,
            members: club.members,
            location: club.location,
            labels: club.labels || "",
            country: club.country || "",
            labelItem1: club.label_item1 || "",
            labelItem2: club.label_item2 || "",
            hosted: club.hosted,
            veteranPlayers: club.veteran_players,
            isLocked: club.is_locked,
        })) || []
    );
}

export async function getClubById(id: number): Promise<IClub | null> {
    const { data, error } = await supabase
        .from("clubs")
        .select("*")
        .eq("id", id)
        .single();

    if (error || !data) return null;

    return {
        id: data.id,
        title: data.title,
        image: data.image || "",
        description: data.description,
        members: data.members,
        location: data.location,
        labels: data.labels || "",
        country: data.country || "",
        labelItem1: data.label_item1 || "",
        labelItem2: data.label_item2 || "",
        hosted: data.hosted,
        veteranPlayers: data.veteran_players,
        isLocked: data.is_locked,
    };
}

function mapClubRow(data: {
    id: number;
    title: string;
    image: string | null;
    description: string;
    members: number;
    location: string;
    labels: string | null;
    country: string | null;
    label_item1: string | null;
    label_item2: string | null;
    hosted: number;
    veteran_players: number;
    is_locked: boolean | null;
}): IClub {
    return {
        id: data.id,
        title: data.title,
        image: data.image || "",
        description: data.description,
        members: data.members,
        location: data.location,
        labels: data.labels || "",
        country: data.country || "",
        labelItem1: data.label_item1 || "",
        labelItem2: data.label_item2 || "",
        hosted: data.hosted,
        veteranPlayers: data.veteran_players,
        isLocked: data.is_locked ?? false,
    };
}

export async function getClubsWhereUserIsAdmin(userId: string): Promise<IClub[]> {
    const { data: adminRows, error: adminError } = await supabase
        .from("club_admins")
        .select("club_id")
        .eq("user_id", userId);

    if (adminError || !adminRows?.length) return [];

    const clubIds = adminRows.map((r) => r.club_id);
    const { data: clubsData, error } = await supabase
        .from("clubs")
        .select("*")
        .in("id", clubIds)
        .order("id", { ascending: true });

    if (error || !clubsData?.length) return [];

    return clubsData.map(mapClubRow);
}

export async function getClubOwnedByUser(userId: string): Promise<IClub | null> {
    const { data: ownerRow, error: ownerError } = await supabase
        .from("club_admins")
        .select("club_id")
        .eq("user_id", userId)
        .eq("is_owner", true)
        .maybeSingle();

    if (ownerError || !ownerRow?.club_id) return null;

    return getClubById(ownerRow.club_id);
}

export interface IClubMember {
    name: string;
    laurels: number;
    singlesRating: number;
    doublesRating: number;
    userId?: string | null;
    isAdmin?: boolean;
}

export async function getClubMembers(
    clubTitle: string,
    clubId?: number
): Promise<IClubMember[]> {
    const adminUserIds = new Set<string>();
    if (clubId != null) {
        const { data: adminRows } = await supabase
            .from("club_admins")
            .select("user_id")
            .eq("club_id", clubId);
        (adminRows ?? []).forEach((r) => adminUserIds.add(r.user_id));
    }

    const { data: playersData } = await supabase
        .from("players")
        .select("name, rating, user_id")
        .eq("club", clubTitle);

    const fromClub: IClubMember[] = (playersData ?? []).map((p) => ({
        name: p.name ?? "",
        laurels: 0,
        singlesRating: p.rating ?? 0,
        doublesRating: 0,
        userId: p.user_id ?? null,
        isAdmin: p.user_id ? adminUserIds.has(p.user_id) : false,
    }));

    const userIdsInList = new Set(fromClub.map((m) => m.userId).filter(Boolean));

    if (clubId != null && adminUserIds.size > 0) {
        const missingAdminIds = [...adminUserIds].filter((id) => !userIdsInList.has(id));
        if (missingAdminIds.length > 0) {
            const { data: adminPlayers } = await supabase
                .from("players")
                .select("name, rating, user_id")
                .in("user_id", missingAdminIds);
            for (const p of adminPlayers ?? []) {
                const uid = p.user_id ?? "";
                fromClub.push({
                    name: p.name ?? "—",
                    laurels: 0,
                    singlesRating: p.rating ?? 0,
                    doublesRating: 0,
                    userId: uid,
                    isAdmin: true,
                });
            }
        }
    }

    return fromClub;
}

export interface IClubAdmin {
    id: string;
    fullName: string;
    country: string | null;
    userId?: string;
    isOwner?: boolean;
}

export async function getClubAdmins(clubId: number): Promise<IClubAdmin[]> {
    const { data, error } = await supabase
        .from("club_admins")
        .select("user_id, is_owner")
        .eq("club_id", clubId)
        .order("is_owner", { ascending: false });

    if (error || !data?.length) return [];

    const rows = data as { user_id: string; is_owner: boolean }[];
    const userIds = rows.map((r) => r.user_id);
    const { data: players } = await supabase
        .from("players")
        .select("id, name, country_code, user_id")
        .in("user_id", userIds);

    const byUserId = new Map(
        (players ?? []).map((p) => [p.user_id, p])
    );
    const ownerByUserId = new Map(rows.map((r) => [r.user_id, r.is_owner ?? false]));

    const result: IClubAdmin[] = rows.map((r) => {
        const p = byUserId.get(r.user_id);
        return {
            id: p?.id ?? r.user_id,
            fullName: p?.name ?? "—",
            country: p?.country_code ?? null,
            userId: r.user_id,
            isOwner: ownerByUserId.get(r.user_id) ?? false,
        };
    });
    result.sort((a, b) => (a.isOwner === b.isOwner ? 0 : a.isOwner ? -1 : 1));
    return result;
}

export async function setClubMemberRole(
    clubId: number,
    userId: string,
    role: "admin" | "member"
): Promise<boolean> {
    if (role === "admin") {
        const { error } = await supabase
            .from("club_admins")
            .insert({ club_id: clubId, user_id: userId, is_owner: false });
        if (error?.code === "23505") return true;
        return !error;
    }
    const { error } = await supabase
        .from("club_admins")
        .delete()
        .eq("club_id", clubId)
        .eq("user_id", userId);
    return !error;
}

export async function removeClubMember(
    clubId: number,
    userId: string,
    clubTitle: string
): Promise<boolean> {
    const { data, error } = await supabase.rpc("remove_club_member", {
        p_club_id: clubId,
        p_member_user_id: userId,
        p_club_title: clubTitle,
    });
    if (error) return false;
    return data === true;
}

export async function leaveClub(clubId: number, clubTitle: string): Promise<boolean> {
    const { data, error } = await supabase.rpc("leave_club", {
        p_club_id: clubId,
        p_club_title: clubTitle,
    });
    if (error) return false;
    return data === true;
}

export async function invitePlayerToClub(
    clubTitle: string,
    userId: string
): Promise<boolean> {
    const { error: playersErr } = await supabase
        .from("players")
        .update({ club: clubTitle, updated_at: new Date().toISOString() })
        .eq("user_id", userId);
    if (playersErr) return false;
    const { error: profilesErr } = await supabase
        .from("profiles")
        .update({ club: clubTitle, updated_at: new Date().toISOString() })
        .eq("id", userId);
    return !profilesErr;
}

export async function createClubInvite(
    clubId: number,
    clubTitle: string,
    userId: string
): Promise<boolean> {
    const { error: reqError } = await supabase
        .from("club_join_requests")
        .upsert(
            { user_id: userId, club_id: clubId, status: "invited", reviewed_at: null, reviewed_by: null },
            { onConflict: "user_id,club_id" }
        );
    if (reqError) return false;
    const { error: notifError } = await supabase
        .from("user_notifications")
        .insert({ user_id: userId, type: "club_invite", club_id: clubId });
    return !notifError;
}

export interface IClubInviteNotification {
    id: number;
    clubId: number;
    clubTitle: string;
    createdAt: string;
    readAt: string | null;
}

export async function getClubInviteNotifications(userId: string): Promise<IClubInviteNotification[]> {
    const { data, error } = await supabase
        .from("user_notifications")
        .select("id, club_id, created_at, read_at")
        .eq("user_id", userId)
        .eq("type", "club_invite")
        .order("created_at", { ascending: false });
    if (error || !data?.length) return [];
    const rows = data as { id: number; club_id: number; created_at: string; read_at: string | null }[];
    const clubIds = [...new Set(rows.map((r) => r.club_id))];
    const { data: clubsData } = await supabase
        .from("clubs")
        .select("id, title")
        .in("id", clubIds);
    const titleByClubId = new Map((clubsData ?? []).map((c) => [c.id, c.title]));
    return rows.map((r) => ({
        id: r.id,
        clubId: r.club_id,
        clubTitle: titleByClubId.get(r.club_id) ?? "",
        createdAt: r.created_at,
        readAt: r.read_at,
    }));
}

export async function acceptClubInvite(clubId: number, clubTitle: string, userId: string): Promise<boolean> {
    const request = await getClubJoinRequest(userId, clubId);
    if (!request || request.status !== "invited") return false;
    const { error: updateErr } = await supabase
        .from("club_join_requests")
        .update({
            status: "approved",
            reviewed_at: new Date().toISOString(),
            reviewed_by: userId,
        })
        .eq("id", request.id);
    if (updateErr) return false;
    const added = await invitePlayerToClub(clubTitle, userId);
    if (!added) return false;
    await insertClubJoinApprovedNotification(userId, clubId);
    const { data: notifRows } = await supabase
        .from("user_notifications")
        .select("id")
        .eq("user_id", userId)
        .eq("type", "club_invite")
        .eq("club_id", clubId)
        .is("read_at", null);
    for (const row of notifRows ?? []) {
        await markUserNotificationRead(row.id);
    }
    return true;
}

export async function rejectClubInvite(clubId: number, userId: string): Promise<boolean> {
    const request = await getClubJoinRequest(userId, clubId);
    if (!request || request.status !== "invited") return false;
    const { error: updateErr } = await supabase
        .from("club_join_requests")
        .update({
            status: "rejected",
            reviewed_at: new Date().toISOString(),
            reviewed_by: userId,
        })
        .eq("id", request.id);
    if (updateErr) return false;
    const { data: notifRows } = await supabase
        .from("user_notifications")
        .select("id")
        .eq("user_id", userId)
        .eq("type", "club_invite")
        .eq("club_id", clubId)
        .is("read_at", null);
    for (const row of notifRows ?? []) {
        await markUserNotificationRead(row.id);
    }
    return true;
}

export async function incrementClubMembers(clubId: number): Promise<boolean> {
    const { data: club } = await supabase
        .from("clubs")
        .select("members")
        .eq("id", clubId)
        .single();
    if (!club) return false;
    const next = (club.members ?? 0) + 1;
    const { error } = await supabase
        .from("clubs")
        .update({ members: next })
        .eq("id", clubId);
    return !error;
}

export interface GetPlayersForInviteParams {
    clubTitle: string;
    search?: string;
    page?: number;
    pageSize?: number;
}

export async function getPlayersForInvite(
    params: GetPlayersForInviteParams
): Promise<GetPlayersResult> {
    const { clubTitle, search = "", page = 1, pageSize = 20 } = params;
    const clubTitleNorm = String(clubTitle).trim().toLowerCase();
    const clubNeq = `club.neq."${String(clubTitle).replace(/"/g, '""')}"`;
    let query = supabase
        .from("players")
        .select("*", { count: "exact" })
        .or(`club.is.null,${clubNeq}`);
    if (search.trim()) {
        const pattern = `%${search.trim()}%`;
        query = query.ilike("name", pattern);
    }
    query = query.order("rating", { ascending: false });
    const from = (page - 1) * pageSize;
    query = query.range(from, from + pageSize - 1);
    const { data, error, count } = await query;
    if (error) {
        console.error("Error fetching players for invite:", error);
        return { players: [], total: 0 };
    }
    let players =
        (data?.map((p) => ({
            id: p.user_id || p.id,
            name: p.name,
            countryCode: p.country_code,
            kingdom: p.kingdom,
            club: p.club,
            rating: p.rating,
        })) as IPlayer[]) || [];
    players = players.filter(
        (p) => (p.club ?? "").trim().toLowerCase() !== clubTitleNorm
    );
    return { players, total: count ?? 0 };
}

export interface IClubDiscount {
    id: number;
    clubId: number;
    code: string;
    description: string;
}

export async function getClubDiscounts(
    clubId: number
): Promise<IClubDiscount[]> {
    const { data, error } = await supabase
        .from("club_discounts")
        .select("id, club_id, code, description")
        .eq("club_id", clubId)
        .order("id", { ascending: true });

    if (error || !data) return [];
    return data.map((row) => ({
        id: row.id,
        clubId: row.club_id,
        code: row.code ?? "",
        description: row.description ?? "",
    }));
}

export async function createClubDiscount(
    clubId: number,
    payload: { code: string; description: string }
): Promise<IClubDiscount | null> {
    const { data, error } = await supabase
        .from("club_discounts")
        .insert({
            club_id: clubId,
            code: payload.code,
            description: payload.description,
        })
        .select("id, club_id, code, description")
        .single();

    if (error) return null;
    return {
        id: data.id,
        clubId: data.club_id,
        code: data.code ?? "",
        description: data.description ?? "",
    };
}

export async function updateClubDiscount(
    id: number,
    payload: { code: string; description: string }
): Promise<IClubDiscount | null> {
    const { data, error } = await supabase
        .from("club_discounts")
        .update({
            code: payload.code,
            description: payload.description,
            updated_at: new Date().toISOString(),
        })
        .eq("id", id)
        .select("id, club_id, code, description")
        .single();

    if (error) return null;
    return {
        id: data.id,
        clubId: data.club_id,
        code: data.code ?? "",
        description: data.description ?? "",
    };
}

export async function deleteClubDiscountById(id: number): Promise<boolean> {
    const { error } = await supabase
        .from("club_discounts")
        .delete()
        .eq("id", id);
    return !error;
}

export type ClubJoinRequestStatus = "pending" | "approved" | "rejected" | "invited";

export interface IClubJoinRequest {
    id: number;
    userId: string;
    clubId: number;
    status: ClubJoinRequestStatus;
    createdAt: string;
    reviewedAt: string | null;
    reviewedBy: string | null;
}

export async function getClubJoinRequest(
    userId: string,
    clubId: number
): Promise<IClubJoinRequest | null> {
    const { data, error } = await supabase
        .from("club_join_requests")
        .select("id, user_id, club_id, status, created_at, reviewed_at, reviewed_by")
        .eq("user_id", userId)
        .eq("club_id", clubId)
        .maybeSingle();
    if (error || !data) return null;
    return {
        id: data.id,
        userId: data.user_id,
        clubId: data.club_id,
        status: data.status as ClubJoinRequestStatus,
        createdAt: data.created_at,
        reviewedAt: data.reviewed_at,
        reviewedBy: data.reviewed_by,
    };
}

export async function createClubJoinRequest(
    userId: string,
    clubId: number
): Promise<IClubJoinRequest | null> {
    const { data, error } = await supabase
        .from("club_join_requests")
        .insert({ user_id: userId, club_id: clubId, status: "pending" })
        .select("id, user_id, club_id, status, created_at, reviewed_at, reviewed_by")
        .single();
    if (error) return null;
    return {
        id: data.id,
        userId: data.user_id,
        clubId: data.club_id,
        status: data.status as ClubJoinRequestStatus,
        createdAt: data.created_at,
        reviewedAt: data.reviewed_at,
        reviewedBy: data.reviewed_by,
    };
}

export async function updateClubJoinRequestStatus(
    id: number,
    status: ClubJoinRequestStatus,
    reviewedBy: string
): Promise<boolean> {
    const { error } = await supabase
        .from("club_join_requests")
        .update({
            status,
            reviewed_at: new Date().toISOString(),
            reviewed_by: reviewedBy,
        })
        .eq("id", id);
    return !error;
}

export async function getClubJoinRequestCount(
    clubId: number,
    status: ClubJoinRequestStatus = "pending"
): Promise<number> {
    const { count, error } = await supabase
        .from("club_join_requests")
        .select("id", { count: "exact", head: true })
        .eq("club_id", clubId)
        .eq("status", status);
    if (error) return 0;
    return count ?? 0;
}

export interface ClubJoinRequestWithUser extends IClubJoinRequest {
    userName?: string | null;
    clubTitle?: string | null;
    playerName?: string | null;
    playerCountry?: string | null;
    playerRating?: number | null;
    playerClub?: string | null;
}

export async function getClubJoinRequestsForAdmin(
    clubId?: number,
    status?: ClubJoinRequestStatus
): Promise<ClubJoinRequestWithUser[]> {
    let q = supabase
        .from("club_join_requests")
        .select("id, user_id, club_id, status, created_at, reviewed_at, reviewed_by")
        .order("created_at", { ascending: false });
    if (clubId != null) q = q.eq("club_id", clubId);
    if (status) q = q.eq("status", status);
    const { data, error } = await q;
    if (error || !data?.length) return [];
    const rows = data as { id: number; user_id: string; club_id: number; status: string; created_at: string; reviewed_at: string | null; reviewed_by: string | null }[];
    const clubIds = [...new Set(rows.map((r) => r.club_id))];
    const userIds = [...new Set(rows.map((r) => r.user_id))];
    const [clubsRes, profilesRes, playersRes] = await Promise.all([
        supabase.from("clubs").select("id, title").in("id", clubIds),
        supabase.from("profiles").select("id, full_name").in("id", userIds),
        supabase.from("players").select("user_id, name, country_code, rating, club").in("user_id", userIds),
    ]);
    const clubById = new Map((clubsRes.data ?? []).map((c) => [c.id, c.title]));
    const profileById = new Map((profilesRes.data ?? []).map((p) => [p.id, p.full_name]));
    const playerByUserId = new Map(
        (playersRes.data ?? []).map((p: { user_id: string; name: string | null; country_code: string | null; rating: number | null; club: string | null }) => [p.user_id, p])
    );
    return rows.map((row) => {
        const player = playerByUserId.get(row.user_id);
        return {
            id: row.id,
            userId: row.user_id,
            clubId: row.club_id,
            status: row.status as ClubJoinRequestStatus,
            createdAt: row.created_at,
            reviewedAt: row.reviewed_at,
            reviewedBy: row.reviewed_by,
            userName: profileById.get(row.user_id) ?? null,
            clubTitle: clubById.get(row.club_id) ?? null,
            playerName: player?.name ?? null,
            playerCountry: player?.country_code ?? null,
            playerRating: player?.rating ?? null,
            playerClub: player?.club ?? null,
        };
    });
}

export async function getPendingClubJoinRequestsForAdminUser(
    userId: string
): Promise<ClubJoinRequestWithUser[]> {
    const adminClubs = await getClubsWhereUserIsAdmin(userId);
    if (!adminClubs.length) return [];
    const adminClubIds = new Set(adminClubs.map((c) => c.id));
    const allPending = await getClubJoinRequestsForAdmin(undefined, "pending");
    return allPending.filter((r) => adminClubIds.has(r.clubId));
}

export async function getReadClubJoinNotificationClubIds(userId: string): Promise<number[]> {
    const { data, error } = await supabase
        .from("club_join_notification_reads")
        .select("club_id")
        .eq("user_id", userId);
    if (error) return [];
    return (data ?? []).map((r) => r.club_id);
}

export async function markClubJoinNotificationRead(
    userId: string,
    clubId: number
): Promise<boolean> {
    const { error } = await supabase
        .from("club_join_notification_reads")
        .upsert({ user_id: userId, club_id: clubId, read_at: new Date().toISOString() }, {
            onConflict: "user_id,club_id",
        });
    return !error;
}

export async function markAllClubJoinNotificationsRead(userId: string): Promise<boolean> {
    const pending = await getPendingClubJoinRequestsForAdminUser(userId);
    const clubIds = [...new Set(pending.map((r) => r.clubId))];
    if (!clubIds.length) return true;
    const rows = clubIds.map((clubId) => ({
        user_id: userId,
        club_id: clubId,
        read_at: new Date().toISOString(),
    }));
    const { error } = await supabase
        .from("club_join_notification_reads")
        .upsert(rows, { onConflict: "user_id,club_id" });
    return !error;
}

export async function insertClubJoinApprovedNotification(
    userId: string,
    clubId: number
): Promise<boolean> {
    const { error } = await supabase
        .from("user_notifications")
        .insert({ user_id: userId, type: "club_join_approved", club_id: clubId });
    return !error;
}

export interface IUserNotificationClubJoinApproved {
    id: number;
    clubId: number;
    clubTitle: string;
    createdAt: string;
    readAt: string | null;
}

export async function getClubJoinApprovedNotifications(
    userId: string
): Promise<IUserNotificationClubJoinApproved[]> {
    const { data, error } = await supabase
        .from("user_notifications")
        .select("id, club_id, created_at, read_at")
        .eq("user_id", userId)
        .eq("type", "club_join_approved")
        .order("created_at", { ascending: false });
    if (error || !data?.length) return [];
    const rows = data as { id: number; club_id: number; created_at: string; read_at: string | null }[];
    const clubIds = [...new Set(rows.map((r) => r.club_id))];
    const { data: clubsData } = await supabase
        .from("clubs")
        .select("id, title")
        .in("id", clubIds);
    const titleByClubId = new Map((clubsData ?? []).map((c) => [c.id, c.title]));
    return rows.map((r) => ({
        id: r.id,
        clubId: r.club_id,
        clubTitle: titleByClubId.get(r.club_id) ?? "",
        createdAt: r.created_at,
        readAt: r.read_at,
    }));
}

export async function markUserNotificationRead(notificationId: number): Promise<boolean> {
    const { error } = await supabase
        .from("user_notifications")
        .update({ read_at: new Date().toISOString() })
        .eq("id", notificationId);
    return !error;
}

export async function markAllUserNotificationsRead(userId: string): Promise<boolean> {
    const { error } = await supabase
        .from("user_notifications")
        .update({ read_at: new Date().toISOString() })
        .eq("user_id", userId)
        .is("read_at", null);
    return !error;
}

export interface GetClubsParams {
    search?: string;
    location?: string;
    page?: number;
    pageSize?: number;
    sortBy?: string;
}

export interface GetClubsResult {
    clubs: IClub[];
    total: number;
}

export async function getClubsWithFilters(
    params: GetClubsParams = {}
): Promise<GetClubsResult> {
    const {
        search = "",
        location = "",
        page = 1,
        pageSize = 6,
        sortBy = "id",
    } = params;

    let query = supabase
        .from("clubs")
        .select("*", { count: "exact" });

    if (search) {
        const searchPattern = `%${search}%`;
        query = query.or(`title.ilike.${searchPattern},description.ilike.${searchPattern},location.ilike.${searchPattern}`);
    }

    if (location) {
        query = query.eq("location", location);
    }

    const ascending = sortBy === "id" || sortBy === "members-asc";
    query = query.order(
        sortBy.startsWith("members") ? "members" : "id",
        { ascending }
    );

    const from = (page - 1) * pageSize;
    const to = from + pageSize - 1;

    query = query.range(from, to);

    const { data, error, count } = await query;

    if (error) {
        console.error("Error fetching clubs with filters:", error);
        return { clubs: [], total: 0 };
    }

    const clubs =
        data?.map((club) => ({
            id: club.id,
            title: club.title,
            image: club.image || "",
            description: club.description,
            members: club.members,
            location: club.location,
            labels: club.labels || "",
            country: club.country || "",
            labelItem1: club.label_item1 || "",
            labelItem2: club.label_item2 || "",
            hosted: club.hosted,
            veteranPlayers: club.veteran_players,
            isLocked: club.is_locked,
        })) || [];

    return {
        clubs,
        total: count || 0,
    };
}

export async function getUniqueLocations(): Promise<
    Array<{ value: string; label: string }>
> {
    const { data, error } = await supabase
        .from("clubs")
        .select("location")
        .not("location", "is", null);

    if (error) {
        console.error("Error fetching locations:", error);
        return [];
    }

    const uniqueLocations = Array.from(
        new Set(data?.map((c) => c.location).filter(Boolean) || [])
    ).sort();

    return uniqueLocations.map((location) => ({
        value: location,
        label: location,
    }));
}

export async function getUniqueEventLocations(): Promise<
    Array<{ value: string; label: string }>
> {
    const { data, error } = await supabase
        .from("events")
        .select("location")
        .not("location", "is", null);

    if (error) {
        console.error("Error fetching event locations:", error);
        return [];
    }

    const uniqueLocations = Array.from(
        new Set(data?.map((e) => e.location).filter(Boolean) || [])
    ).sort();

    return uniqueLocations.map((location) => ({
        value: location,
        label: location,
    }));
}

export async function getUniqueEventFormats(): Promise<
    Array<{ value: string; label: string }>
> {
    const { data, error } = await supabase
        .from("events")
        .select("format")
        .not("format", "is", null);

    if (error) {
        console.error("Error fetching event formats:", error);
        return [];
    }

    const uniqueFormats = Array.from(
        new Set(data?.map((e) => e.format).filter(Boolean) || [])
    ).sort();

    return uniqueFormats.map((format) => ({
        value: format,
        label: format,
    }));
}

const CLUB_LOGOS_BUCKET = "club-logos";

function getFileExtension(filename: string): string {
    const match = filename.match(/\.([a-zA-Z0-9]+)$/);
    return match ? match[1].toLowerCase() : "png";
}

export interface CreateClubParams {
    title: string;
    description: string;
    location: string;
    inviteOnly: boolean;
    logoFile: File | null;
    userId: string;
}

export async function createClub(params: CreateClubParams): Promise<IClub> {
    const { title, description, location, inviteOnly, logoFile, userId } = params;

    const { data: newClub, error: insertError } = await supabase
        .from("clubs")
        .insert({
            title: title.trim(),
            description: (description || "").trim(),
            location: (location || "").trim(),
            is_locked: !!inviteOnly,
            members: 1,
            image: null,
            labels: null,
            country: null,
            label_item1: null,
            label_item2: null,
            hosted: 0,
            veteran_players: 0,
        })
        .select("id")
        .single();

    if (insertError || !newClub?.id) {
        throw new Error(insertError?.message ?? "Failed to create club");
    }

    const clubId = newClub.id;
    let imageUrl: string | null = null;

    if (logoFile) {
        const ext = getFileExtension(logoFile.name);
        const path = `${userId}/${clubId}/logo.${ext}`;
        const { error: uploadError } = await supabase.storage
            .from(CLUB_LOGOS_BUCKET)
            .upload(path, logoFile, { upsert: true });

        if (!uploadError) {
            const { data: urlData } = supabase.storage
                .from(CLUB_LOGOS_BUCKET)
                .getPublicUrl(path);
            imageUrl = urlData.publicUrl;
        }
    }

    if (imageUrl) {
        await supabase
            .from("clubs")
            .update({ image: imageUrl })
            .eq("id", clubId);
    }

    const { error: adminError } = await supabase
        .from("club_admins")
        .insert({ club_id: clubId, user_id: userId, is_owner: true });

    if (adminError) {
        throw new Error(adminError.message);
    }

    const titleTrimmed = title.trim();
    await supabase
        .from("profiles")
        .update({ club: titleTrimmed, updated_at: new Date().toISOString() })
        .eq("id", userId);
    await supabase
        .from("players")
        .update({ club: titleTrimmed, updated_at: new Date().toISOString() })
        .eq("user_id", userId);

    const club = await getClubById(clubId);
    if (!club) throw new Error("Club not found after creation");
    return club;
}

export interface UpdateClubParams {
    clubId: number;
    title: string;
    description: string;
    location: string;
    inviteOnly: boolean;
    logoFile: File | null;
    userId: string;
}

export async function updateClub(params: UpdateClubParams): Promise<IClub> {
    const { clubId, title, description, location, inviteOnly, logoFile, userId } = params;

    const updates: Record<string, unknown> = {
        title: title.trim(),
        description: (description || "").trim(),
        location: (location || "").trim(),
        is_locked: !!inviteOnly,
    };

    if (logoFile) {
        const ext = getFileExtension(logoFile.name);
        const path = `${userId}/${clubId}/logo.${ext}`;
        const { error: uploadError } = await supabase.storage
            .from(CLUB_LOGOS_BUCKET)
            .upload(path, logoFile, { upsert: true });

        if (!uploadError) {
            const { data: urlData } = supabase.storage
                .from(CLUB_LOGOS_BUCKET)
                .getPublicUrl(path);
            updates.image = urlData.publicUrl;
        }
    }

    const { error } = await supabase
        .from("clubs")
        .update(updates)
        .eq("id", clubId);

    if (error) throw new Error(error.message);

    const club = await getClubById(clubId);
    if (!club) throw new Error("Club not found after update");
    return club;
}

export async function deleteClub(clubId: number, userId: string): Promise<boolean> {
    const club = await getClubById(clubId);
    if (!club) return false;

    const { data: ownerRow } = await supabase
        .from("club_admins")
        .select("user_id")
        .eq("club_id", clubId)
        .eq("user_id", userId)
        .eq("is_owner", true)
        .maybeSingle();

    if (!ownerRow) return false;

    const title = club.title;
    const userIdsToClear = new Set<string>();

    const { data: adminRows } = await supabase
        .from("club_admins")
        .select("user_id")
        .eq("club_id", clubId);
    (adminRows ?? []).forEach((r: { user_id: string }) => userIdsToClear.add(r.user_id));

    const { data: profilesWithClub } = await supabase
        .from("profiles")
        .select("id")
        .eq("club", title);
    (profilesWithClub ?? []).forEach((p: { id: string }) => userIdsToClear.add(p.id));

    const { data: playersWithClub } = await supabase
        .from("players")
        .select("user_id")
        .eq("club", title);
    (playersWithClub ?? []).forEach((p: { user_id: string }) => userIdsToClear.add(p.user_id));

    const ids = [...userIdsToClear];
    if (ids.length > 0) {
        await supabase
            .from("profiles")
            .update({ club: null, updated_at: new Date().toISOString() })
            .in("id", ids);
        await supabase
            .from("players")
            .update({ club: "", updated_at: new Date().toISOString() })
            .in("user_id", ids);
    }

    await supabase.from("user_notifications").delete().eq("club_id", clubId);
    await supabase.from("club_join_notification_reads").delete().eq("club_id", clubId);
    await supabase.from("club_join_requests").delete().eq("club_id", clubId);
    await supabase.from("club_discounts").delete().eq("club_id", clubId);
    await supabase.from("club_admins").delete().eq("club_id", clubId);

    const { error } = await supabase.from("clubs").delete().eq("id", clubId);
    return !error;
}

export async function getTournaments(): Promise<ITournament[]> {
    const { data, error } = await supabase
        .from("tournaments")
        .select("*")
        .order("date", { ascending: false });

    if (error) {
        console.error("Error fetching tournaments:", error);
        return [];
    }

    return (
        data?.map((tournament) => ({
            id: tournament.id,
            name: tournament.name,
            laurels: tournament.laurels,
            strengthOfField: tournament.strength_of_field,
            wins: tournament.wins,
            loses: tournament.loses,
            ties: tournament.ties,
            place: tournament.place,
            date: tournament.date,
            tournamentPageUrl: tournament.tournament_page_url,
        })) || []
    );
}

export async function getRankings(
    category: "laurels" | "singles" | "doubles"
): Promise<IRankList[]> {
    const { data, error } = await supabase
        .from("rankings")
        .select("*")
        .eq("category", category)
        .order('"rank"', { ascending: true });

    if (error) {
        console.error("Error fetching rankings:", error);
        return [];
    }

    const list =
        data?.map((ranking) => ({
            rank: Number(ranking.rank),
            name: ranking.name ?? "",
            playerId: ranking.player_id ?? null,
            laurels: Number(ranking.laurels) ?? 0,
            rating: ranking.rating != null ? Number(ranking.rating) : undefined,
            trend: ranking.trend ?? "—",
            trendUp: Boolean(ranking.trend_up),
            wins: Number(ranking.wins) ?? 0,
            losses: Number(ranking.losses) ?? 0,
            ties: Number(ranking.ties) ?? 0,
            kingdom: ranking.kingdom ?? "",
            club: ranking.club ?? "",
        })) ?? [];
    return list.slice().sort((a, b) => a.rank - b.rank);
}

export async function getAllRankings(): Promise<{
    laurels: IRankList[];
    singles: IRankList[];
    doubles: IRankList[];
}> {
    const [laurels, singles, doubles] = await Promise.all([
        getRankings("laurels"),
        getRankings("singles"),
        getRankings("doubles"),
    ]);

    return {
        laurels,
        singles,
        doubles,
    };
}

export async function getNews(): Promise<INewsItem[]> {
    const { data, error } = await supabase
        .from("news")
        .select("id, image, title, description, link, link_text, sort_order, created_at")
        .order("sort_order", { ascending: true })
        .order("created_at", { ascending: false });

    if (error) {
        console.error("Error fetching news:", error);
        return [];
    }

    return (
        data?.map((row: { id: number; image: string | null; title: string; description: string; link: string; link_text: string; sort_order?: number; created_at?: string }) => ({
            id: row.id,
            image: row.image ?? null,
            title: row.title ?? "",
            description: row.description ?? "",
            link: row.link ?? "#",
            linkText: row.link_text ?? "Read more",
            sortOrder: row.sort_order,
            createdAt: row.created_at,
        })) ?? []
    );
}

export async function getMatchHistory(): Promise<IMatchHistory[]> {
    const { data, error } = await supabase
        .from("match_history")
        .select("*")
        .order("date", { ascending: false });

    if (error) {
        console.error("Error fetching match history:", error);
        return [];
    }

    return (
        data?.map((match) => ({
            id: match.id,
            tournamentName: match.tournament_name,
            playerName: match.player_name,
            score: match.score,
            place: match.place,
            date: match.date,
            tournamentPageUrl: match.tournament_page_url,
        })) || []
    );
}

export async function getMatchHistoryForPlayer(playerName: string): Promise<IMatchHistory[]> {
    if (!playerName?.trim()) return [];
    const name = playerName.trim();
    const { data, error } = await supabase
        .from("match_history")
        .select("*")
        .ilike("player_name", name)
        .order("date", { ascending: false });

    if (error) {
        console.error("Error fetching match history for player:", error);
        return [];
    }

    return (
        data?.map((match) => ({
            id: match.id,
            tournamentName: match.tournament_name,
            playerName: match.player_name,
            score: match.score,
            place: match.place,
            date: match.date,
            tournamentPageUrl: match.tournament_page_url,
        })) || []
    );
}

async function getPlayerNamesByIds(ids: string[]): Promise<Map<string, string>> {
    const uniq = [...new Set(ids)].filter(Boolean);
    if (uniq.length === 0) return new Map();
    const { data, error } = await supabase
        .from("players")
        .select("id, name")
        .in("id", uniq);
    if (error || !data?.length) return new Map();
    const map = new Map<string, string>();
    for (const row of data) {
        map.set(String(row.id), row.name ?? "—");
    }
    return map;
}

export async function getMatchHistoryFromSinglesAndDoubles(playerId: string): Promise<IMatchHistory[]> {
    if (!playerId?.trim()) return [];

    const { data: playerRow } = await supabase
        .from("players")
        .select("id, user_id")
        .or(`id.eq.${playerId},user_id.eq.${playerId}`)
        .maybeSingle();
    const prow = playerRow as { id?: number | string; user_id?: string | null } | null;
    const playerIds = prow
        ? [...new Set([String(prow.id), prow.user_id].filter(Boolean) as string[])]
        : [playerId];
    const playerIdSet = new Set(playerIds);
    const singlesOr = playerIds.flatMap((id) => [`player1_id.eq.${id}`, `player2_id.eq.${id}`]).join(",");
    const doublesOr = playerIds.flatMap((id) => [`player1_id.eq.${id}`, `player2_id.eq.${id}`, `player3_id.eq.${id}`, `player4_id.eq.${id}`]).join(",");

    const [singlesRes, doublesRes] = await Promise.all([
        supabase
            .from("singles")
            .select("id, match_date, match_number, player1_id, player2_id, points_won_p1, points_won_p2, winner")
            .or(singlesOr)
            .order("match_date", { ascending: false }),
        supabase
            .from("doubles")
            .select("id, match_date, match_number, player1_id, player2_id, player3_id, player4_id, points_won_team1, points_won_team2, winner")
            .or(doublesOr)
            .order("match_date", { ascending: false }),
    ]);

    const items: Array<{ date: string; tournamentName: string; opponentName: string; score: number; id: string }> = [];
    const opponentIds = new Set<string>();

    for (const row of singlesRes.data ?? []) {
        const r = row as { id: number; match_date: string; match_number: number; player1_id: string; player2_id: string; points_won_p1: number; points_won_p2: number; winner: string | null };
        const isP1 = playerIdSet.has(r.player1_id);
        const opponentId = isP1 ? r.player2_id : r.player1_id;
        const myPoints = isP1 ? Number(r.points_won_p1) : Number(r.points_won_p2);
        opponentIds.add(opponentId);
        items.push({
            id: `singles-${r.id}`,
            date: r.match_date,
            tournamentName: "Singles",
            opponentName: opponentId,
            score: Math.round(myPoints),
        });
    }

    for (const row of doublesRes.data ?? []) {
        const r = row as { id: number; match_date: string; match_number: number; player1_id: string; player2_id: string; player3_id: string; player4_id: string; points_won_team1: number; points_won_team2: number; winner: string | null };
        const isTeam1 = playerIdSet.has(r.player1_id) || playerIdSet.has(r.player2_id);
        const opponentIdsThis = isTeam1 ? [r.player3_id, r.player4_id] : [r.player1_id, r.player2_id];
        const myPoints = isTeam1 ? Number(r.points_won_team1) : Number(r.points_won_team2);
        opponentIdsThis.forEach((id) => opponentIds.add(id));
        items.push({
            id: `doubles-${r.id}`,
            date: r.match_date,
            tournamentName: "Doubles",
            opponentName: opponentIdsThis.join(","),
            score: Math.round(myPoints),
        });
    }

    const nameMap = await getPlayerNamesByIds([...opponentIds]);

    const resolveNames = (key: string): string => {
        if (key.includes(",")) {
            return key
                .split(",")
                .map((id) => nameMap.get(id.trim()) ?? id)
                .join(", ");
        }
        return nameMap.get(key) ?? key;
    };

    const result: IMatchHistory[] = items
        .sort((a, b) => new Date(b.date).getTime() - new Date(a.date).getTime())
        .map((item) => ({
            id: item.id,
            tournamentName: item.tournamentName,
            playerName: resolveNames(item.opponentName),
            score: item.score,
            place: 0,
            date: item.date,
            tournamentPageUrl: "",
        }));

    return result;
}

export interface IRatingChartDataPoint {
    month: string;
    thisYear: number;
    lastYear: number;
}

export interface IRatingChartSeries {
    ratingData: IRatingChartDataPoint[];
    currentValue: number;
    change: string;
}

export interface IRatingHistoryFromSinglesDoubles {
    singles: IRatingChartSeries & { matchCount: number };
    doubles: IRatingChartSeries & { matchCount: number };
}

const MONTH_NAMES = ["Jan", "Feb", "Mar", "Apr", "May", "Jun", "Jul", "Aug", "Sep", "Oct", "Nov", "Dec"];

type MatchRatingPoint = { date: string; rating: number };

function buildRatingSeriesFromMatches(
    periodStartDate: string,
    initialRating: number,
    matchesSortedByDate: Array<{ date: string; ratingChange: number }>
): IRatingChartSeries {
    const points: MatchRatingPoint[] = [];
    let runningRating = initialRating;
    points.push({ date: periodStartDate, rating: runningRating });
    for (const m of matchesSortedByDate) {
        runningRating += m.ratingChange;
        points.push({ date: m.date, rating: runningRating });
    }

    const periodStart = new Date(periodStartDate + "T12:00:00");
    const byYearMonth = new Map<string, number>();
    let lastRating = initialRating;
    for (const { date, rating } of points) {
        const d = new Date(date + "T12:00:00");
        lastRating = rating;
        const key = `${d.getFullYear()}-${d.getMonth()}`;
        byYearMonth.set(key, rating);
    }

    const currentValue = Math.round(lastRating);
    const now = new Date();
    const currentYear = now.getFullYear();
    const lastYear = currentYear - 1;
    let prevLast = initialRating;
    const lastYearRatings: number[] = [];
    for (let m = 0; m < 12; m++) {
        const lastVal = byYearMonth.get(`${lastYear}-${m}`);
        if (lastVal !== undefined) prevLast = lastVal;
        lastYearRatings.push(Math.round(lastVal ?? prevLast));
    }
    let prevThis = prevLast;
    const thisYearRatings: number[] = [];
    for (let m = 0; m < 12; m++) {
        const thisVal = byYearMonth.get(`${currentYear}-${m}`);
        if (thisVal !== undefined) prevThis = thisVal;
        thisYearRatings.push(Math.round(thisVal ?? prevThis));
    }
    const ratingData: IRatingChartDataPoint[] = MONTH_NAMES.map((month, i) => ({
        month,
        thisYear: thisYearRatings[i] ?? 0,
        lastYear: lastYearRatings[i] ?? 0,
    }));

    const firstMonthInWindow = byYearMonth.get(`${periodStart.getFullYear()}-${periodStart.getMonth()}`);
    const firstMonthRating = firstMonthInWindow ?? initialRating;
    const diff = Math.round(currentValue - firstMonthRating);
    const change = diff >= 0 ? `+${diff}` : String(diff);

    return { ratingData, currentValue, change };
}

export async function getRatingHistoryFromSinglesAndDoubles(playerId: string): Promise<IRatingHistoryFromSinglesDoubles> {
    if (!playerId?.trim()) {
        const empty = buildRatingSeriesFromMatches(new Date().toISOString().slice(0, 10), 0, []);
        return {
            singles: { ...empty, matchCount: 0 },
            doubles: { ...empty, matchCount: 0 },
        };
    }

    const cutoff = new Date();
    cutoff.setMonth(cutoff.getMonth() - 24);
    const cutoffStr = cutoff.toISOString().slice(0, 10);

    const { data: playerRow } = await supabase
        .from("players")
        .select("id, user_id, singles_rating, doubles_rating, rating")
        .or(`id.eq.${playerId},user_id.eq.${playerId}`)
        .maybeSingle();
    const prow = playerRow as { id?: number | string; user_id?: string | null; singles_rating?: number | null; doubles_rating?: number | null; rating?: number | null } | null;
    const playerIds = prow
        ? [...new Set([String(prow.id), prow.user_id].filter(Boolean) as string[])]
        : [playerId];
    const playerIdSet = new Set(playerIds);
    const fallbackSingles = prow?.singles_rating != null ? Number(prow.singles_rating) : (prow?.rating != null ? Number(prow.rating) : 0);
    const fallbackDoubles = prow?.doubles_rating != null ? Number(prow.doubles_rating) : (prow?.rating != null ? Number(prow.rating) : 0);

    const singlesOr = playerIds.flatMap((id) => [`player1_id.eq.${id}`, `player2_id.eq.${id}`]).join(",");
    const doublesOr = playerIds.flatMap((id) => [`player1_id.eq.${id}`, `player2_id.eq.${id}`, `player3_id.eq.${id}`, `player4_id.eq.${id}`]).join(",");
    const [singlesRes, doublesRes] = await Promise.all([
        supabase
            .from("singles")
            .select("match_date, player1_id, player2_id, p1_rating_old, p1_rating_new, p1_rating_change, p2_rating_old, p2_rating_new, p2_rating_change")
            .or(singlesOr)
            .gte("match_date", cutoffStr)
            .order("match_date", { ascending: true }),
        supabase
            .from("doubles")
            .select("match_date, player1_id, player2_id, player3_id, player4_id, p1_rating_old, p1_rating_new, p1_rating_change, p2_rating_old, p2_rating_new, p2_rating_change, p3_rating_old, p3_rating_new, p3_rating_change, p4_rating_old, p4_rating_new, p4_rating_change")
            .or(doublesOr)
            .gte("match_date", cutoffStr)
            .order("match_date", { ascending: true }),
    ]);

    const singlesMatches: Array<{ date: string; ratingChange: number }> = [];
    let singlesInitialRating = 0;
    for (const row of singlesRes.data ?? []) {
        const r = row as { match_date: string; player1_id: string; player2_id: string; p1_rating_old: number | null; p1_rating_new: number | null; p1_rating_change: number | null; p2_rating_old: number | null; p2_rating_new: number | null; p2_rating_change: number | null };
        const isP1 = playerIdSet.has(r.player1_id);
        const change = Number(isP1 ? (r.p1_rating_change ?? 0) : (r.p2_rating_change ?? 0));
        const ratingBefore = isP1 ? r.p1_rating_old : r.p2_rating_old;
        const ratingNew = isP1 ? (r.p1_rating_new ?? 0) : (r.p2_rating_new ?? 0);
        if (singlesMatches.length === 0 && ratingBefore != null) singlesInitialRating = Number(ratingBefore);
        else if (singlesMatches.length === 0) singlesInitialRating = Number(ratingNew) - change;
        singlesMatches.push({ date: r.match_date, ratingChange: change });
    }
    if (singlesMatches.length === 0) singlesInitialRating = fallbackSingles;

    const doublesMatches: Array<{ date: string; ratingChange: number }> = [];
    let doublesInitialRating = 0;
    for (const row of doublesRes.data ?? []) {
        const r = row as { match_date: string; player1_id: string; player2_id: string; player3_id: string; player4_id: string; p1_rating_old: number | null; p1_rating_new: number | null; p1_rating_change: number | null; p2_rating_old: number | null; p2_rating_new: number | null; p2_rating_change: number | null; p3_rating_old: number | null; p3_rating_new: number | null; p3_rating_change: number | null; p4_rating_old: number | null; p4_rating_new: number | null; p4_rating_change: number | null };
        let change = 0;
        let ratingBefore: number | null = null;
        let ratingNew = 0;
        if (playerIdSet.has(r.player1_id)) {
            change = Number(r.p1_rating_change ?? 0);
            ratingBefore = r.p1_rating_old;
            ratingNew = Number(r.p1_rating_new ?? 0);
        } else if (playerIdSet.has(r.player2_id)) {
            change = Number(r.p2_rating_change ?? 0);
            ratingBefore = r.p2_rating_old;
            ratingNew = Number(r.p2_rating_new ?? 0);
        } else if (playerIdSet.has(r.player3_id)) {
            change = Number(r.p3_rating_change ?? 0);
            ratingBefore = r.p3_rating_old;
            ratingNew = Number(r.p3_rating_new ?? 0);
        } else if (playerIdSet.has(r.player4_id)) {
            change = Number(r.p4_rating_change ?? 0);
            ratingBefore = r.p4_rating_old;
            ratingNew = Number(r.p4_rating_new ?? 0);
        }
        if (doublesMatches.length === 0 && ratingBefore != null) doublesInitialRating = Number(ratingBefore);
        else if (doublesMatches.length === 0) doublesInitialRating = Number(ratingNew) - change;
        doublesMatches.push({ date: r.match_date, ratingChange: change });
    }
    if (doublesMatches.length === 0) doublesInitialRating = fallbackDoubles;

    const singlesSeries = buildRatingSeriesFromMatches(cutoffStr, singlesInitialRating, singlesMatches);
    const doublesSeries = buildRatingSeriesFromMatches(cutoffStr, doublesInitialRating, doublesMatches);
    return {
        singles: { ...singlesSeries, matchCount: singlesMatches.length },
        doubles: { ...doublesSeries, matchCount: doublesMatches.length },
    };
}

export async function updatePlayerRatingsFromMatches(
    playerId: string,
    singlesRating: number,
    doublesRating: number,
    hasSinglesMatches: boolean,
    hasDoublesMatches: boolean
): Promise<void> {
    const updates: Record<string, number | null> = {};
    if (hasSinglesMatches) updates.singles_rating = Math.round(singlesRating);
    if (hasDoublesMatches) updates.doubles_rating = Math.round(doublesRating);
    if (Object.keys(updates).length === 0) return;
    if (hasSinglesMatches && hasDoublesMatches) {
        updates.combined_rating = Math.round((singlesRating + doublesRating) / 2);
        updates.rating = updates.combined_rating;
    } else if (hasSinglesMatches) {
        updates.rating = Math.round(singlesRating);
    } else if (hasDoublesMatches) {
        updates.rating = Math.round(doublesRating);
    }
    const { error } = await supabase
        .from("players")
        .update(updates)
        .or(`id.eq.${playerId},user_id.eq.${playerId}`);
    if (error) console.error("updatePlayerRatingsFromMatches:", error.message);
}

export interface GetMatchHistoryForClaimParams {
    search?: string;
    kingdom?: string;
}

function formatMatchHistoryDate(dateString: string): string {
    const date = new Date(dateString);
    const month = date.toLocaleDateString("en-US", { month: "long" });
    const day = date.getDate();
    const year = date.getFullYear();
    return `${month} ${day}, ${year}`;
}

export async function getMatchHistoryForClaim(
    params: GetMatchHistoryForClaimParams = {}
): Promise<Array<{
    rank: number;
    name: string;
    tournament: string;
    date: string;
    kingdom: string;
    club: string;
    myMatches: string;
    id: string;
}>> {
    const { search = "", kingdom = "" } = params;

    let query = supabase
        .from("match_history")
        .select("*")
        .order("date", { ascending: false });

    if (search) {
        const searchPattern = `%${search}%`;
        query = query.or(`player_name.ilike.${searchPattern},tournament_name.ilike.${searchPattern}`);
    }

    if (kingdom) {
        query = query.eq("kingdom", kingdom);
    }

    const { data, error } = await query;

    if (error) {
        console.error("Error fetching match history for claim:", error);
        return [];
    }

    return (
        data?.map((match, index) => ({
            rank: index + 1,
            name: match.player_name,
            tournament: match.tournament_name,
            date: formatMatchHistoryDate(match.date),
            kingdom: match.kingdom || "",
            club: match.club || "",
            myMatches: "This is me",
            id: match.id,
        })) || []
    );
}

