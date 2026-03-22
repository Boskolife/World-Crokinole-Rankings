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

export type TournamentRoundScorePair = [number, number];

export interface TournamentMatchResultPayload {
    player1Id: string;
    player2Id: string;
    player3Id?: string;
    player4Id?: string;
    setsP1: number;
    setsP2: number;
    roundScores: TournamentRoundScorePair[];
    twentiesP1: number;
    twentiesP2: number;
    totalP1: number;
    totalP2: number;
}

export type TournamentBracketResultsMap = Record<string, TournamentMatchResultPayload>;

export function buildTournamentMatchKey(
    stageIndex: number,
    roundIndex: number,
    matchIndex: number
): string {
    return `s${stageIndex}-r${roundIndex}-m${matchIndex}`;
}

