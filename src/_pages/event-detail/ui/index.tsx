import {
    EventDetailHero,
    EventQualifyingHeats,
    EventTournamentResults,
    EventRegisteredPlayers,
    EventDetailUpcomingEvents,
} from "@/widgets/event-detail";
import {
    getEventById,
    getEventRegisteredPlayers,
    getEventRegisteredPlayersByHeat,
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

    const [registeredPlayers, upcomingAtLocation, playersByHeat] = await Promise.all([
        getEventRegisteredPlayers(eventId),
        getUpcomingEventsAtLocation(event.location, event.id),
        hasQualifyingHeats && event.qualifyingHeats
            ? Promise.all(
                  event.qualifyingHeats.heats.map((_, i) =>
                      getEventRegisteredPlayersByHeat(eventId, i + 1)
                  )
              )
            : Promise.resolve([] as IPlayer[][]),
    ]);

    return (
        <>
            <EventDetailHero event={event} />
            {hasQualifyingHeats && event.qualifyingHeats && (
                <EventQualifyingHeats
                    eventId={event.id}
                    eventTitle={event.title}
                    qualifyingHeats={event.qualifyingHeats}
                    playersByHeat={playersByHeat}
                    isFull={
                        event.totalParticipants != null &&
                        event.currentRank != null &&
                        event.currentRank >= event.totalParticipants
                    }
                    totalParticipants={event.totalParticipants}
                    createdBy={event.createdBy}
                    isEventEnded={isEventEnded}
                    isRanked={event.isRanked}
                />
            )}
            {isEventEnded && <EventTournamentResults isRanked={event.isRanked} />}
            <EventRegisteredPlayers
                players={registeredPlayers}
                eventId={event.id}
                createdBy={event.createdBy}
            />
            <EventDetailUpcomingEvents events={upcomingAtLocation} />
        </>
    );
}
