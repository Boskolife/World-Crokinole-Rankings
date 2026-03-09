import { NextResponse } from "next/server";
import { createClient } from "@/shared/supabase/server";
import { createClient as createServiceClient } from "@supabase/supabase-js";

export async function POST() {
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

    const admin = createServiceClient(
        process.env.NEXT_PUBLIC_SUPABASE_URL!,
        serviceKey
    );
    const userId = user.id;

    const { data: existing } = await admin
        .from("players")
        .select("id")
        .eq("user_id", userId)
        .maybeSingle();
    if (existing) {
        return NextResponse.json({ ok: true });
    }

    const { data: profile } = await admin
        .from("profiles")
        .select("full_name, country, club")
        .eq("id", userId)
        .maybeSingle();
    const row = profile as {
        full_name?: string | null;
        country?: string | null;
        club?: string | null;
    } | null;
    const name = row?.full_name?.trim() ?? "";
    const countryCode = row?.country?.trim() ?? "";
    const club = row?.club?.trim() ?? "";
    const kingdom = "";

    const { error } = await admin.from("players").insert({
        user_id: userId,
        name,
        country_code: countryCode,
        kingdom,
        club,
        rating: 1500,
        is_auto_created: true,
    });
    if (error) {
        if ((error as { code?: string }).code === "23505") {
            return NextResponse.json({ ok: true });
        }
        console.error("ensure-player API insert error:", (error as { message?: string }).message);
        return NextResponse.json(
            { error: "Failed to create player" },
            { status: 500 }
        );
    }
    return NextResponse.json({ ok: true });
}
