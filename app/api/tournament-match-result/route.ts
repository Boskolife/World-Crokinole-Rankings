import { NextResponse } from "next/server";
import { createClient } from "@/shared/supabase/server";
import { createClient as createServiceClient, type SupabaseClient } from "@supabase/supabase-js";
import { recomputePlayerAggregatesFromMatches } from "@/shared/lib/recompute-player-aggregates-from-matches";
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

function roundStoredRating(n: number): number {
    const x = Math.round(Number(n));
    return Number.isFinite(x) ? x : 1500;
}

async function refreshRankingsBestEffort(admin: SupabaseClient): Promise<string | null> {
    const { error } = await admin.rpc("refresh_rankings", {});
    if (error) {
        console.error("refresh_rankings RPC failed:", error.message, error);
        return error.message ?? "refresh_rankings failed";
    }
    return null;
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

            const affectedDoubles = new Set<string>([id1, id2, id3, id4]);
            if (existingDblId != null && Number.isFinite(existingDblId)) {
                const prD = existingDoubles as {
                    player1_id?: string | null;
                    player2_id?: string | null;
                    player3_id?: string | null;
                    player4_id?: string | null;
                };
                for (const x of [prD.player1_id, prD.player2_id, prD.player3_id, prD.player4_id]) {
                    if (x) affectedDoubles.add(String(x));
                }
            }
            const recD = await recomputePlayerAggregatesFromMatches(admin, [...affectedDoubles]);
            if (recD) {
                console.error("recomputePlayerAggregatesFromMatches", recD.error);
                return NextResponse.json(
                    { error: "Failed to sync player statistics after the match." },
                    { status: 500 }
                );
            }

            const rankingsWarn = await refreshRankingsBestEffort(admin);
            return NextResponse.json({
                ok: true,
                payload,
                ...(rankingsWarn
                    ? { rankingsRefreshFailed: true as const, rankingsError: rankingsWarn }
                    : {}),
            });
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

        const affectedSingles = new Set<string>([player1RowId, player2RowId]);
        if (existingId != null && Number.isFinite(existingId)) {
            const prS = existingSingles as {
                player1_id?: string | null;
                player2_id?: string | null;
            };
            if (prS.player1_id) affectedSingles.add(String(prS.player1_id));
            if (prS.player2_id) affectedSingles.add(String(prS.player2_id));
        }
        const recS = await recomputePlayerAggregatesFromMatches(admin, [...affectedSingles]);
        if (recS) {
            console.error("recomputePlayerAggregatesFromMatches", recS.error);
            return NextResponse.json(
                { error: "Failed to sync player statistics after the match." },
                { status: 500 }
            );
        }

        const rankingsWarnS = await refreshRankingsBestEffort(admin);
        return NextResponse.json({
            ok: true,
            payload,
            ...(rankingsWarnS
                ? { rankingsRefreshFailed: true as const, rankingsError: rankingsWarnS }
                : {}),
        });
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
