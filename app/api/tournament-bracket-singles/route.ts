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

    return NextResponse.json(
        buildTournamentBracketMapFromSinglesRows((data ?? []) as SinglesBracketRow[])
    );
}
