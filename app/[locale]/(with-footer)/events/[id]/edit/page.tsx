"use client";

import { useEffect } from "react";
import { useRouter, useParams } from "next/navigation";
import { useAuth } from "@/shared/hooks/use-auth";
import { getEventById, updateEvent } from "@/shared/supabase/data";
import {
    isSupabaseConfigured,
    supabaseConfigError,
} from "@/shared/supabase/client";
import { localInTimezoneToUtc, utcToLocalDateTime } from "@/shared/lib/event-timezone";
import { localeConfig } from "@/app/localization/config";
import { EditEventForm } from "@/widgets/events/edit-event-form/EditEventForm";
import { CreateTournamentForm } from "@/widgets/events/create-tournament-form";
import type {
    CreateTournamentFormInitialData,
    CreateTournamentFormSubmitData,
    CreateTournamentStageValues,
} from "@/widgets/events/create-tournament-form";
import css from "@/widgets/events/create-event-form/styles.module.scss";
import type { IEventCardProps } from "@/shared/types";
import { useState } from "react";
import type { StageFormatValue } from "@/shared/constants/dropdown-options";

function normalizeStageFormat(value: string): StageFormatValue {
    return value === "double_elimination" ? "double_elimination" : "single_elimination";
}

function toDisplayDateTime(iso: string | undefined, timezone?: string | null): string {
    if (!iso) return "";
    if (timezone) return utcToLocalDateTime(iso, timezone);
    const d = new Date(iso);
    const y = d.getFullYear();
    const m = String(d.getMonth() + 1).padStart(2, "0");
    const day = String(d.getDate()).padStart(2, "0");
    const h = String(d.getHours()).padStart(2, "0");
    const min = String(d.getMinutes()).padStart(2, "0");
    return `${y}-${m}-${day}T${h}:${min}`;
}

function parseTournamentStructure(
    structure: string | undefined
): { description: string; stages: CreateTournamentStageValues[] } {
    let description = "";
    let stages: CreateTournamentStageValues[] = [];
    const raw = (structure ?? "").trim();
    if (!raw) return { description, stages };
    if (raw.startsWith("{")) {
        try {
            const parsed = JSON.parse(raw) as { description?: string; stages?: CreateTournamentStageValues[] };
            description = (parsed.description ?? "").trim();
            if (Array.isArray(parsed.stages) && parsed.stages.length > 0) {
                stages = parsed.stages.map((s) => ({
                    stageFormat: normalizeStageFormat(String(s?.stageFormat ?? "single_elimination")),
                    seedingMethod: String(s?.seedingMethod ?? "auto_rating"),
                    numberOfRounds: String(s?.numberOfRounds ?? ""),
                }));
            }
        } catch {
            description = raw;
        }
    } else {
        const idx = raw.indexOf("{\"stages\":");
        if (idx >= 0) {
            description = raw.slice(0, idx).trim();
            try {
                const parsed = JSON.parse(raw.slice(idx)) as { stages?: CreateTournamentStageValues[] };
                if (Array.isArray(parsed.stages) && parsed.stages.length > 0) {
                    stages = parsed.stages.map((s) => ({
                        stageFormat: normalizeStageFormat(String(s?.stageFormat ?? "single_elimination")),
                        seedingMethod: String(s?.seedingMethod ?? "auto_rating"),
                        numberOfRounds: String(s?.numberOfRounds ?? ""),
                    }));
                }
            } catch {
                //
            }
        } else {
            description = raw;
        }
    }
    if (stages.length === 0) {
        stages = [{ stageFormat: "single_elimination", seedingMethod: "auto_rating", numberOfRounds: "" }];
    }
    return { description, stages };
}

function buildTournamentInitialData(event: IEventCardProps): CreateTournamentFormInitialData {
    const { description, stages } = parseTournamentStructure(event.structure);
    const tz = event.timezone ?? undefined;
    const fee = event.price === "Free" || event.price === "free" ? "" : (event.price ?? "");
    return {
        step1: {
            title: event.title ?? "",
            description,
            eventType: event.isRanked ? "ranked" : "unranked",
            pointsAvailable: String(event.tournamentPointsAvailable ?? 220),
            organizer: "me",
            totalPlayers: String(event.totalParticipants ?? 8),
            location: event.location ?? "",
            startDateTime: toDisplayDateTime(event.startDate, tz),
            endDateTime: toDisplayDateTime(event.endDate, tz),
            fee,
        },
        step2: { stages },
        step3: {
            track20s: true,
            playerScoreConfirmation: true,
            tournamentVisibility: event.tournamentVisibility ?? "draft",
        },
    };
}

