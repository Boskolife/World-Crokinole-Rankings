import { NextResponse } from "next/server";
import { createClient } from "@supabase/supabase-js";
import {
    buildTournamentBracketMapFromSinglesRows,
    type SinglesBracketRow,
} from "@/shared/lib/tournament-bracket-from-singles-rows";

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

    return NextResponse.json(buildTournamentBracketMapFromSinglesRows(mappedRows));
}
