import { NextRequest, NextResponse } from "next/server";

export async function GET(request: NextRequest) {
    const { searchParams } = new URL(request.url);
    const lat = searchParams.get("lat");
    const lng = searchParams.get("lng");
    if (lat == null || lng == null) {
        return NextResponse.json(
            { error: "lat and lng are required" },
            { status: 400 }
        );
    }
    const latNum = parseFloat(lat);
    const lngNum = parseFloat(lng);
    if (Number.isNaN(latNum) || Number.isNaN(lngNum)) {
        return NextResponse.json(
            { error: "lat and lng must be numbers" },
            { status: 400 }
        );
    }
    const key = process.env.NEXT_PUBLIC_GOOGLE_MAPS_API_KEY;
    if (!key) {
        return NextResponse.json(
            { error: "Time Zone API key not configured" },
            { status: 503 }
        );
    }
    const timestamp = Math.floor(Date.now() / 1000);
    const url = `https://maps.googleapis.com/maps/api/timezone/json?location=${latNum},${lngNum}&timestamp=${timestamp}&key=${key}`;
    try {
        const res = await fetch(url);
        const data = (await res.json()) as {
            status: string;
            timeZoneId?: string;
            errorMessage?: string;
        };
        if (data.status !== "OK" || !data.timeZoneId) {
            return NextResponse.json(
                { error: data.errorMessage ?? "Could not resolve timezone" },
                { status: 400 }
            );
        }
        return NextResponse.json({ timezone: data.timeZoneId });
    } catch (e) {
        console.error("Timezone API error:", e);
        return NextResponse.json(
            { error: "Failed to fetch timezone" },
            { status: 502 }
        );
    }
}
