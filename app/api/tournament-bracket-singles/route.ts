import { NextResponse } from "next/server";
import { createClient } from "@supabase/supabase-js";
import {
    buildTournamentBracketMapFromSinglesRows,
    type SinglesBracketRow,
} from "@/shared/lib/tournament-bracket-from-singles-rows";
import {
    buildTournamentBracketMapFromDoublesRows,
    type DoublesBracketRow,
} from "@/shared/lib/tournament-bracket-from-doubles-rows";

export async function GET(request: Request) {
    const url = new URL(request.url);
    const eventId = parseInt(url.searchParams.get("eventId") ?? "", 10);
    if (!Number.isFinite(eventId) || eventId < 1) {
        return NextResponse.json({}, { status: 400 });
    }

    const serviceKey = process.env.SUPABASE_SERVICE_ROLE_KEY;
    const supabaseUrl = process.env.NEXT_PUBLIC_SUPABASE_URL?.trim();
    if (!serviceKey || !supabaseUrl) {
        return NextResponse.json({});
    }

    const admin = createClient(supabaseUrl, serviceKey);
    const { data, error } = await admin
        .from("singles")
        .select("bracket_match_key, player1_id, player2_id, points_won_p1, points_won_p2, match_detail")
        .eq("event_id", eventId);

    if (error) {
        return NextResponse.json({});
    }

    const rows = (data ?? []) as SinglesBracketRow[];
    const rowIds = new Set<string>();
    for (const r of rows) {
        if (r.player1_id) rowIds.add(String(r.player1_id));
        if (r.player2_id) rowIds.add(String(r.player2_id));
    }
    const idList = [...rowIds];
    const clientIdByRowId: Record<string, string> = {};
    if (idList.length > 0) {
        const { data: plRows } = await admin.from("players").select("id, user_id").in("id", idList);
        for (const p of plRows ?? []) {
            const row = p as { id: string; user_id?: string | null };
            const pk = String(row.id);
            const uid = row.user_id?.trim();
            clientIdByRowId[pk] = uid ? String(uid) : pk;
        }
    }

    const mappedRows: SinglesBracketRow[] = rows.map((r) => ({
        ...r,
        player1_id: clientIdByRowId[String(r.player1_id)] ?? r.player1_id,
        player2_id: clientIdByRowId[String(r.player2_id)] ?? r.player2_id,
    }));

    const singlesMap = buildTournamentBracketMapFromSinglesRows(mappedRows);

    const { data: dblData, error: dblErr } = await admin
        .from("doubles")
        .select(
            "bracket_match_key, player1_id, player2_id, player3_id, player4_id, points_won_team1, points_won_team2, match_detail"
        )
        .eq("event_id", eventId);

    if (dblErr || !dblData?.length) {
        return NextResponse.json(singlesMap);
    }

    const dblRows = dblData as DoublesBracketRow[];
    const dblIds = new Set<string>();
    for (const r of dblRows) {
        if (r.player1_id) dblIds.add(String(r.player1_id));
        if (r.player2_id) dblIds.add(String(r.player2_id));
        if (r.player3_id) dblIds.add(String(r.player3_id));
        if (r.player4_id) dblIds.add(String(r.player4_id));
    }
    const dblIdList = [...dblIds];
    const dblClientIdByRowId: Record<string, string> = {};
    if (dblIdList.length > 0) {
        const { data: dblPlRows } = await admin.from("players").select("id, user_id").in("id", dblIdList);
        for (const p of dblPlRows ?? []) {
            const row = p as { id: string; user_id?: string | null };
            const pk = String(row.id);
            const uid = row.user_id?.trim();
            dblClientIdByRowId[pk] = uid ? String(uid) : pk;
        }
    }

    const mappedDoubles: DoublesBracketRow[] = dblRows.map((r) => ({
        ...r,
        player1_id: dblClientIdByRowId[String(r.player1_id)] ?? r.player1_id,
        player2_id: dblClientIdByRowId[String(r.player2_id)] ?? r.player2_id,
        player3_id: dblClientIdByRowId[String(r.player3_id)] ?? r.player3_id,
        player4_id: dblClientIdByRowId[String(r.player4_id)] ?? r.player4_id,
    }));

    const doublesMap = buildTournamentBracketMapFromDoublesRows(mappedDoubles);
    return NextResponse.json({ ...singlesMap, ...doublesMap });
}
