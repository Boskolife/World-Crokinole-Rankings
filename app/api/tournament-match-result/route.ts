import { NextResponse } from "next/server";
import { createClient } from "@/shared/supabase/server";
import { createClient as createServiceClient, type SupabaseClient } from "@supabase/supabase-js";
import type {
    TournamentBracketResultsMap,
    TournamentMatchResultPayload,
} from "@/shared/types";

type Body = {
    eventId: number;
    matchKey: string;
    player1Id: string;
    player2Id: string;
    player3Id?: string;
    player4Id?: string;
    isDoubles?: boolean;
    setsP1: number;
    setsP2: number;
    roundScores: [number, number][];
    twentiesP1: number;
    twentiesP2: number;
    totalP1: number;
    totalP2: number;
};

function clampInt(n: unknown, fallback = 0): number {
    const x = typeof n === "number" ? n : parseInt(String(n), 10);
    if (Number.isNaN(x) || x < 0) return fallback;
    return Math.min(x, 99999);
}

function eloDelta(r1: number, r2: number, setsA: number, setsB: number): { d1: number; d2: number } {
    const K = 32;
    let actual1 = 0.5;
    if (setsA > setsB) actual1 = 1;
    else if (setsA < setsB) actual1 = 0;
    const e1 = 1 / (1 + Math.pow(10, (r2 - r1) / 400));
    const d1 = Math.round(K * (actual1 - e1) * 100) / 100;
    return { d1, d2: Math.round(-d1 * 100) / 100 };
}

type PlayerRatingRow = {
    id: string;
    rating?: number | null;
    singles_rating?: number | null;
    doubles_rating?: number | null;
    singles_won?: number | null;
    singles_played?: number | null;
    doubles_won?: number | null;
    doubles_played?: number | null;
    total_won?: number | null;
    total_played?: number | null;
};

type SinglesStatDelta = { sp: number; sw: number; tp: number; tw: number };

function singlesMatchStatContribution(
    winner: "P1" | "P2" | "TIE",
    slot: "p1" | "p2"
): SinglesStatDelta {
    const out: SinglesStatDelta = { sp: 1, sw: 0, tp: 1, tw: 0 };
    if (winner === "P1" && slot === "p1") {
        out.sw = 1;
        out.tw = 1;
    } else if (winner === "P2" && slot === "p2") {
        out.sw = 1;
        out.tw = 1;
    }
    return out;
}

function negateStatDelta(d: SinglesStatDelta): SinglesStatDelta {
    return { sp: -d.sp, sw: -d.sw, tp: -d.tp, tw: -d.tw };
}

function addStatDeltaToMap(map: Map<string, SinglesStatDelta>, playerRowId: string, d: SinglesStatDelta) {
    if (!playerRowId) return;
    const cur = map.get(playerRowId) ?? { sp: 0, sw: 0, tp: 0, tw: 0 };
    cur.sp += d.sp;
    cur.sw += d.sw;
    cur.tp += d.tp;
    cur.tw += d.tw;
    map.set(playerRowId, cur);
}

type DoublesStatDelta = { dp: number; dw: number; tp: number; tw: number };

function doublesMatchStatContribution(
    winner: "T1" | "T2" | "TIE",
    slot: "t1a" | "t1b" | "t2a" | "t2b"
): DoublesStatDelta {
    const out: DoublesStatDelta = { dp: 1, dw: 0, tp: 1, tw: 0 };
    if (winner === "T1" && (slot === "t1a" || slot === "t1b")) {
        out.dw = 1;
        out.tw = 1;
    } else if (winner === "T2" && (slot === "t2a" || slot === "t2b")) {
        out.dw = 1;
        out.tw = 1;
    }
    return out;
}

function negateDoublesStatDelta(d: DoublesStatDelta): DoublesStatDelta {
    return { dp: -d.dp, dw: -d.dw, tp: -d.tp, tw: -d.tw };
}

function addDoublesStatDeltaToMap(
    map: Map<string, DoublesStatDelta>,
    playerRowId: string,
    d: DoublesStatDelta
) {
    if (!playerRowId) return;
    const cur = map.get(playerRowId) ?? { dp: 0, dw: 0, tp: 0, tw: 0 };
    cur.dp += d.dp;
    cur.dw += d.dw;
    cur.tp += d.tp;
    cur.tw += d.tw;
    map.set(playerRowId, cur);
}

