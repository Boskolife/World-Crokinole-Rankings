import { useCallback, useEffect, useSyncExternalStore } from "react";
import type { AuthChangeEvent, Session, User } from "@supabase/supabase-js";
import { supabase, isSupabaseConfigured } from "@/shared/supabase/client";

const isSessionValid = (session: Session | null): boolean => {
    if (!session?.user) return false;
    const expiresAt = session.expires_at;
    if (!expiresAt) return false;
    const now = Math.floor(Date.now() / 1000);
    return expiresAt > now;
};

type AuthStore = {
    isMounted: boolean;
    session: Session | null;
    user: User | null;
};

const defaultStore: AuthStore = {
    isMounted: false,
    session: null,
    user: null,
};

let store: AuthStore = { ...defaultStore };
const listeners = new Set<() => void>();

function emit() {
    listeners.forEach((fn) => fn());
}

function setStore(partial: Partial<AuthStore>) {
    store = { ...store, ...partial };
    emit();
}

function subscribe(fn: () => void) {
    listeners.add(fn);
    return () => listeners.delete(fn);
}

function getSnapshot(): AuthStore {
    return store;
}

function getServerSnapshot(): AuthStore {
    return defaultStore;
}

async function resolveUserForSession(session: Session | null): Promise<User | null> {
    if (!session?.user) return null;
    const { data, error } = await supabase.auth.getUser();
    if (error) return session.user;
    return data.user ?? session.user;
}

function shouldFetchUserFromServer(event: AuthChangeEvent): boolean {
    if (event === "TOKEN_REFRESHED") return false;
    return true;
}

let listenerStarted = false;

function startAuthListener() {
    if (listenerStarted) return;
    listenerStarted = true;

    if (!isSupabaseConfigured) {
        setStore({ isMounted: true, session: null, user: null });
        return;
    }

    supabase.auth.onAuthStateChange((event, nextSession) => {
        if (!nextSession) {
            setStore({ session: null, user: null });
            if (event === "INITIAL_SESSION") {
                setStore({ isMounted: true });
            }
            return;
        }
        if (!isSessionValid(nextSession)) {
            supabase.auth.signOut().catch(() => {});
            setStore({ session: null, user: null });
            if (event === "INITIAL_SESSION") {
                setStore({ isMounted: true });
            }
            return;
        }

        setStore({
            session: nextSession,
            user: nextSession.user ?? null,
        });

        if (event === "INITIAL_SESSION") {
            setTimeout(() => {
                void (async () => {
                    const resolvedUser = await resolveUserForSession(nextSession);
                    setStore({ user: resolvedUser, isMounted: true });
                })();
            }, 0);
            return;
        }

        if (!shouldFetchUserFromServer(event)) {
            return;
        }

        setTimeout(() => {
            void (async () => {
                const resolvedUser = await resolveUserForSession(nextSession);
                setStore({ user: resolvedUser });
            })();
        }, 0);
    });
}

export const useAuth = () => {
    const state = useSyncExternalStore(subscribe, getSnapshot, getServerSnapshot);

    useEffect(() => {
        startAuthListener();
    }, []);

    const logout = useCallback(async () => {
        if (!isSupabaseConfigured) return;
        await supabase.auth.signOut();
        setStore({ session: null, user: null });
    }, []);

    const isValid =
        state.isMounted &&
        !!state.session &&
        isSessionValid(state.session) &&
        state.user !== null;

    return {
        isAuth: isValid,
        isMounted: state.isMounted,
        session: state.session,
        user: state.user,
        logout,
    };
};
