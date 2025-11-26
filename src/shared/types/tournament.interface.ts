export interface ITournament {
    id: string;
    name: string;
    laurels: number;
    strengthOfField: number;
    wins: number;
    loses: number;
    ties: number;
    place: number;
    date: string; // ISO date string or formatted date
    tournamentPageUrl: string;
}