function formatWinPct(won: number, played: number): string {
    if (played <= 0) return "0%";
    const pct = (won / played) * 100;
    const rounded = Math.round(pct * 10) / 10;
    const s = rounded % 1 === 0 ? String(rounded) : rounded.toFixed(1);
    return `${s}%`;
}

function roundStoredRating(n: number): number {
    const x = Math.round(Number(n));
    return Number.isFinite(x) ? x : 1500;
}

async function updatePlayerBracketRatings(
    admin: SupabaseClient,
    playerRowId: string,
    newRating: number
): Promise<{ error: { message: string; code?: string } | null }> {
    const r = roundStoredRating(newRating);
    let { error } = await admin
        .from("players")
        .update({ rating: r, singles_rating: r })
        .eq("id", playerRowId);
    if (error) {
        const msg = (error.message ?? "").toLowerCase();
        const code = (error as { code?: string }).code;
        const noSinglesCol =
            code === "42703" ||
            code === "PGRST204" ||
            msg.includes("singles_rating") ||
            (msg.includes("column") && (msg.includes("does not exist") || msg.includes("unknown")));
        if (noSinglesCol) {
            ({ error } = await admin.from("players").update({ rating: r }).eq("id", playerRowId));
        }
    }
    return { error };
}

async function patchPlayerRowAfterBracketMatch(
    admin: SupabaseClient,
    playerRowId: string,
    patch: {
        rating: number;
        singles_won: number;
        singles_played: number;
        total_won: number;
        total_played: number;
        win_pct_singles: string;
        win_pct_total: string;
    }
): Promise<{ error: { message: string; code?: string } | null }> {
    const r = roundStoredRating(patch.rating);
    const full = {
        rating: r,
        singles_rating: r,
        singles_won: patch.singles_won,
        singles_played: patch.singles_played,
        total_won: patch.total_won,
        total_played: patch.total_played,
        win_pct_singles: patch.win_pct_singles,
        win_pct_total: patch.win_pct_total,
    };
    let { error } = await admin.from("players").update(full).eq("id", playerRowId);
    if (error) {
        const msg = (error.message ?? "").toLowerCase();
        if (msg.includes("win_pct")) {
            const noPct = {
                rating: r,
                singles_rating: r,
                singles_won: patch.singles_won,
                singles_played: patch.singles_played,
                total_won: patch.total_won,
                total_played: patch.total_played,
            };
            ({ error } = await admin.from("players").update(noPct).eq("id", playerRowId));
        }
    }
    if (error) {
        const msg = (error.message ?? "").toLowerCase();
        const code = (error as { code?: string }).code;
        const statsMissing =
            code === "42703" ||
            code === "PGRST204" ||
            msg.includes("singles_won") ||
            msg.includes("singles_played") ||
            msg.includes("total_won") ||
            msg.includes("total_played");
        if (statsMissing) {
            return updatePlayerBracketRatings(admin, playerRowId, patch.rating);
        }
    }
    return { error };
}

async function patchPlayerStatsOnlyAfterBracket(
    admin: SupabaseClient,
    playerRowId: string,
    patch: {
        singles_won: number;
        singles_played: number;
        total_won: number;
        total_played: number;
        win_pct_singles: string;
        win_pct_total: string;
    }
): Promise<{ error: { message: string; code?: string } | null }> {
    const full = {
        singles_won: patch.singles_won,
        singles_played: patch.singles_played,
        total_won: patch.total_won,
        total_played: patch.total_played,
        win_pct_singles: patch.win_pct_singles,
        win_pct_total: patch.win_pct_total,
    };
    let { error } = await admin.from("players").update(full).eq("id", playerRowId);
    if (error) {
        const msg = (error.message ?? "").toLowerCase();
        if (msg.includes("win_pct")) {
            const noPct = {
                singles_won: patch.singles_won,
                singles_played: patch.singles_played,
                total_won: patch.total_won,
                total_played: patch.total_played,
            };
            ({ error } = await admin.from("players").update(noPct).eq("id", playerRowId));
        }
    }
    if (error) {
        const msg = (error.message ?? "").toLowerCase();
        const code = (error as { code?: string }).code;
        if (
            code === "42703" ||
            code === "PGRST204" ||
            msg.includes("singles_won") ||
            msg.includes("singles_played")
        ) {
            return { error: null };
        }
    }
    return { error };
}

