"use client";

import { useEffect } from "react";
import { useRouter, useParams } from "next/navigation";
import { useAuth, useUserProfile } from "@/shared/hooks";
import { localeConfig } from "@/app/localization/config";
import { CreateTournamentForm } from "@/widgets/events/create-tournament-form";
import type { CreateTournamentFormSubmitData } from "@/widgets/events/create-tournament-form";
import { createEvent } from "@/shared/supabase/data";
import {
    isSupabaseConfigured,
    supabaseConfigError,
} from "@/shared/supabase/client";
import { localInTimezoneToUtc } from "@/shared/lib/event-timezone";
import css from "@/widgets/events/create-tournament-form/styles.module.scss";

export default function CreateTournamentPage() {
    const { isAuth, isMounted, user } = useAuth();
    const { profile, isLoading: profileLoading } = useUserProfile();
    const router = useRouter();
    const params = useParams() as { locale?: string };
    const locale = params?.locale ?? localeConfig.defaultLocale;
    const profileReady = !profileLoading && profile !== null;

    useEffect(() => {
        if (!isMounted) return;
        if (!isAuth) {
            router.push(`/${locale}/auth/sign-in`);
        }
    }, [isMounted, isAuth, locale, router]);

    if (!isMounted || !isAuth) {
        return (
            <div className={css.hero}>
                <div className={css.backLink}>Redirecting...</div>
            </div>
        );
    }

    if (!profileReady) {
        return (
            <div className={css.hero}>
                <div className={css.backLink}>Loading...</div>
            </div>
        );
    }

    const handleSubmit = async (data: CreateTournamentFormSubmitData) => {
        if (!isSupabaseConfigured) {
            throw new Error(supabaseConfigError ?? "Supabase is not configured");
        }
        const { step1, step2, coverFile, locationLatLng, timezone } = data;
        if (!(step1.location ?? "").trim()) {
            throw new Error("Location is required");
        }
        const toUtc = timezone
            ? (localStr: string) => localInTimezoneToUtc(localStr, timezone)
            : (localStr: string) => new Date(localStr).toISOString();
        const startDate = toUtc(step1.startDateTime);
        const endDate = toUtc(step1.endDateTime);
        if (endDate <= startDate) {
            throw new Error("End date & time must be after start date & time");
        }
        const price = (step1.fee ?? "").trim() === "" ? "0" : step1.fee.trim();
        const capacity = (step1.totalPlayers ?? "").trim() === "" ? null : parseInt(step1.totalPlayers, 10);
        const numCapacity = capacity !== null && !Number.isNaN(capacity) ? capacity : null;
        const points = (step1.pointsAvailable ?? "").trim() === "" ? null : parseInt(step1.pointsAvailable, 10);
        const tournamentPoints = points !== null && !Number.isNaN(points) ? points : null;
        const structure = JSON.stringify({
            description: (step1.description ?? "").trim() || undefined,
            stages: step2.stages?.length ? step2.stages : undefined,
        });

        const created = await createEvent({
            title: (step1.title ?? "").trim(),
            startDate,
            endDate,
            location: (step1.location ?? "").trim(),
            format: "Tournament",
            isRanked: step1.eventType === "ranked",
            isRegistrationRequired: true,
            price,
            structure,
            coverFile,
            capacity: numCapacity,
            tournamentPointsAvailable: tournamentPoints,
            createdByUserId: user?.id ?? undefined,
            latitude: locationLatLng?.lat,
            longitude: locationLatLng?.lng,
            timezone: timezone ?? undefined,
        });
        router.push(`/${locale}/events/${created.id}`);
    };

    return (
        <CreateTournamentForm
            backLinkHref={`/${locale}/events`}
            backLinkLabel="Back to Events"
            onSubmit={handleSubmit}
        />
    );
}
