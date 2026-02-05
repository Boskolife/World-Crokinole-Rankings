import { useEffect, useState } from "react";
import type { Session, User } from "@supabase/supabase-js";
import { supabase, isSupabaseConfigured } from "@/shared/supabase/client";

export const useAuth = () => {
    const [isMounted, setIsMounted] = useState(false);
    const [session, setSession] = useState<Session | null>(null);
    const [user, setUser] = useState<User | null>(null);

    useEffect(() => {
        if (!isSupabaseConfigured) {
            setIsMounted(true);
            setSession(null);
            setUser(null);
            return;
        }

        let isActive = true;

        supabase.auth
            .getSession()
            .then(({ data }) => {
                if (!isActive) return;
                setSession(data.session ?? null);
                setUser(data.session?.user ?? null);
            })
            .finally(() => {
                if (!isActive) return;
                setIsMounted(true);
            });

        const { data: subscription } = supabase.auth.onAuthStateChange(
            (_event, nextSession) => {
                if (!isActive) return;
                setSession(nextSession ?? null);
                setUser(nextSession?.user ?? null);
            }
        );

        return () => {
            isActive = false;
            subscription.subscription.unsubscribe();
        };
    }, []);

    const logout = async () => {
        if (!isSupabaseConfigured) return;
        await supabase.auth.signOut();
    };

    return {
        isAuth: isMounted ? Boolean(session?.user) : false,
        isMounted,
        session,
        user,
        logout,
    };
};
