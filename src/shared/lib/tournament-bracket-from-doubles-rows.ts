import type {
    TournamentBracketResultsMap,
    TournamentMatchResultPayload,
    TournamentRoundScorePair,
} from "@/shared/types";

const emptyTournamentRounds: TournamentRoundScorePair[] = [
    [0, 0],
    [0, 0],
    [0, 0],
    [0, 0],
];

export type DoublesBracketRow = {
    bracket_match_key: string | null;
    player1_id: string;
    player2_id: string;
    player3_id: string;
    player4_id: string;
    points_won_team1: number | null;
    points_won_team2: number | null;
    match_detail: unknown;
};

export function buildTournamentBracketMapFromDoublesRows(
    rows: DoublesBracketRow[]
): TournamentBracketResultsMap {
    const num = (v: unknown, fb: number) => {
        const n = typeof v === "number" ? v : parseInt(String(v), 10);
        return Number.isFinite(n) ? n : fb;
    };

    const out: TournamentBracketResultsMap = {};
    for (const row of rows) {
        const key = row.bracket_match_key?.trim();
        if (!key) continue;

        const d = row.match_detail as Record<string, unknown> | null;
        let roundScores: TournamentRoundScorePair[] = emptyTournamentRounds.map(
            (p) => [p[0], p[1]] as TournamentRoundScorePair
        );
        if (d && Array.isArray(d.roundScores) && d.roundScores.length >= 4) {
            const rs = d.roundScores as unknown[];
            roundScores = [0, 1, 2, 3].map((i) => {
                const pair = rs[i];
                if (Array.isArray(pair) && pair.length >= 2) {
                    return [num(pair[0], 0), num(pair[1], 0)] as TournamentRoundScorePair;
                }
                return [0, 0] as TournamentRoundScorePair;
            });
        }

        const fb1 = row.points_won_team1 ?? 0;
        const fb2 = row.points_won_team2 ?? 0;
        out[key] = {
            player1Id: String(row.player1_id),
            player2Id: String(row.player2_id),
            player3Id: String(row.player3_id),
            player4Id: String(row.player4_id),
            setsP1: num(d?.setsP1, 0),
            setsP2: num(d?.setsP2, 0),
            roundScores,
            twentiesP1: num(d?.twentiesP1, 0),
            twentiesP2: num(d?.twentiesP2, 0),
            totalP1: num(d?.totalP1, fb1),
            totalP2: num(d?.totalP2, fb2),
        } satisfies TournamentMatchResultPayload;
    }
    return out;
}
