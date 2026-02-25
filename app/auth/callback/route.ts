import { NextResponse } from "next/server";
import { createClient } from "@/shared/supabase/server";

function getRedirectBase(request: Request): string {
    const forwardedHost = request.headers.get("x-forwarded-host");
    const forwardedProto = request.headers.get("x-forwarded-proto");
    if (forwardedHost && forwardedProto) {
        return `${forwardedProto}://${forwardedHost}`;
    }
    if (forwardedHost) {
        return `https://${forwardedHost}`;
    }
    const { origin } = new URL(request.url);
    return origin;
}

export async function GET(request: Request) {
    const { searchParams } = new URL(request.url);
    const code = searchParams.get("code");
    let next = searchParams.get("next") ?? "/";
    if (!next.startsWith("/")) {
        next = "/";
    }

    const base = getRedirectBase(request);

    if (code) {
        const supabase = await createClient();
        const { error } = await supabase.auth.exchangeCodeForSession(code);
        if (!error) {
            return NextResponse.redirect(`${base}${next}`);
        }
    }

    return NextResponse.redirect(`${base}/auth/sign-in?error=auth`);
}
