import { useEffect, useState } from "react";
import type { Session, User } from "@supabase/supabase-js";
import { supabase, isSupabaseConfigured } from "@/shared/supabase/client";

const isSessionValid = (session: Session | null): boolean => {
    if (!session?.user) return false;
    
    const expiresAt = session.expires_at;
    if (!expiresAt) return false;
    
    const now = Math.floor(Date.now() / 1000);
    return expiresAt > now;
};

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
            .then(async ({ data }) => {
                if (!isActive) return;
                
                const currentSession = data.session;
                
                if (!currentSession) {
                    setSession(null);
                    setUser(null);
                    setIsMounted(true);
                    return;
                }
                
                if (!isSessionValid(currentSession)) {
                    try {
                        await supabase.auth.signOut();
                    } catch {
                    }
                    setSession(null);
                    setUser(null);
                    setIsMounted(true);
                    return;
                }

                setSession(currentSession);
                setUser(currentSession.user);
                if (isActive) setIsMounted(true);

                supabase.auth.getUser().then(({ data: userData, error }) => {
                    if (!isActive) return;
                    if (error || !userData?.user) {
                        supabase.auth.signOut().catch(() => {});
                        setSession(null);
                        setUser(null);
                        return;
                    }
                    setUser(userData.user);
                }).catch(() => {
                    if (!isActive) return;
                    supabase.auth.signOut().catch(() => {});
                    setSession(null);
                    setUser(null);
                });
            })
            .catch(() => {
                if (!isActive) return;
                setSession(null);
                setUser(null);
                setIsMounted(true);
            });

        const { data: subscription } = supabase.auth.onAuthStateChange(
            async (_event, nextSession) => {
                if (!isActive) return;
                
                if (!nextSession) {
                    setSession(null);
                    setUser(null);
                    return;
                }
                
                if (!isSessionValid(nextSession)) {
                    try {
                        await supabase.auth.signOut();
                    } catch {
                    }
                    setSession(null);
                    setUser(null);
                    return;
                }
                
                try {
                    const { data: userData, error } = await supabase.auth.getUser();
                    if (error || !userData?.user) {
                        try {
                            await supabase.auth.signOut();
                        } catch {
                        }
                        setSession(null);
                        setUser(null);
                        return;
                    }
                    
                    setSession(nextSession);
                    setUser(userData.user);
                } catch {
                    try {
                        await supabase.auth.signOut();
                    } catch {
                    }
                    setSession(null);
                    setUser(null);
                }
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
        setSession(null);
        setUser(null);
    };

    const isValid = isMounted && session && isSessionValid(session) && user !== null;

    return {
        isAuth: isValid,
        isMounted,
        session,
        user,
        logout,
    };
};
