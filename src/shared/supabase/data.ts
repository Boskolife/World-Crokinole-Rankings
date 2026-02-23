import { supabase } from "./client";
import type {
    IEventCardProps,
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
    strength_of_field?: number | null;
    tournament_points_available?: number | null;
    structure?: string | null;
}): IEventCardProps => ({
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
    currentRank: event.current_rank ?? undefined,
    totalParticipants: event.total_participants ?? undefined,
    startDate: event.start_date || undefined,
    strengthOfField: event.strength_of_field ?? undefined,
    tournamentPointsAvailable: event.tournament_points_available ?? undefined,
    structure: event.structure ?? undefined,
});

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

export interface IClubMember {
    name: string;
    laurels: number;
    singlesRating: number;
    doublesRating: number;
}

export async function getClubMembers(
    clubTitle: string,
    clubId?: number
): Promise<IClubMember[]> {
    const { data, error } = await supabase
        .from("players")
        .select("name, rating")
        .eq("club", clubTitle);

    const fromClub = (data ?? []).map((p) => ({
        name: p.name ?? "",
        laurels: 0,
        singlesRating: p.rating ?? 0,
        doublesRating: 0,
    }));

    const namesInList = new Set(fromClub.map((m) => m.name));

    if (clubId != null) {
        const { data: adminRows } = await supabase
            .from("club_admins")
            .select("user_id")
            .eq("club_id", clubId);

        if (adminRows?.length) {
            const userIds = adminRows.map((r) => r.user_id);
            const { data: adminPlayers } = await supabase
                .from("players")
                .select("name, rating")
                .in("user_id", userIds);

            for (const p of adminPlayers ?? []) {
                const name = p.name ?? "—";
                if (!namesInList.has(name)) {
                    namesInList.add(name);
                    fromClub.push({
                        name,
                        laurels: 0,
                        singlesRating: p.rating ?? 0,
                        doublesRating: 0,
                    });
                }
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
}

export async function getClubAdmins(clubId: number): Promise<IClubAdmin[]> {
    const { data, error } = await supabase
        .from("club_admins")
        .select("user_id")
        .eq("club_id", clubId);

    if (error || !data?.length) return [];

    const userIds = data.map((r) => r.user_id);
    const { data: players } = await supabase
        .from("players")
        .select("id, name, country_code, user_id")
        .in("user_id", userIds);

    const byUserId = new Map(
        (players ?? []).map((p) => [p.user_id, p])
    );

    return userIds.map((uid) => {
        const p = byUserId.get(uid);
        return {
            id: p?.id ?? uid,
            fullName: p?.name ?? "—",
            country: p?.country_code ?? null,
            userId: uid,
        };
    });
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
        .insert({ club_id: clubId, user_id: userId });

    if (adminError) {
        throw new Error(adminError.message);
    }

    await supabase
        .from("players")
        .update({ club: title.trim() })
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

