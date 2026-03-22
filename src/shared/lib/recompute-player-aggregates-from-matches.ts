import type { SupabaseClient } from "@supabase/supabase-js";

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

export async function recomputePlayerAggregatesFromMatches(
    admin: SupabaseClient,
    playerRowIds: string[]
): Promise<{ error: string } | null> {
    const ids = [...new Set(playerRowIds.filter(Boolean))];
    for (const pid of ids) {
        const err = await recomputeOnePlayer(admin, pid);
        if (err) return { error: err };
    }
    return null;
}

async function recomputeOnePlayer(admin: SupabaseClient, pid: string): Promise<string | null> {
    const { data: singlesRows, error: sErr } = await admin
        .from("singles")
        .select("id, match_date, player1_id, player2_id, winner, p1_rating_new, p2_rating_new")
        .or(`player1_id.eq.${pid},player2_id.eq.${pid}`)
        .order("match_date", { ascending: true })
        .order("id", { ascending: true });

    if (sErr) return sErr.message;

    const { data: doublesRows, error: dErr } = await admin
        .from("doubles")
        .select(
            "id, match_date, player1_id, player2_id, player3_id, player4_id, winner, p1_rating_new, p2_rating_new, p3_rating_new, p4_rating_new"
        )
        .or(`player1_id.eq.${pid},player2_id.eq.${pid},player3_id.eq.${pid},player4_id.eq.${pid}`)
        .order("match_date", { ascending: true })
        .order("id", { ascending: true });

    if (dErr) return dErr.message;

    let sw = 0;
    let sl = 0;
    let st = 0;
    let lastSinglesRating: number | null = null;
    for (const r of singlesRows ?? []) {
        const row = r as {
            player1_id: string;
            player2_id: string;
            winner: string | null;
            p1_rating_new: number | null;
            p2_rating_new: number | null;
        };
        const isP1 = row.player1_id === pid;
        if (row.winner === "TIE") st++;
        else if (row.winner === "P1") {
            if (isP1) sw++;
            else sl++;
        } else if (row.winner === "P2") {
            if (isP1) sl++;
            else sw++;
        }
        const rawNew = isP1 ? row.p1_rating_new : row.p2_rating_new;
        if (rawNew != null && Number.isFinite(Number(rawNew))) {
            lastSinglesRating = roundStoredRating(Number(rawNew));
        }
    }
    const sp = (singlesRows ?? []).length;

    let dw = 0;
    let dl = 0;
    let dt = 0;
    let lastDoublesRating: number | null = null;
    for (const r of doublesRows ?? []) {
        const row = r as {
            player1_id: string;
            player2_id: string;
            player3_id: string;
            player4_id: string;
            winner: string | null;
            p1_rating_new: number | null;
            p2_rating_new: number | null;
            p3_rating_new: number | null;
            p4_rating_new: number | null;
        };
        const onT1 = row.player1_id === pid || row.player2_id === pid;
        const onT2 = row.player3_id === pid || row.player4_id === pid;
        if (row.winner === "TIE") dt++;
        else if (row.winner === "T1") {
            if (onT1) dw++;
            else if (onT2) dl++;
        } else if (row.winner === "T2") {
            if (onT2) dw++;
            else if (onT1) dl++;
        }
        let rawNew: number | null = null;
        if (row.player1_id === pid) rawNew = row.p1_rating_new;
        else if (row.player2_id === pid) rawNew = row.p2_rating_new;
        else if (row.player3_id === pid) rawNew = row.p3_rating_new;
        else if (row.player4_id === pid) rawNew = row.p4_rating_new;
        if (rawNew != null && Number.isFinite(Number(rawNew))) {
            lastDoublesRating = roundStoredRating(Number(rawNew));
        }
    }
    const dp = (doublesRows ?? []).length;

    const totalWon = sw + dw;
    const totalPlayed = sp + dp;
    const wps = formatWinPct(sw, sp);
    const wpd = formatWinPct(dw, dp);
    const wpt = formatWinPct(totalWon, totalPlayed);

    const full: Record<string, string | number> = {
        singles_won: sw,
        singles_played: sp,
        win_pct_singles: wps,
        doubles_won: dw,
        doubles_played: dp,
        win_pct_doubles: wpd,
        total_won: totalWon,
        total_played: totalPlayed,
        win_pct_total: wpt,
    };

    if (sp > 0 && lastSinglesRating != null) {
        full.singles_rating = lastSinglesRating;
    }
    if (dp > 0 && lastDoublesRating != null) {
        full.doubles_rating = lastDoublesRating;
    }

    if (sp > 0 && dp > 0 && lastSinglesRating != null && lastDoublesRating != null) {
        const c = roundStoredRating((lastSinglesRating + lastDoublesRating) / 2);
        full.combined_rating = c;
        full.rating = c;
    } else if (sp > 0 && lastSinglesRating != null) {
        full.rating = lastSinglesRating;
    } else if (dp > 0 && lastDoublesRating != null) {
        full.rating = lastDoublesRating;
    }

    let { error } = await admin.from("players").update(full).eq("id", pid);
    if (error) {
        const msg = (error.message ?? "").toLowerCase();
        if (msg.includes("win_pct") || msg.includes("combined_rating")) {
            const noExtra = { ...full };
            delete noExtra.win_pct_singles;
            delete noExtra.win_pct_doubles;
            delete noExtra.win_pct_total;
            delete noExtra.combined_rating;
            ({ error } = await admin.from("players").update(noExtra).eq("id", pid));
        }
    }
    if (error) return error.message;
    return null;
}
