export interface IRankList {
    rank: number;
    name: string;
    playerId?: string | null;
    laurels: number;
    trend: string;
    wins: number;
    losses: number;
    ties: number;
    kingdom: string;
    club: string;
    trendUp: boolean;
}