async function updatePlayerDoublesBracketRatings(
    admin: SupabaseClient,
    playerRowId: string,
    newRating: number
): Promise<{ error: { message: string; code?: string } | null }> {
    const r = roundStoredRating(newRating);
    let { error } = await admin
        .from("players")
        .update({ doubles_rating: r })
        .eq("id", playerRowId);
    if (error) {
        const msg = (error.message ?? "").toLowerCase();
        const code = (error as { code?: string }).code;
        const noDoublesCol =
            code === "42703" ||
            code === "PGRST204" ||
            msg.includes("doubles_rating") ||
            (msg.includes("column") && (msg.includes("does not exist") || msg.includes("unknown")));
        if (noDoublesCol) {
            ({ error } = await admin.from("players").update({ rating: r }).eq("id", playerRowId));
        }
    }
    return { error };
}

async function patchPlayerRowAfterBracketDoublesMatch(
    admin: SupabaseClient,
    playerRowId: string,
    patch: {
        doubles_rating: number;
        doubles_won: number;
        doubles_played: number;
        total_won: number;
        total_played: number;
        win_pct_doubles: string;
        win_pct_total: string;
    }
): Promise<{ error: { message: string; code?: string } | null }> {
    const r = roundStoredRating(patch.doubles_rating);
    const full = {
        doubles_rating: r,
        doubles_won: patch.doubles_won,
        doubles_played: patch.doubles_played,
        total_won: patch.total_won,
        total_played: patch.total_played,
        win_pct_doubles: patch.win_pct_doubles,
        win_pct_total: patch.win_pct_total,
    };
    let { error } = await admin.from("players").update(full).eq("id", playerRowId);
    if (error) {
        const msg = (error.message ?? "").toLowerCase();
        if (msg.includes("win_pct")) {
            const noPct = {
                doubles_rating: r,
                doubles_won: patch.doubles_won,
                doubles_played: patch.doubles_played,
                total_won: patch.total_won,
                total_played: patch.total_played,
            };
            ({ error } = await admin.from("players").update(noPct).eq("id", playerRowId));
        }
    }
    if (error) {
        const msg = (error.message ?? "").toLowerCase();
        const code = (error as { code?: string }).code;
        const statsMissing =
            code === "42703" ||
            code === "PGRST204" ||
            msg.includes("doubles_won") ||
            msg.includes("doubles_played") ||
            msg.includes("total_won") ||
            msg.includes("total_played");
        if (statsMissing) {
            return updatePlayerDoublesBracketRatings(admin, playerRowId, patch.doubles_rating);
        }
    }
    return { error };
}

async function fetchPlayerByIdOrUserId(
    admin: SupabaseClient,
    incoming: string
): Promise<PlayerRatingRow | null> {
    const { data: byPk } = await admin
        .from("players")
        .select(
            "id, rating, singles_rating, doubles_rating, singles_won, singles_played, doubles_won, doubles_played, total_won, total_played"
        )
        .eq("id", incoming)
        .maybeSingle();
    const rowByPk = byPk as PlayerRatingRow | null;
    if (rowByPk?.id) {
        return rowByPk;
    }
    const { data: byUser } = await admin
        .from("players")
        .select(
            "id, rating, singles_rating, doubles_rating, singles_won, singles_played, doubles_won, doubles_played, total_won, total_played"
        )
        .eq("user_id", incoming)
        .maybeSingle();
    const rowByUser = byUser as PlayerRatingRow | null;
    return rowByUser?.id ? rowByUser : null;
}

function buildPayload(
    p1: string,
    p2: string,
    setsP1: number,
    setsP2: number,
    normalizedRounds: [number, number][],
    twentiesP1: number,
    twentiesP2: number,
    totalP1: number,
    totalP2: number,
    p3?: string,
    p4?: string
): TournamentMatchResultPayload {
    const base: TournamentMatchResultPayload = {
        player1Id: p1,
        player2Id: p2,
        setsP1,
        setsP2,
        roundScores: normalizedRounds,
        twentiesP1,
        twentiesP2,
        totalP1,
        totalP2,
    };
    if (p3 && p4) {
        base.player3Id = p3;
        base.player4Id = p4;
    }
    return base;
}

