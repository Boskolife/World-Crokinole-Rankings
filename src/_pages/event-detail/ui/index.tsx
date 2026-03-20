"use client";

import React, { useEffect, useMemo, useState } from "react";
import {
    EventDetailHero,
    EventParticipationStats,
    EventQualifyingHeats,
    TournamentBracketGrid,
    EventRegisteredPlayers,
    EventDetailUpcomingEvents,
    PaymentReturnHandler,
} from "@/widgets/event-detail";
import {
    getEventById,
    getEventRegisteredPlayers,
    getEventRegisteredPlayersByHeat,
    getEventHeatResults,
    getUpcomingEventsAtLocation,
} from "@/shared/supabase/data";
import type { IEventCardProps, IPlayer } from "@/shared/types";
import type { EventHeatResultsData } from "@/shared/supabase/data";
import { useAuth } from "@/shared/hooks/use-auth";

interface EventDetailPageProps {
    id: string;
}

function getGamesPlayedCount(participantsCount: number, format: string): number {
    if (participantsCount <= 0) return 0;
    const f = (format || "").toLowerCase();
    const isDoubles = f === "doubles" || (f.includes("double") && !f.includes("singles or"));
    if (isDoubles) {
        const pairs = Math.floor(participantsCount / 2);
        return Math.max(0, pairs - 1);
    }
    return Math.max(0, participantsCount - 1);
}

