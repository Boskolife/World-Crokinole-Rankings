import type { TournamentBracketResultsMap, TournamentMatchResultPayload } from "@/shared/types";
import { buildTournamentMatchKey } from "@/shared/types";

const MATCH_KEY_RE = /^s(\d+)-r(\d+)-m(\d+)$/;

export function parseTournamentMatchKey(
    key: string
): { stageIndex: number; roundIndex: number; matchIndex: number } | null {
    const m = key.trim().match(MATCH_KEY_RE);
    if (!m) return null;
    return {
        stageIndex: Number(m[1]),
        roundIndex: Number(m[2]),
        matchIndex: Number(m[3]),
    };
}

export function getBracketRoundsAndSize(
    isDoubles: boolean,
    totalParticipants: number | null | undefined,
    playerCount: number
): { rounds: number; size: number } {
    if (isDoubles) {
        let teamCount = Math.floor((totalParticipants ?? playerCount) / 2);
        if (teamCount < 1) teamCount = Math.max(1, Math.floor(playerCount / 2));
        if (teamCount < 1) teamCount = 1;
        let size = 4;
        if (teamCount > 0) {
            size = Math.max(4, Math.min(32, 2 ** Math.ceil(Math.log2(teamCount))));
        }
        const rounds = Math.max(1, Math.ceil(Math.log2(size)));
        return { rounds, size };
    }
    let size = 8;
    const n = totalParticipants ?? playerCount;
    if (n > 0) {
        size = Math.max(4, Math.min(32, 2 ** Math.ceil(Math.log2(n))));
    }
    const rounds = Math.max(1, Math.ceil(Math.log2(size)));
    return { rounds, size };
}

function emptyMatchPayload(): TournamentMatchResultPayload {
    return {
        player1Id: "",
        player2Id: "",
        setsP1: 0,
        setsP2: 0,
        roundScores: [
            [0, 0],
            [0, 0],
            [0, 0],
            [0, 0],
        ],
        twentiesP1: 0,
        twentiesP2: 0,
        totalP1: 0,
        totalP2: 0,
    };
}

function clonePayload(p: TournamentMatchResultPayload): TournamentMatchResultPayload {
    return {
        ...p,
        roundScores: p.roundScores.map((row) => [row[0], row[1]] as [number, number]),
    };
}

function mergeWinnerIntoParent(
    prev: TournamentMatchResultPayload | undefined,
    slotUpper: boolean,
    childPayload: TournamentMatchResultPayload,
    isDoubles: boolean,
    upperWins: boolean
): TournamentMatchResultPayload {
    const base = prev ? clonePayload(prev) : emptyMatchPayload();
    if (isDoubles) {
        const p3 = childPayload.player3Id;
        const p4 = childPayload.player4Id;
        if (!p3 || !p4) return base;
        const w: [string, string] = upperWins
            ? [childPayload.player1Id, childPayload.player2Id]
            : [p3, p4];
        if (slotUpper) {
            base.player1Id = w[0];
            base.player2Id = w[1];
        } else {
            base.player3Id = w[0];
            base.player4Id = w[1];
        }
        return base;
    }
    const wid = upperWins ? childPayload.player1Id : childPayload.player2Id;
    if (!wid) return base;
    if (slotUpper) base.player1Id = wid;
    else base.player2Id = wid;
    return base;
}

function lineupComplete(p: TournamentMatchResultPayload, isDoubles: boolean): boolean {
    if (isDoubles) {
        return Boolean(
            p.player1Id?.trim() &&
                p.player2Id?.trim() &&
                p.player3Id?.trim() &&
                p.player4Id?.trim()
        );
    }
    return Boolean(p.player1Id?.trim() && p.player2Id?.trim());
}

function hasWinner(p: TournamentMatchResultPayload): boolean {
    return Number(p.setsP1 ?? 0) !== Number(p.setsP2 ?? 0);
}

export function applyWinnerAdvancementToBracketMap(
    map: TournamentBracketResultsMap,
    matchKey: string,
    payload: TournamentMatchResultPayload,
    rounds: number,
    isDoubles: boolean
): TournamentBracketResultsMap {
    const parsed = parseTournamentMatchKey(matchKey);
    const out: TournamentBracketResultsMap = { ...map, [matchKey]: clonePayload(payload) };
    if (!parsed) return out;
    if (!hasWinner(payload)) return out;

    let upperWins = Number(payload.setsP1 ?? 0) > Number(payload.setsP2 ?? 0);
    let curKey = matchKey;
    let curPayload = clonePayload(payload);

    while (true) {
        const cur = parseTournamentMatchKey(curKey);
        if (!cur || cur.roundIndex >= rounds - 1) break;

        const parentRound = cur.roundIndex + 1;
        const parentMatch = Math.floor(cur.matchIndex / 2);
        const slotUpper = cur.matchIndex % 2 === 0;
        const parentKey = buildTournamentMatchKey(cur.stageIndex, parentRound, parentMatch);
        const prevParent = out[parentKey];
        const merged = mergeWinnerIntoParent(prevParent, slotUpper, curPayload, isDoubles, upperWins);
        out[parentKey] = merged;

        curKey = parentKey;
        curPayload = merged;

        if (!lineupComplete(merged, isDoubles) || !hasWinner(merged)) break;
        upperWins = Number(merged.setsP1 ?? 0) > Number(merged.setsP2 ?? 0);
    }

    return out;
}
