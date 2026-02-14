import { createBrowserClient } from "@supabase/ssr";
import { createClient, SupabaseClient } from "@supabase/supabase-js";

const supabaseUrl = process.env.NEXT_PUBLIC_SUPABASE_URL?.trim();
const supabaseAnonKey = process.env.NEXT_PUBLIC_SUPABASE_ANON_KEY?.trim();

function getSupabaseClient(): SupabaseClient {
    if (supabaseUrl && supabaseAnonKey) {
        return createBrowserClient(supabaseUrl, supabaseAnonKey);
    }
    return createClient(
        "https://placeholder.supabase.co",
        "placeholder-key"
    );
}

export const supabase = getSupabaseClient();

export const isSupabaseConfigured = Boolean(supabaseUrl && supabaseAnonKey);

export const supabaseConfigError = (() => {
    if (!supabaseUrl) return "NEXT_PUBLIC_SUPABASE_URL is not set";
    if (!supabaseAnonKey) return "NEXT_PUBLIC_SUPABASE_ANON_KEY is not set";
    try {
        new URL(supabaseUrl);
    } catch {
        return "NEXT_PUBLIC_SUPABASE_URL is not a valid URL";
    }
    return null;
})();
