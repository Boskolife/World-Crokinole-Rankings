export interface IMatchHistory {
    id: string;
    tournamentName: string;
    playerName: string;
    score: number;
    place: number;
    date: string; // ISO date string or formatted date
    tournamentPageUrl: string;
}

export interface IMatchHistoryForClaim {
    rank: number;
    name: string;
    tournament: string;
    date: string;
    kingdom: string;
    club: string;
    myMatches: string;
    id: string;
}