import { NextRequest, NextResponse } from "next/server";
import { find } from "geo-tz";
import tzLookup from "tz-lookup";

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
    if (latNum < -90 || latNum > 90 || lngNum < -180 || lngNum > 180) {
        return NextResponse.json(
            { error: "lat must be -90..90, lng must be -180..180" },
            { status: 400 }
        );
    }
    try {
        let timezone: string | null = null;
        try {
            const zones = find(latNum, lngNum);
            timezone = zones[0] ?? null;
        } catch {
            timezone = tzLookup(latNum, lngNum) ?? null;
        }
        if (!timezone) {
            return NextResponse.json(
                { error: "No timezone for this location" },
                { status: 400 }
            );
        }
        return NextResponse.json({ timezone });
    } catch (e) {
        console.error("Timezone lookup error:", e);
        return NextResponse.json(
            { error: "Failed to resolve timezone" },
            { status: 500 }
        );
    }
}
