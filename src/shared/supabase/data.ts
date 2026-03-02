import { supabase } from "./client";
import type {
    IEventCardProps,
    QualifyingHeatsData,
    IPlayer,
    IClub,
    ITournament,
    IRankList,
    IMatchHistory,
} from "@/shared/types";

function formatEventDate(startDate: string, endDate: string): string {
    const start = new Date(startDate);
    const end = new Date(endDate);
    
    const startMonth = start.toLocaleDateString("en-US", { month: "short" });
    const startDay = start.getDate();
    const startTime = start.toLocaleTimeString("en-US", { 
        hour: "numeric", 
        minute: "2-digit",
        hour12: true 
    });
    
    const endMonth = end.toLocaleDateString("en-US", { month: "short" });
    const endDay = end.getDate();
    const endTime = end.toLocaleTimeString("en-US", { 
        hour: "numeric", 
        minute: "2-digit",
        hour12: true 
    });
    
    if (startMonth === endMonth && startDay === endDay) {
        return `${startMonth} ${startDay}, ${startTime} - ${endTime}`;
    }
    
    return `${startMonth} ${startDay}, ${startTime} - ${endMonth} ${endDay}, ${endTime}`;
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

    return (data?.map((e) => mapEventRowToCard(e)) ?? []);
}

const mapEventRowToCard = (event: {
    id: number;
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
    capacity?: number | null;
    strength_of_field?: number | null;
    tournament_points_available?: number | null;
    structure?: string | null;
    latitude?: number | null;
    longitude?: number | null;
    qualifying_heats?: QualifyingHeatsData | null;
}): IEventCardProps => {
    const totalParticipants = event.total_participants ?? event.capacity ?? undefined;
    const currentRank = totalParticipants != null ? (event.current_rank ?? 0) : (event.current_rank ?? undefined);
    return {
    id: event.id,
    image: event.image || "",
    title: event.title,
    price: event.price,
    date: event.start_date && event.end_date
        ? formatEventDate(event.start_date, event.end_date)
        : "",
    location: event.location,
    format: event.format,
    isRanked: event.is_ranked,
    isRegistrationRequired: event.is_registration_required,
    winner: event.winner || undefined,
    currentRank,
    totalParticipants,
    startDate: event.start_date || undefined,
    strengthOfField: event.strength_of_field ?? undefined,
    tournamentPointsAvailable: event.tournament_points_available ?? undefined,
    structure: event.structure ?? undefined,
    latitude: event.latitude ?? undefined,
    longitude: event.longitude ?? undefined,
    qualifyingHeats: event.qualifying_heats ?? undefined,
};
};

export async function getEventById(id: number): Promise<IEventCardProps | null> {
    const { data, error } = await supabase
        .from("events")
        .select("*")
        .eq("id", id)
        .single();

    if (error || !data) return null;
    return mapEventRowToCard(data);
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

    return (data?.map((e) => mapEventRowToCard(e)) ?? []);
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

    return (data?.map((e) => mapEventRowToCard(e)) ?? []);
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

    return (data?.map((e) => mapEventRowToCard(e)) ?? []);
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
    qualifyingHeats?: QualifyingHeatsData | null;
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
        qualifyingHeats,
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
            qualifying_heats: qualifyingHeats ?? null,
            image: null,
            winner: null,
            current_rank: 0,
            total_participants: capacity ?? null,
            strength_of_field: null,
            tournament_points_available: null,
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

export async function getPlayers(): Promise<IPlayer[]> {
    const { data, error } = await supabase
        .from("players")
        .select("*")
        .not("user_id", "is", null)
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

export async function getPlayerById(id: string): Promise<IPlayer | null> {
    const { data, error } = await supabase
        .from("players")
        .select("*, profiles(avatar_url)")
        .eq("user_id", id)
        .maybeSingle();

    if (error || !data) return null;

    const profile = data.profiles as { avatar_url?: string | null } | null;
    const avatarUrl = profile?.avatar_url ?? null;

    return {
        id: String(data.user_id ?? data.id),
        name: data.name,
        countryCode: data.country_code,
        kingdom: data.kingdom,
        club: data.club,
        rating: data.rating,
        avatarUrl: avatarUrl?.trim() || null,
    };
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
        .select("*", { count: "exact" })
        .not("user_id", "is", null);

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

export async function getUniqueKingdoms(): Promise<
    Array<{ value: string; label: string }>
> {
    const { data, error } = await supabase
        .from("players")
        .select("kingdom")
        .not("user_id", "is", null)
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
        .not("user_id", "is", null)
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

        return playersData.map((p: { user_id?: string; name: string; country_code: string; kingdom: string; club: string; rating: number; profiles?: { avatar_url?: string | null } | null }) => {
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
        .not("user_id", "is", null)
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
        .order("rank", { ascending: true });

    if (error) {
        console.error("Error fetching rankings:", error);
        return [];
    }

    return (
        data?.map((ranking) => ({
            rank: ranking.rank,
            name: ranking.name,
            laurels: ranking.laurels,
            trend: ranking.trend,
            trendUp: ranking.trend_up,
            wins: ranking.wins,
            losses: ranking.losses,
            ties: ranking.ties,
            kingdom: ranking.kingdom,
            club: ranking.club,
        })) || []
    );
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

