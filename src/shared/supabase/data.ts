import { supabase } from "./client";
import type {
    IEventCardProps,
    IPlayer,
    IClub,
    ITournament,
    IRankList,
    IMatchHistory,
} from "@/shared/types";

export async function getEvents(): Promise<IEventCardProps[]> {
    const { data, error } = await supabase
        .from("events")
        .select("*")
        .order("id", { ascending: true });

    if (error) {
        console.error("Error fetching events:", error);
        return [];
    }

    return (
        data?.map((event) => ({
            id: event.id,
            image: event.image || "",
            title: event.title,
            price: event.price,
            date: event.date,
            location: event.location,
            format: event.format,
            isRanked: event.is_ranked,
            isRegistrationRequired: event.is_registration_required,
            winner: event.winner,
        })) || []
    );
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
            id: player.id,
            name: player.name,
            countryCode: player.country_code,
            kingdom: player.kingdom,
            club: player.club,
            rating: player.rating,
        })) || []
    );
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

