import { NextRequest, NextResponse } from "next/server";
import { createClient as createServiceClient } from "@supabase/supabase-js";
import { createClient as createServerClient } from "@/shared/supabase/server";

const ORDER_COLUMN_BY_TABLE: Record<string, string> = {
    events: "id",
    players: "created_at",
    clubs: "id",
    tournaments: "created_at",
    rankings: "id",
    match_history: "created_at",
    news: "sort_order",
    profiles: "created_at",
    subscriptions: "created_at",
};

function createAdminClient() {
    const supabaseUrl = process.env.NEXT_PUBLIC_SUPABASE_URL || "";
    const serviceRoleKey = process.env.SUPABASE_SERVICE_ROLE_KEY || "";
    return createServiceClient(supabaseUrl, serviceRoleKey);
}

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

function normalizeTableName(raw: string | null) {
    return raw?.trim() || "";
}

function applyMatchConditions<T extends { eq: (column: string, value: unknown) => T }>(
    query: T,
    match: Record<string, unknown>
) {
    let result = query;
    Object.entries(match).forEach(([column, value]) => {
        result = result.eq(column, value);
    });
    return result;
}

export async function GET(request: NextRequest) {
    const adminCheck = await ensureAdmin();
    if (!adminCheck.ok) return adminCheck.response;

    const admin = createAdminClient();
    const { searchParams } = new URL(request.url);
    const table = normalizeTableName(searchParams.get("table"));
    if (!table || !/^[a-z_][a-z0-9_]*$/.test(table)) {
        return NextResponse.json({ error: "Invalid table" }, { status: 400 });
    }

    const orderBy = ORDER_COLUMN_BY_TABLE[table] || "id";
    const query = admin.from(table).select("*").order(orderBy, { ascending: false });
    const { data, error } = await query;

    if (error) {
        return NextResponse.json({ error: error.message }, { status: 500 });
    }

    return NextResponse.json({ data: data || [] });
}

export async function POST(request: NextRequest) {
    const adminCheck = await ensureAdmin();
    if (!adminCheck.ok) return adminCheck.response;

    const admin = createAdminClient();
    const body = await request.json();
    const table = normalizeTableName(body?.table);
    const payload = body?.payload;

    if (!table || !/^[a-z_][a-z0-9_]*$/.test(table) || !payload || typeof payload !== "object" || Array.isArray(payload)) {
        return NextResponse.json({ error: "Invalid payload" }, { status: 400 });
    }
    const { data, error } = await admin.from(table).insert([payload]).select("*").single();

    if (error) {
        return NextResponse.json({ error: error.message }, { status: 500 });
    }

    return NextResponse.json({ data });
}

export async function PATCH(request: NextRequest) {
    const adminCheck = await ensureAdmin();
    if (!adminCheck.ok) return adminCheck.response;

    const admin = createAdminClient();
    const body = await request.json();
    const table = normalizeTableName(body?.table);
    const payload = body?.payload;
    const match = body?.match;

    if (
        !table ||
        !/^[a-z_][a-z0-9_]*$/.test(table) ||
        !payload ||
        typeof payload !== "object" ||
        Array.isArray(payload) ||
        !match ||
        typeof match !== "object" ||
        Array.isArray(match) ||
        Object.keys(match).length === 0
    ) {
        return NextResponse.json({ error: "Invalid payload" }, { status: 400 });
    }

    const safeMatchEntries = Object.entries(match).filter(
        ([key, value]) => /^[a-z_][a-z0-9_]*$/.test(key) && value !== undefined && value !== null
    );

    if (safeMatchEntries.length === 0) {
        return NextResponse.json({ error: "Invalid match keys" }, { status: 400 });
    }

    const query = applyMatchConditions(
        admin
        .from(table)
        .update(payload),
        Object.fromEntries(safeMatchEntries)
    )
        .select("*")
        .single();
    const { data, error } = await query;

    if (error) {
        return NextResponse.json({ error: error.message }, { status: 500 });
    }

    return NextResponse.json({ data });
}

export async function DELETE(request: NextRequest) {
    const adminCheck = await ensureAdmin();
    if (!adminCheck.ok) return adminCheck.response;

    const admin = createAdminClient();
    const body = await request.json();
    const table = normalizeTableName(body?.table);
    const match = body?.match;

    if (
        !table ||
        !/^[a-z_][a-z0-9_]*$/.test(table) ||
        !match ||
        typeof match !== "object" ||
        Array.isArray(match) ||
        Object.keys(match).length === 0
    ) {
        return NextResponse.json({ error: "Invalid payload" }, { status: 400 });
    }

    const safeMatchEntries = Object.entries(match).filter(
        ([key, value]) => /^[a-z_][a-z0-9_]*$/.test(key) && value !== undefined && value !== null
    );

    if (safeMatchEntries.length === 0) {
        return NextResponse.json({ error: "Invalid match keys" }, { status: 400 });
    }

    const query = applyMatchConditions(
        admin.from(table).delete(),
        Object.fromEntries(safeMatchEntries)
    );
    const { error } = await query;

    if (error) {
        return NextResponse.json({ error: error.message }, { status: 500 });
    }

    return NextResponse.json({ success: true });
}
