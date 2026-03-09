export interface IPlayer {
    id: string;
    rowId?: string;
    name: string;
    countryCode: string;
    kingdom: string;
    club: string;
    rating: number;
    avatarUrl?: string | null;
    singlesRating?: number | null;
    doublesRating?: number | null;
    combinedRating?: number | null;
    singlesWon?: number | null;
    singlesPlayed?: number | null;
    winPctSingles?: string | null;
    doublesWon?: number | null;
    doublesPlayed?: number | null;
    winPctDoubles?: string | null;
    totalWon?: number | null;
    totalPlayed?: number | null;
    winPctTotal?: string | null;
    title?: string | null;
    clubTitle?: string | null;
    fullNameWithTitles?: string | null;
    gender?: string | null;
    playerIdentifier?: string | null;
}

