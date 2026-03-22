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
    singles_won?: number | null;
    singles_played?: number | null;
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

async function fetchPlayerByIdOrUserId(
    admin: SupabaseClient,
    incoming: string
): Promise<PlayerRatingRow | null> {
    const { data: byPk } = await admin
        .from("players")
        .select(
            "id, rating, singles_rating, singles_won, singles_played, total_won, total_played"
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
            "id, rating, singles_rating, singles_won, singles_played, total_won, total_played"
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
    totalP2: number
): TournamentMatchResultPayload {
    return {
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

    const p1 = String(body.player1Id ?? "").trim();
    const p2 = String(body.player2Id ?? "").trim();
    if (!p1 || !p2 || p1 === p2) {
        return NextResponse.json({ error: "Invalid players" }, { status: 400 });
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
        totalP2
    );

    if (isRanked) {
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
