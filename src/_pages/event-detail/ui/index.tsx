import {
    EventDetailHero,
    EventParticipationStats,
    EventQualifyingHeats,
    EventRegisteredPlayers,
    EventDetailUpcomingEvents,
} from "@/widgets/event-detail";
import {
    getEventById,
    getEventRegisteredPlayers,
    getEventRegisteredPlayersByHeat,
    getEventHeatResults,
    getUpcomingEventsAtLocation,
} from "@/shared/supabase/data";
import type { IPlayer } from "@/shared/types";
import { notFound } from "next/navigation";

interface EventDetailPageProps {
    id: string;
}

export async function EventDetailPage({ id }: EventDetailPageProps) {
    const eventId = parseInt(id, 10);
    if (Number.isNaN(eventId)) notFound();

    const event = await getEventById(eventId);
    if (!event) notFound();

    const isEventEnded = (() => {
        const ref = event.endDate || event.startDate;
        if (!ref) return false;
        return new Date(ref) < new Date();
    })();

    const hasQualifyingHeats =
        event.qualifyingHeats?.heats?.length != null &&
        event.qualifyingHeats.heats.length > 0;

    const [registeredPlayers, upcomingAtLocation, playersByHeat, heatResults] = await Promise.all([
        getEventRegisteredPlayers(eventId),
        getUpcomingEventsAtLocation(event.location, event.id),
        hasQualifyingHeats && event.qualifyingHeats
            ? Promise.all(
                  event.qualifyingHeats.heats.map((_, i) =>
                      getEventRegisteredPlayersByHeat(eventId, i + 1)
                  )
              )
            : Promise.resolve([] as IPlayer[][]),
        hasQualifyingHeats && isEventEnded ? getEventHeatResults(eventId) : Promise.resolve(null),
    ]);

    function getGamesPlayedCount(participantsCount: number, format: string): number {
        if (participantsCount <= 0) return 0;
        const f = (format || "").toLowerCase();
        const isDoubles =
            f === "doubles" ||
            (f.includes("double") && !f.includes("singles or"));
        if (isDoubles) {
            const pairs = Math.floor(participantsCount / 2);
            return Math.max(0, pairs - 1);
        }
        return Math.max(0, participantsCount - 1);
    }

    const participationStats = isEventEnded
        ? {
              participantsCount: registeredPlayers.length,
              gamesPlayedCount: getGamesPlayedCount(
                  registeredPlayers.length,
                  event.format
              ),
              countriesCount: new Set(
                  registeredPlayers.map((p) => p.countryCode).filter(Boolean)
              ).size,
              clubsCount: new Set(
                  registeredPlayers.map((p) => p.club).filter(Boolean)
              ).size,
          }
        : null;

    return (
        <>
            <EventDetailHero event={event} />
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
                />
            )}
            <EventRegisteredPlayers
                players={registeredPlayers}
                eventId={event.id}
                createdBy={event.createdBy}
            />
            <EventDetailUpcomingEvents events={upcomingAtLocation} />
        </>
    );
}
