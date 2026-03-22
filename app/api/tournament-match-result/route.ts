import { NextResponse } from "next/server";
import { createClient } from "@/shared/supabase/server";
import { createClient as createServiceClient } from "@supabase/supabase-js";
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
            .select("id, player1_id, player2_id, p1_rating_change, p2_rating_change")
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
                const nextR = r - delta;
                const { error: revErr } = await admin
                    .from("players")
                    .update({ rating: nextR, singles_rating: nextR })
                    .eq("id", pid);
                if (revErr) {
                    console.error("revert rating", revErr.message);
                    return NextResponse.json({ error: "Failed to adjust ratings" }, { status: 500 });
                }
            }
        }

        const { data: rowP1 } = await admin
            .from("players")
            .select("id, rating, singles_rating")
            .eq("id", p1)
            .maybeSingle();
        const { data: rowP2 } = await admin
            .from("players")
            .select("id, rating, singles_rating")
            .eq("id", p2)
            .maybeSingle();

        if (!rowP1?.id || !rowP2?.id) {
            return NextResponse.json({ error: "Player not found" }, { status: 400 });
        }

        const rP1 = rowP1 as { rating?: number | null; singles_rating?: number | null };
        const rP2 = rowP2 as { rating?: number | null; singles_rating?: number | null };
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
            player1_id: p1,
            player2_id: p2,
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

        const { error: e1 } = await admin
            .from("players")
            .update({ rating: newR1, singles_rating: newR1 })
            .eq("id", p1);
        const { error: e2 } = await admin
            .from("players")
            .update({ rating: newR2, singles_rating: newR2 })
            .eq("id", p2);
        if (e1 || e2) {
            console.error("players update", e1?.message, e2?.message);
            return NextResponse.json({ error: "Failed to update ratings" }, { status: 500 });
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