export async function POST(request: Request) {
    const supabase = await createClient();
    const {
        data: { user },
    } = await supabase.auth.getUser();
    if (!user?.id) {
        return NextResponse.json({ error: "Unauthorized" }, { status: 401 });
    }

    const serviceKey = process.env.SUPABASE_SERVICE_ROLE_KEY;
    if (!serviceKey) {
        return NextResponse.json({ error: "Server configuration error" }, { status: 500 });
    }

    const admin = createServiceClient(process.env.NEXT_PUBLIC_SUPABASE_URL!, serviceKey);

    let body: Body;
    try {
        body = (await request.json()) as Body;
    } catch {
        return NextResponse.json({ error: "Invalid JSON" }, { status: 400 });
    }

    const eventId = clampInt(body.eventId, -1);
    if (eventId < 1 || !body.matchKey?.trim()) {
        return NextResponse.json({ error: "Invalid event or match key" }, { status: 400 });
    }

    const isDoubles = Boolean(body.isDoubles);
    const p1 = String(body.player1Id ?? "").trim();
    const p2 = String(body.player2Id ?? "").trim();
    const p3 = String(body.player3Id ?? "").trim();
    const p4 = String(body.player4Id ?? "").trim();
    if (!p1 || !p2 || p1 === p2) {
        return NextResponse.json({ error: "Invalid players" }, { status: 400 });
    }
    if (isDoubles) {
        if (!p3 || !p4 || new Set([p1, p2, p3, p4]).size !== 4) {
            return NextResponse.json({ error: "Invalid players" }, { status: 400 });
        }
    }

    const roundScores = Array.isArray(body.roundScores) ? body.roundScores : [];
    const normalizedRounds: [number, number][] = [];
    for (let i = 0; i < 4; i++) {
        const pair = roundScores[i];
        if (Array.isArray(pair) && pair.length >= 2) {
            normalizedRounds.push([clampInt(pair[0]), clampInt(pair[1])]);
        } else {
            normalizedRounds.push([0, 0]);
        }
    }

    const setsP1 = clampInt(body.setsP1);
    const setsP2 = clampInt(body.setsP2);
    const twentiesP1 = clampInt(body.twentiesP1);
    const twentiesP2 = clampInt(body.twentiesP2);
    const totalP1 = clampInt(body.totalP1);
    const totalP2 = clampInt(body.totalP2);

    const { data: eventRow, error: evErr } = await admin
        .from("events")
        .select("id, created_by, is_ranked, start_date, tournament_bracket_results")
        .eq("id", eventId)
        .maybeSingle();

    if (evErr || !eventRow) {
        return NextResponse.json({ error: "Event not found" }, { status: 404 });
    }

    const createdBy = (eventRow as { created_by?: string | null }).created_by;
    if (createdBy !== user.id) {
        return NextResponse.json({ error: "Forbidden" }, { status: 403 });
    }

    const isRanked = Boolean((eventRow as { is_ranked?: boolean }).is_ranked);
    const startDate = (eventRow as { start_date?: string | null }).start_date;
    const matchDate =
        startDate && String(startDate).length >= 10
            ? String(startDate).slice(0, 10)
            : new Date().toISOString().slice(0, 10);

    const payload = buildPayload(
        p1,
        p2,
        setsP1,
        setsP2,
        normalizedRounds,
        twentiesP1,
        twentiesP2,
        totalP1,
        totalP2,
        isDoubles ? p3 : undefined,
        isDoubles ? p4 : undefined
    );

    if (isRanked) {
        if (isDoubles) {
            const { data: existingDoubles } = await admin
                .from("doubles")
                .select(
                    "id, player1_id, player2_id, player3_id, player4_id, p1_rating_change, p2_rating_change, p3_rating_change, p4_rating_change, winner"
                )
                .eq("event_id", eventId)
                .eq("bracket_match_key", body.matchKey)
                .maybeSingle();

            const existingDblId =
                existingDoubles?.id != null ? Number(existingDoubles.id) : null;

            if (existingDblId != null && Number.isFinite(existingDblId)) {
                const prev = existingDoubles as {
                    player1_id?: string | null;
                    player2_id?: string | null;
                    player3_id?: string | null;
                    player4_id?: string | null;
                    p1_rating_change?: number | null;
                    p2_rating_change?: number | null;
                    p3_rating_change?: number | null;
                    p4_rating_change?: number | null;
                };
                const revertList: [string, number][] = [
                    [String(prev.player1_id ?? ""), Number(prev.p1_rating_change ?? 0)],
                    [String(prev.player2_id ?? ""), Number(prev.p2_rating_change ?? 0)],
                    [String(prev.player3_id ?? ""), Number(prev.p3_rating_change ?? 0)],
                    [String(prev.player4_id ?? ""), Number(prev.p4_rating_change ?? 0)],
                ];
                for (const [pid, delta] of revertList) {
                    if (!pid) continue;
                    const { data: prow } = await admin
                        .from("players")
                        .select("rating, doubles_rating")
                        .eq("id", pid)
                        .maybeSingle();
                    if (!prow) continue;
                    const pr = prow as { rating?: number | null; doubles_rating?: number | null };
                    let r = Number(pr.doubles_rating ?? pr.rating ?? 1500);
                    if (Number.isNaN(r)) r = 1500;
                    const nextR = roundStoredRating(r - delta);
                    const { error: revErr } = await updatePlayerDoublesBracketRatings(
                        admin,
                        pid,
                        nextR
                    );
                    if (revErr) {
                        console.error("revert doubles rating", revErr.message);
                        return NextResponse.json(
                            { error: "Failed to adjust ratings" },
                            { status: 500 }
                        );
                    }
                }
            }

            const rowP1 = await fetchPlayerByIdOrUserId(admin, p1);
            const rowP2 = await fetchPlayerByIdOrUserId(admin, p2);
            const rowP3 = await fetchPlayerByIdOrUserId(admin, p3);
            const rowP4 = await fetchPlayerByIdOrUserId(admin, p4);

            if (!rowP1?.id || !rowP2?.id || !rowP3?.id || !rowP4?.id) {
                return NextResponse.json({ error: "Player not found" }, { status: 400 });
            }

            const id1 = String(rowP1.id);
            const id2 = String(rowP2.id);
            const id3 = String(rowP3.id);
            const id4 = String(rowP4.id);

            let rt1 = Number(rowP1.doubles_rating ?? rowP1.rating ?? 1500);
            let rt2 = Number(rowP2.doubles_rating ?? rowP2.rating ?? 1500);
            let rt3 = Number(rowP3.doubles_rating ?? rowP3.rating ?? 1500);
            let rt4 = Number(rowP4.doubles_rating ?? rowP4.rating ?? 1500);
            if (Number.isNaN(rt1)) rt1 = 1500;
            if (Number.isNaN(rt2)) rt2 = 1500;
            if (Number.isNaN(rt3)) rt3 = 1500;
            if (Number.isNaN(rt4)) rt4 = 1500;

            const avgT1 = (rt1 + rt2) / 2;
            const avgT2 = (rt3 + rt4) / 2;
            const { d1, d2 } = eloDelta(avgT1, avgT2, setsP1, setsP2);
            const newRT1 = rt1 + d1;
            const newRT2 = rt2 + d1;
            const newRT3 = rt3 + d2;
            const newRT4 = rt4 + d2;

            let winnerD: "T1" | "T2" | "TIE" = "TIE";
            if (setsP1 > setsP2) winnerD = "T1";
            else if (setsP2 > setsP1) winnerD = "T2";

            let hashD = 0;
            for (let i = 0; i < body.matchKey.length; i++) {
                hashD = (hashD * 31 + body.matchKey.charCodeAt(i)) >>> 0;
            }
            const matchNumberD = (eventId * 1_000_003 + hashD) % 2_000_000_000;

            const matchDetailD = {
                setsP1,
                setsP2,
                roundScores: normalizedRounds,
                twentiesP1,
                twentiesP2,
                totalP1,
                totalP2,
            };

            const doublesPayload = {
                match_number: matchNumberD,
                match_date: matchDate,
                player1_id: id1,
                player2_id: id2,
                player3_id: id3,
                player4_id: id4,
                points_won_team1: totalP1,
                points_won_team2: totalP2,
                rounds: 4,
                winner: winnerD,
                p1_rating_old: rt1,
                p1_rating_change: d1,
                p1_rating_new: newRT1,
                p2_rating_old: rt2,
                p2_rating_change: d1,
                p2_rating_new: newRT2,
                p3_rating_old: rt3,
                p3_rating_change: d2,
                p3_rating_new: newRT3,
                p4_rating_old: rt4,
                p4_rating_change: d2,
                p4_rating_new: newRT4,
                event_id: eventId,
                bracket_match_key: body.matchKey,
                match_detail: matchDetailD,
            };

            if (existingDblId != null && Number.isFinite(existingDblId)) {
                const { error: upD } = await admin
                    .from("doubles")
                    .update(doublesPayload)
                    .eq("id", existingDblId);
                if (upD) {
                    console.error("doubles update", upD.message);
                    return NextResponse.json(
                        { error: "Failed to update match record" },
                        { status: 500 }
                    );
                }
            } else {
                const { error: insD } = await admin.from("doubles").insert(doublesPayload);
                if (insD) {
                    console.error("doubles insert", insD.message);
                    return NextResponse.json(
                        { error: "Failed to save match record" },
                        { status: 500 }
                    );
                }
            }

            const statAdjustmentsD = new Map<string, DoublesStatDelta>();
            if (existingDblId != null && Number.isFinite(existingDblId)) {
                const prevRow = existingDoubles as {
                    player1_id?: string | null;
                    player2_id?: string | null;
                    player3_id?: string | null;
                    player4_id?: string | null;
                    winner?: string | null;
                };
                const ow = prevRow.winner;
                if (ow === "T1" || ow === "T2" || ow === "TIE") {
                    addDoublesStatDeltaToMap(
                        statAdjustmentsD,
                        String(prevRow.player1_id ?? ""),
                        negateDoublesStatDelta(doublesMatchStatContribution(ow, "t1a"))
                    );
                    addDoublesStatDeltaToMap(
                        statAdjustmentsD,
                        String(prevRow.player2_id ?? ""),
                        negateDoublesStatDelta(doublesMatchStatContribution(ow, "t1b"))
                    );
                    addDoublesStatDeltaToMap(
                        statAdjustmentsD,
                        String(prevRow.player3_id ?? ""),
                        negateDoublesStatDelta(doublesMatchStatContribution(ow, "t2a"))
                    );
                    addDoublesStatDeltaToMap(
                        statAdjustmentsD,
                        String(prevRow.player4_id ?? ""),
                        negateDoublesStatDelta(doublesMatchStatContribution(ow, "t2b"))
                    );
                }
            }
            addDoublesStatDeltaToMap(
                statAdjustmentsD,
                id1,
                doublesMatchStatContribution(winnerD, "t1a")
            );
            addDoublesStatDeltaToMap(
                statAdjustmentsD,
                id2,
                doublesMatchStatContribution(winnerD, "t1b")
            );
            addDoublesStatDeltaToMap(
                statAdjustmentsD,
                id3,
                doublesMatchStatContribution(winnerD, "t2a")
            );
            addDoublesStatDeltaToMap(
                statAdjustmentsD,
                id4,
                doublesMatchStatContribution(winnerD, "t2b")
            );

            const newRatingByPid = new Map<string, number>([
                [id1, newRT1],
                [id2, newRT2],
                [id3, newRT3],
                [id4, newRT4],
            ]);

            for (const [pid, delta] of statAdjustmentsD) {
                if (!pid) continue;
                const { data: prow } = await admin
                    .from("players")
                    .select(
                        "rating, doubles_rating, doubles_won, doubles_played, total_won, total_played"
                    )
                    .eq("id", pid)
                    .maybeSingle();
                if (!prow) continue;
                const pr = prow as {
                    rating?: number | null;
                    doubles_rating?: number | null;
                    doubles_won?: number | null;
                    doubles_played?: number | null;
                    total_won?: number | null;
                    total_played?: number | null;
                };
                const curDw = Number(pr.doubles_won ?? 0);
                const curDp = Number(pr.doubles_played ?? 0);
                const curTw = Number(pr.total_won ?? 0);
                const curTp = Number(pr.total_played ?? 0);
                const newDw = Math.max(0, curDw + delta.dw);
                const newDp = Math.max(0, curDp + delta.dp);
                const newTw = Math.max(0, curTw + delta.tw);
                const newTp = Math.max(0, curTp + delta.tp);
                const wpd = formatWinPct(newDw, newDp);
                const wpt = formatWinPct(newTw, newTp);
                const nr = newRatingByPid.get(pid);
                if (nr == null) continue;
                const r = await patchPlayerRowAfterBracketDoublesMatch(admin, pid, {
                    doubles_rating: nr,
                    doubles_won: newDw,
                    doubles_played: newDp,
                    total_won: newTw,
                    total_played: newTp,
                    win_pct_doubles: wpd,
                    win_pct_total: wpt,
                });
                if (r.error) {
                    console.error("players doubles patch", pid, r.error.message);
                    return NextResponse.json(
                        { error: "Failed to update ratings" },
                        { status: 500 }
                    );
                }
            }

            return NextResponse.json({ ok: true, payload });
        }

        const { data: existingSingles } = await admin
            .from("singles")
            .select(
                "id, player1_id, player2_id, p1_rating_change, p2_rating_change, winner"
            )
            .eq("event_id", eventId)
            .eq("bracket_match_key", body.matchKey)
            .maybeSingle();

        const existingId = existingSingles?.id != null ? Number(existingSingles.id) : null;

        if (existingId != null && Number.isFinite(existingId)) {
            const prev = existingSingles as {
                player1_id?: string | null;
                player2_id?: string | null;
                p1_rating_change?: number | null;
                p2_rating_change?: number | null;
                winner?: string | null;
            };
            const revertPairs: [string, number][] = [
                [String(prev.player1_id ?? ""), Number(prev.p1_rating_change ?? 0)],
                [String(prev.player2_id ?? ""), Number(prev.p2_rating_change ?? 0)],
            ];
            for (const [pid, delta] of revertPairs) {
                if (!pid) continue;
                const { data: prow } = await admin
                    .from("players")
                    .select("rating, singles_rating")
                    .eq("id", pid)
                    .maybeSingle();
                if (!prow) continue;
                const pr = prow as { rating?: number | null; singles_rating?: number | null };
                let r = Number(pr.singles_rating ?? pr.rating ?? 1500);
                if (Number.isNaN(r)) r = 1500;
                const nextR = roundStoredRating(r - delta);
                const { error: revErr } = await updatePlayerBracketRatings(admin, pid, nextR);
                if (revErr) {
                    console.error("revert rating", revErr.message);
                    return NextResponse.json({ error: "Failed to adjust ratings" }, { status: 500 });
                }
            }
        }

        const rowP1 = await fetchPlayerByIdOrUserId(admin, p1);
        const rowP2 = await fetchPlayerByIdOrUserId(admin, p2);

        if (!rowP1?.id || !rowP2?.id) {
            return NextResponse.json({ error: "Player not found" }, { status: 400 });
        }

        const player1RowId = String(rowP1.id);
        const player2RowId = String(rowP2.id);

        const rP1 = rowP1;
        const rP2 = rowP2;
        let rating1 = Number(rP1.singles_rating ?? rP1.rating ?? 1500);
        let rating2 = Number(rP2.singles_rating ?? rP2.rating ?? 1500);
        if (Number.isNaN(rating1)) rating1 = 1500;
        if (Number.isNaN(rating2)) rating2 = 1500;

        const { d1, d2 } = eloDelta(rating1, rating2, setsP1, setsP2);
        const newR1 = rating1 + d1;
        const newR2 = rating2 + d2;

        let winner: "P1" | "P2" | "TIE" = "TIE";
        if (setsP1 > setsP2) winner = "P1";
        else if (setsP2 > setsP1) winner = "P2";

        let hash = 0;
        for (let i = 0; i < body.matchKey.length; i++) {
            hash = (hash * 31 + body.matchKey.charCodeAt(i)) >>> 0;
        }
        const matchNumber = (eventId * 1_000_003 + hash) % 2_000_000_000;

        const matchDetail = {
            setsP1,
            setsP2,
            roundScores: normalizedRounds,
            twentiesP1,
            twentiesP2,
            totalP1,
            totalP2,
        };

        const singlesPayload = {
            match_number: matchNumber,
            match_date: matchDate,
            player1_id: player1RowId,
            player2_id: player2RowId,
            points_won_p1: totalP1,
            points_won_p2: totalP2,
            rounds: 4,
            winner,
            p1_kscore: null as number | null,
            p1_rating_old: rating1,
            p1_rating_change: d1,
            p1_rating_new: newR1,
            p2_kscore: null as number | null,
            p2_rating_old: rating2,
            p2_rating_change: d2,
            p2_rating_new: newR2,
            event_id: eventId,
            bracket_match_key: body.matchKey,
            match_detail: matchDetail,
        };

        if (existingId != null && Number.isFinite(existingId)) {
            const { error: upSingles } = await admin
                .from("singles")
                .update(singlesPayload)
                .eq("id", existingId);
            if (upSingles) {
                console.error("singles update", upSingles.message);
                return NextResponse.json({ error: "Failed to update match record" }, { status: 500 });
            }
        } else {
            const { error: insErr } = await admin.from("singles").insert(singlesPayload);
            if (insErr) {
                console.error("singles insert", insErr.message);
                return NextResponse.json({ error: "Failed to save match record" }, { status: 500 });
            }
        }

        const statAdjustments = new Map<string, SinglesStatDelta>();
        if (existingId != null && Number.isFinite(existingId)) {
            const prevRow = existingSingles as {
                player1_id?: string | null;
                player2_id?: string | null;
                winner?: string | null;
            };
            const ow = prevRow.winner;
            if (ow === "P1" || ow === "P2" || ow === "TIE") {
                addStatDeltaToMap(
                    statAdjustments,
                    String(prevRow.player1_id ?? ""),
                    negateStatDelta(singlesMatchStatContribution(ow, "p1"))
                );
                addStatDeltaToMap(
                    statAdjustments,
                    String(prevRow.player2_id ?? ""),
                    negateStatDelta(singlesMatchStatContribution(ow, "p2"))
                );
            }
        }
        addStatDeltaToMap(
            statAdjustments,
            player1RowId,
            singlesMatchStatContribution(winner, "p1")
        );
        addStatDeltaToMap(
            statAdjustments,
            player2RowId,
            singlesMatchStatContribution(winner, "p2")
        );

        for (const [pid, delta] of statAdjustments) {
            if (!pid) continue;
            const { data: prow } = await admin
                .from("players")
                .select("rating, singles_rating, singles_won, singles_played, total_won, total_played")
                .eq("id", pid)
                .maybeSingle();
            if (!prow) continue;
            const pr = prow as PlayerRatingRow;
            const curSw = Number(pr.singles_won ?? 0);
            const curSp = Number(pr.singles_played ?? 0);
            const curTw = Number(pr.total_won ?? 0);
            const curTp = Number(pr.total_played ?? 0);
            const newSw = Math.max(0, curSw + delta.sw);
            const newSp = Math.max(0, curSp + delta.sp);
            const newTw = Math.max(0, curTw + delta.tw);
            const newTp = Math.max(0, curTp + delta.tp);
            const wps = formatWinPct(newSw, newSp);
            const wpt = formatWinPct(newTw, newTp);

            const isFinalist1 = pid === player1RowId;
            const isFinalist2 = pid === player2RowId;
            let patchErr: { message: string; code?: string } | null = null;
            if (isFinalist1) {
                const r = await patchPlayerRowAfterBracketMatch(admin, pid, {
                    rating: newR1,
                    singles_won: newSw,
                    singles_played: newSp,
                    total_won: newTw,
                    total_played: newTp,
                    win_pct_singles: wps,
                    win_pct_total: wpt,
                });
                patchErr = r.error;
            } else if (isFinalist2) {
                const r = await patchPlayerRowAfterBracketMatch(admin, pid, {
                    rating: newR2,
                    singles_won: newSw,
                    singles_played: newSp,
                    total_won: newTw,
                    total_played: newTp,
                    win_pct_singles: wps,
                    win_pct_total: wpt,
                });
                patchErr = r.error;
            } else {
                const r = await patchPlayerStatsOnlyAfterBracket(admin, pid, {
                    singles_won: newSw,
                    singles_played: newSp,
                    total_won: newTw,
                    total_played: newTp,
                    win_pct_singles: wps,
                    win_pct_total: wpt,
                });
                patchErr = r.error;
            }
            if (patchErr) {
                console.error("players patch", pid, patchErr.message);
                return NextResponse.json({ error: "Failed to update ratings" }, { status: 500 });
            }
        }

        return NextResponse.json({ ok: true, payload });
    }

    const prevRaw = (eventRow as { tournament_bracket_results?: unknown }).tournament_bracket_results;
    let prevMap: TournamentBracketResultsMap = {};
    if (prevRaw && typeof prevRaw === "object" && !Array.isArray(prevRaw)) {
        prevMap = prevRaw as TournamentBracketResultsMap;
    }

    const nextMap: TournamentBracketResultsMap = {
        ...prevMap,
        [body.matchKey]: payload,
    };

    const { error: upEv } = await admin
        .from("events")
        .update({ tournament_bracket_results: nextMap })
        .eq("id", eventId);

    if (upEv) {
        console.error("events bracket update", upEv.message);
        return NextResponse.json({ error: "Failed to save bracket data" }, { status: 500 });
    }

    return NextResponse.json({ ok: true, payload });
}
