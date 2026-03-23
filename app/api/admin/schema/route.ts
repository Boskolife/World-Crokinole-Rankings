import { NextResponse } from "next/server";
import { createClient as createServerClient } from "@/shared/supabase/server";

const DEFAULT_SCHEMA: Array<{
    name: string;
    primaryKeys: string[];
    columns: Array<{ name: string; dataType: string }>;
}> = [
    {
        name: "clubs",
        primaryKeys: ["id"],
        columns: [
            { name: "id", dataType: "int4" },
            { name: "title", dataType: "text" },
            { name: "image", dataType: "text" },
            { name: "description", dataType: "text" },
            { name: "members", dataType: "int4" },
            { name: "location", dataType: "text" },
            { name: "labels", dataType: "text" },
            { name: "country", dataType: "text" },
            { name: "label_item1", dataType: "text" },
            { name: "label_item2", dataType: "text" },
            { name: "hosted", dataType: "int4" },
            { name: "veteran_players", dataType: "int4" },
            { name: "is_locked", dataType: "bool" },
            { name: "created_at", dataType: "timestamptz" },
            { name: "updated_at", dataType: "timestamptz" },
        ],
    },
    {
        name: "doubles",
        primaryKeys: ["id"],
        columns: [
            { name: "id", dataType: "int8" },
            { name: "match_number", dataType: "int4" },
            { name: "match_date", dataType: "date" },
            { name: "player1_id", dataType: "text" },
            { name: "player2_id", dataType: "text" },
            { name: "player3_id", dataType: "text" },
            { name: "player4_id", dataType: "text" },
            { name: "points_won_team1", dataType: "numeric" },
            { name: "points_won_team2", dataType: "numeric" },
            { name: "rounds", dataType: "numeric" },
            { name: "winner", dataType: "text" },
            { name: "p1_kscore", dataType: "int4" },
            { name: "p1_rating_old", dataType: "numeric" },
            { name: "p1_rating_change", dataType: "numeric" },
            { name: "p1_rating_new", dataType: "numeric" },
            { name: "p2_kscore", dataType: "int4" },
            { name: "p2_rating_old", dataType: "numeric" },
            { name: "p2_rating_change", dataType: "numeric" },
            { name: "p2_rating_new", dataType: "numeric" },
            { name: "p3_kscore", dataType: "int4" },
            { name: "p3_rating_old", dataType: "numeric" },
            { name: "p3_rating_change", dataType: "numeric" },
            { name: "p3_rating_new", dataType: "numeric" },
            { name: "p4_kscore", dataType: "int4" },
            { name: "p4_rating_old", dataType: "numeric" },
            { name: "p4_rating_change", dataType: "numeric" },
            { name: "p4_rating_new", dataType: "numeric" },
            { name: "created_at", dataType: "timestamptz" },
            { name: "event_id", dataType: "int8" },
            { name: "bracket_match_key", dataType: "text" },
            { name: "match_detail", dataType: "jsonb" },
        ],
    },
    {
        name: "news",
        primaryKeys: ["id"],
        columns: [
            { name: "id", dataType: "int8" },
            { name: "image", dataType: "text" },
            { name: "title", dataType: "text" },
            { name: "description", dataType: "text" },
            { name: "link", dataType: "text" },
            { name: "link_text", dataType: "text" },
            { name: "sort_order", dataType: "int4" },
            { name: "created_at", dataType: "timestamptz" },
        ],
    },
    {
        name: "players",
        primaryKeys: ["id"],
        columns: [
            { name: "id", dataType: "text" },
            { name: "name", dataType: "text" },
            { name: "country_code", dataType: "text" },
            { name: "kingdom", dataType: "text" },
            { name: "club", dataType: "text" },
            { name: "rating", dataType: "int4" },
            { name: "created_at", dataType: "timestamptz" },
            { name: "updated_at", dataType: "timestamptz" },
            { name: "user_id", dataType: "uuid" },
            { name: "player_name", dataType: "text" },
            { name: "gender", dataType: "text" },
            { name: "player_identifier", dataType: "text" },
            { name: "title", dataType: "text" },
            { name: "club_title", dataType: "text" },
            { name: "singles_rating", dataType: "int4" },
            { name: "doubles_rating", dataType: "int4" },
            { name: "combined_rating", dataType: "int4" },
            { name: "singles_won", dataType: "int4" },
            { name: "singles_played", dataType: "int4" },
            { name: "win_pct_singles", dataType: "text" },
            { name: "doubles_won", dataType: "int4" },
            { name: "doubles_played", dataType: "int4" },
            { name: "win_pct_doubles", dataType: "text" },
            { name: "total_won", dataType: "int4" },
            { name: "total_played", dataType: "int4" },
            { name: "win_pct_total", dataType: "text" },
            { name: "helping_column_1", dataType: "text" },
            { name: "helping_column_2", dataType: "text" },
            { name: "helping_column_3", dataType: "text" },
            { name: "helping_array", dataType: "text" },
            { name: "full_name_with_titles", dataType: "text" },
            { name: "is_auto_created", dataType: "bool" },
        ],
    },
    {
        name: "profiles",
        primaryKeys: ["id"],
        columns: [
            { name: "id", dataType: "uuid" },
            { name: "full_name", dataType: "text" },
            { name: "country", dataType: "text" },
            { name: "club", dataType: "text" },
            { name: "created_at", dataType: "timestamptz" },
            { name: "updated_at", dataType: "timestamptz" },
            { name: "subscription_plan", dataType: "text" },
            { name: "is_admin", dataType: "bool" },
            { name: "avatar_url", dataType: "text" },
        ],
    },
    {
        name: "rankings",
        primaryKeys: ["id"],
        columns: [
            { name: "id", dataType: "int4" },
            { name: "category", dataType: "text" },
            { name: "rank", dataType: "int4" },
            { name: "name", dataType: "text" },
            { name: "laurels", dataType: "int4" },
            { name: "trend", dataType: "text" },
            { name: "trend_up", dataType: "bool" },
            { name: "wins", dataType: "int4" },
            { name: "losses", dataType: "int4" },
            { name: "ties", dataType: "int4" },
            { name: "rating", dataType: "int4" },
            { name: "kingdom", dataType: "text" },
            { name: "club", dataType: "text" },
            { name: "created_at", dataType: "timestamptz" },
            { name: "updated_at", dataType: "timestamptz" },
            { name: "player_id", dataType: "text" },
        ],
    },
    {
        name: "singles",
        primaryKeys: ["id"],
        columns: [
            { name: "id", dataType: "int8" },
            { name: "match_number", dataType: "int4" },
            { name: "match_date", dataType: "date" },
            { name: "player1_id", dataType: "text" },
            { name: "player2_id", dataType: "text" },
            { name: "points_won_p1", dataType: "numeric" },
            { name: "points_won_p2", dataType: "numeric" },
            { name: "rounds", dataType: "numeric" },
            { name: "winner", dataType: "text" },
            { name: "p1_kscore", dataType: "int4" },
            { name: "p1_rating_old", dataType: "numeric" },
            { name: "p1_rating_change", dataType: "numeric" },
            { name: "p1_rating_new", dataType: "numeric" },
            { name: "p2_kscore", dataType: "int4" },
            { name: "p2_rating_old", dataType: "numeric" },
            { name: "p2_rating_change", dataType: "numeric" },
            { name: "p2_rating_new", dataType: "numeric" },
            { name: "created_at", dataType: "timestamptz" },
            { name: "event_id", dataType: "int8" },
            { name: "bracket_match_key", dataType: "text" },
            { name: "match_detail", dataType: "jsonb" },
        ],
    },
    {
        name: "subscriptions",
        primaryKeys: ["id"],
        columns: [
            { name: "id", dataType: "uuid" },
            { name: "user_id", dataType: "uuid" },
            { name: "stripe_subscription_id", dataType: "text" },
            { name: "stripe_customer_id", dataType: "text" },
            { name: "plan_id", dataType: "int4" },
            { name: "plan_name", dataType: "text" },
            { name: "status", dataType: "text" },
            { name: "billing_period", dataType: "text" },
            { name: "current_period_start", dataType: "timestamptz" },
            { name: "current_period_end", dataType: "timestamptz" },
            { name: "cancel_at_period_end", dataType: "bool" },
            { name: "created_at", dataType: "timestamptz" },
            { name: "updated_at", dataType: "timestamptz" },
        ],
    },
];

async function ensureAdmin() {
    const supabase = await createServerClient();
    const {
        data: { user },
        error: authError,
    } = await supabase.auth.getUser();

    if (authError || !user) {
        return { ok: false as const, response: NextResponse.json({ error: "Unauthorized" }, { status: 401 }) };
    }

    const { data: profile, error: profileError } = await supabase
        .from("profiles")
        .select("is_admin")
        .eq("id", user.id)
        .maybeSingle();

    if (profileError || !profile?.is_admin) {
        return { ok: false as const, response: NextResponse.json({ error: "Forbidden" }, { status: 403 }) };
    }

    return { ok: true as const };
}

export async function GET() {
    const adminCheck = await ensureAdmin();
    if (!adminCheck.ok) return adminCheck.response;
    return NextResponse.json({ tables: DEFAULT_SCHEMA });
}