export function EventDetailPage({ id }: EventDetailPageProps) {
    const { user, isMounted } = useAuth();

    const [loading, setLoading] = useState(true);
    const [notFound, setNotFound] = useState(false);

    const [event, setEvent] = useState<IEventCardProps | null>(null);
    const [registeredPlayers, setRegisteredPlayers] = useState<IPlayer[]>([]);
    const [upcomingAtLocation, setUpcomingAtLocation] = useState<IEventCardProps[]>([]);
    const [playersByHeat, setPlayersByHeat] = useState<IPlayer[][]>([]);
    const [heatResults, setHeatResults] = useState<EventHeatResultsData | null>(null);

    useEffect(() => {
        let alive = true;

        async function load() {
            if (!isMounted) return;
            const eventId = parseInt(id, 10);
            if (Number.isNaN(eventId)) {
                if (!alive) return;
                setNotFound(true);
                setLoading(false);
                return;
            }

            setLoading(true);
            setNotFound(false);

            try {
                const e = await getEventById(eventId);
                if (!alive) return;
                if (!e) {
                    setNotFound(true);
                    setLoading(false);
                    return;
                }

                const isTournament = (e.format ?? "").toLowerCase() === "tournament";
                const isDraft = (e.tournamentVisibility ?? "").toLowerCase() === "draft";
                const isCreator = Boolean(user?.id && e.createdBy === user.id);

                if (isTournament && isDraft && !isCreator) {
                    setNotFound(true);
                    setLoading(false);
                    return;
                }

                const [regs, upcoming] = await Promise.all([
                    getEventRegisteredPlayers(eventId),
                    getUpcomingEventsAtLocation(e.location, e.id),
                ]);

                const isEventEnded = (() => {
                    const ref = e.endDate || e.startDate;
                    if (!ref) return false;
                    return new Date(ref) < new Date();
                })();

                const hasQualifyingHeats =
                    e.qualifyingHeats?.heats?.length != null && e.qualifyingHeats.heats.length > 0;

                let nextPlayersByHeat: IPlayer[][] = [];
                let nextHeatResults: EventHeatResultsData | null = null;

                if (hasQualifyingHeats && e.qualifyingHeats) {
                    nextPlayersByHeat = await Promise.all(
                        e.qualifyingHeats.heats.map((_, i) =>
                            getEventRegisteredPlayersByHeat(eventId, i + 1)
                        )
                    );
                    if (isEventEnded) {
                        nextHeatResults = await getEventHeatResults(eventId);
                    }
                }

                if (!alive) return;
                setEvent(e);
                setRegisteredPlayers(regs);
                setUpcomingAtLocation(upcoming);
                setPlayersByHeat(nextPlayersByHeat);
                setHeatResults(nextHeatResults);
                setLoading(false);
            } catch {
                if (!alive) return;
                setNotFound(true);
                setLoading(false);
            }
        }

        load();

        return () => {
            alive = false;
        };
    }, [id, isMounted, user?.id]);

    useEffect(() => {
        const eventId = parseInt(id, 10);
        if (Number.isNaN(eventId)) return;

        const handler = (ev: CustomEvent<{ eventId: number }>) => {
            if (ev.detail?.eventId !== eventId) return;
            void (async () => {
                try {
                    const e = await getEventById(eventId);
                    if (!e) return;
                    const regs = await getEventRegisteredPlayers(eventId);
                    const refEnded = (() => {
                        const ref = e.endDate || e.startDate;
                        if (!ref) return false;
                        return new Date(ref) < new Date();
                    })();
                    const hasQ =
                        e.qualifyingHeats?.heats?.length != null && e.qualifyingHeats.heats.length > 0;
                    let nextPlayersByHeat: IPlayer[][] = [];
                    let nextHeatResults: EventHeatResultsData | null = null;
                    if (hasQ && e.qualifyingHeats) {
                        nextPlayersByHeat = await Promise.all(
                            e.qualifyingHeats.heats.map((_, i) =>
                                getEventRegisteredPlayersByHeat(eventId, i + 1)
                            )
                        );
                        if (refEnded) {
                            nextHeatResults = await getEventHeatResults(eventId);
                        }
                    }
                    setEvent(e);
                    setRegisteredPlayers(regs);
                    setPlayersByHeat(nextPlayersByHeat);
                    setHeatResults(nextHeatResults);
                } catch {
                    /* ignore */
                }
            })();
        };

        window.addEventListener("event-registration-updated", handler as EventListener);
        return () => window.removeEventListener("event-registration-updated", handler as EventListener);
    }, [id]);

    const isEventEnded = useMemo(() => {
        if (!event) return false;
        const ref = event.endDate || event.startDate;
        if (!ref) return false;
        return new Date(ref) < new Date();
    }, [event]);

    const hasQualifyingHeats = useMemo(() => {
        return Boolean(event?.qualifyingHeats?.heats?.length);
    }, [event]);

    const participationStats = useMemo(() => {
        if (!event || !isEventEnded) return null;
        return {
            participantsCount: registeredPlayers.length,
            gamesPlayedCount: getGamesPlayedCount(registeredPlayers.length, event.format),
            countriesCount: new Set(registeredPlayers.map((p) => p.countryCode).filter(Boolean)).size,
            clubsCount: new Set(registeredPlayers.map((p) => p.club).filter(Boolean)).size,
        };
    }, [event, isEventEnded, registeredPlayers]);

    const strengthOfField = useMemo(() => {
        if (!event || registeredPlayers.length === 0) return undefined;
        return Math.round(
            registeredPlayers.reduce((sum, p) => sum + (p.rating ?? 0), 0) / registeredPlayers.length
        );
    }, [event, registeredPlayers]);

    if (!isMounted || loading) {
        return <div>Loading...</div>;
    }

    if (notFound || !event) {
        return <div>Event not found.</div>;
    }

    return (
        <>
            <PaymentReturnHandler />
            <EventDetailHero event={{ ...event, strengthOfField }} />
            {isEventEnded && participationStats && (
                <EventParticipationStats
                    participantsCount={participationStats.participantsCount}
                    gamesPlayedCount={participationStats.gamesPlayedCount}
                    countriesCount={participationStats.countriesCount}
                    clubsCount={participationStats.clubsCount}
                />
            )}
            {hasQualifyingHeats && event.qualifyingHeats && (
                <EventQualifyingHeats
                    eventId={event.id}
                    eventTitle={event.title}
                    qualifyingHeats={event.qualifyingHeats}
                    playersByHeat={playersByHeat}
                    heatResults={heatResults ?? undefined}
                    isFull={
                        event.totalParticipants != null &&
                        event.currentRank != null &&
                        event.currentRank >= event.totalParticipants
                    }
                    totalParticipants={event.totalParticipants}
                    createdBy={event.createdBy}
                    isEventEnded={isEventEnded}
                    isRanked={event.isRanked}
                    fee={event.price}
                    isTournament={(event.format ?? "").toLowerCase() === "tournament"}
                />
            )}
            {(event.format ?? "").toLowerCase() === "tournament" && event.structure && (
                <TournamentBracketGrid
                    structure={event.structure}
                    players={registeredPlayers}
                    totalParticipants={event.totalParticipants}
                    winner={event.winner}
                />
            )}
            <EventRegisteredPlayers
                players={registeredPlayers}
                eventId={event.id}
                createdBy={event.createdBy}
                isTournament={(event.format ?? "").toLowerCase() === "tournament"}
            />
            <EventDetailUpcomingEvents events={upcomingAtLocation} />
        </>
    );
}
