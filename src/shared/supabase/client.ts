import { createClient } from "@supabase/supabase-js";

const supabaseUrl = process.env.NEXT_PUBLIC_SUPABASE_URL?.trim();
const supabaseAnonKey = process.env.NEXT_PUBLIC_SUPABASE_ANON_KEY?.trim();

export const supabase = createClient(supabaseUrl ?? "", supabaseAnonKey ?? "");

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

