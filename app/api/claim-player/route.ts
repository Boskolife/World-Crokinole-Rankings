import { NextResponse } from "next/server";
import { createClient } from "@/shared/supabase/server";
import { createClient as createServiceClient } from "@supabase/supabase-js";

type ClaimPlayerPayload = {
    playerRowId?: string | number;
    playerName?: string;
};

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

    let payload: ClaimPlayerPayload = {};
    try {
        payload = (await request.json()) as ClaimPlayerPayload;
    } catch {
        return NextResponse.json({ error: "Invalid request payload" }, { status: 400 });
    }

    const rawRowId = payload.playerRowId;
    if (rawRowId === undefined || rawRowId === null || String(rawRowId).trim() === "") {
        return NextResponse.json({ error: "playerRowId is required" }, { status: 400 });
    }

    const admin = createServiceClient(
        process.env.NEXT_PUBLIC_SUPABASE_URL!,
        serviceKey
    );

    const playerRowId = typeof rawRowId === "number" ? rawRowId : String(rawRowId).trim();
    const numericId = typeof playerRowId === "string" && /^\d+$/.test(playerRowId)
        ? parseInt(playerRowId, 10)
        : playerRowId;

    const { data: target, error: targetError } = await admin
        .from("players")
        .select("id, name")
        .eq("id", numericId)
        .maybeSingle();
    if (targetError) {
        return NextResponse.json({ error: targetError.message }, { status: 400 });
    }
    if (!target?.id) {
        return NextResponse.json({ error: "Target player not found" }, { status: 404 });
    }

    const { error: deleteError } = await admin
        .from("players")
        .delete()
        .eq("user_id", user.id)
        .neq("id", numericId);
    if (deleteError) {
        return NextResponse.json({ error: deleteError.message }, { status: 400 });
    }

    const { data: linked, error: linkError } = await admin
        .from("players")
        .update({ user_id: user.id, is_auto_created: false })
        .eq("id", numericId)
        .select("id, name")
        .maybeSingle();
    if (linkError) {
        return NextResponse.json({ error: linkError.message }, { status: 400 });
    }
    if (!linked?.id) {
        return NextResponse.json({ error: "Failed to link player to account" }, { status: 400 });
    }

    const finalName = payload.playerName?.trim() || linked.name?.trim() || "";
    if (finalName) {
        const { error: profileNameError } = await admin
            .from("profiles")
            .update({ full_name: finalName })
            .eq("id", user.id);
        if (profileNameError) {
            return NextResponse.json({ error: profileNameError.message }, { status: 400 });
        }
    }

    return NextResponse.json({ ok: true });
}
