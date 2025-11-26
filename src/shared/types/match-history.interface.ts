export interface IMatchHistory {
    id: string;
    tournamentName: string;
    playerName: string;
    score: number;
    place: number;
    date: string; // ISO date string or formatted date
    tournamentPageUrl: string;
}