export default function EditEventPage() {
    const { isAuth, user, isMounted } = useAuth();
    const router = useRouter();
    const params = useParams() as { locale?: string; id?: string };
    const locale = params?.locale ?? localeConfig.defaultLocale;
    const eventId = params?.id;
    const [event, setEvent] = useState<IEventCardProps | null>(null);
    const [loading, setLoading] = useState(true);
    const [notFound, setNotFound] = useState(false);

    useEffect(() => {
        if (!isMounted || !eventId) return;
        if (!isAuth) {
            router.push(`/${locale}/auth/sign-in`);
            return;
        }
        const id = parseInt(String(eventId), 10);
        if (Number.isNaN(id)) {
            setNotFound(true);
            setLoading(false);
            return;
        }
        getEventById(id).then((e) => {
            setEvent(e ?? null);
            setNotFound(!e);
            setLoading(false);
        });
    }, [isMounted, isAuth, eventId, locale, router]);

    useEffect(() => {
        if (!loading && event && user?.id && event.createdBy !== user.id) {
            router.push(`/${locale}/events/${eventId}`);
        }
    }, [loading, event, user?.id, locale, eventId, router]);

    if (!isMounted || !isAuth) {
        return (
            <div className={css.hero}>
                <div className={css.backLink}>Redirecting...</div>
            </div>
        );
    }

    if (loading) {
        return (
            <div className={css.hero}>
                <div className={css.backLink}>Loading...</div>
            </div>
        );
    }

    if (notFound || !event) {
        return (
            <div className={css.hero}>
                <div className={css.backLink}>Event not found.</div>
            </div>
        );
    }

    if (event.createdBy !== user?.id) {
        return null;
    }

    const isTournament = (event.format ?? "").toLowerCase() === "tournament";

    const handleTournamentUpdate = async (data: CreateTournamentFormSubmitData) => {
        if (!isSupabaseConfigured) {
            throw new Error(supabaseConfigError ?? "Supabase is not configured");
        }
        const { step1, step2, step3, coverFile, locationLatLng, timezone } = data;
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
        const normalizedStages = step2.stages?.length
            ? step2.stages.map((stage) => ({
                  ...stage,
                  stageFormat: normalizeStageFormat(stage.stageFormat),
              }))
            : undefined;
        const structure = JSON.stringify({
            description: (step1.description ?? "").trim() || undefined,
            stages: normalizedStages,
        });

        await updateEvent(event.id, {
            title: (step1.title ?? "").trim(),
            startDate,
            endDate,
            location: (step1.location ?? "").trim(),
            format: "Tournament",
            isRanked: step1.eventType === "ranked",
            isRegistrationRequired: true,
            price,
            structure,
            coverFile: coverFile ?? undefined,
            capacity: numCapacity,
            tournamentPointsAvailable: tournamentPoints,
            latitude: locationLatLng?.lat,
            longitude: locationLatLng?.lng,
            timezone: timezone ?? undefined,
            tournamentVisibility: step3.tournamentVisibility ?? "draft",
        });
        router.push(`/${locale}/events/${event.id}`);
    };

    if (isTournament) {
        const initialData = buildTournamentInitialData(event);
        return (
            <CreateTournamentForm
                backLinkHref={`/${locale}/events/${event.id}`}
                backLinkLabel="Back to Event"
                initialData={initialData}
                initialCoverUrl={event.image}
                initialLocationLatLng={
                    event.latitude != null && event.longitude != null
                        ? { lat: event.latitude, lng: event.longitude }
                        : null
                }
                initialTimezone={event.timezone ?? null}
                onSubmit={handleTournamentUpdate}
            />
        );
    }

    return (
        <EditEventForm
            event={event}
            backLinkHref={`/${locale}/events/${event.id}`}
            backLinkLabel="Back to Event"
            successRedirect={`/${locale}/events/${event.id}`}
        />
    );
}
