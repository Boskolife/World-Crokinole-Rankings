import { EventDetailHero, EventQualifyingHeats } from "@/widgets/event-detail";
import { getEventById } from "@/shared/supabase/data";
import { notFound } from "next/navigation";

interface EventDetailPageProps {
    id: string;
}

export async function EventDetailPage({ id }: EventDetailPageProps) {
    const eventId = parseInt(id, 10);
    if (Number.isNaN(eventId)) notFound();

    const event = await getEventById(eventId);
    if (!event) notFound();

    const hasQualifyingHeats =
        event.qualifyingHeats?.heats?.length != null &&
        event.qualifyingHeats.heats.length > 0;

    return (
        <>
            <EventDetailHero event={event} />
            {hasQualifyingHeats && event.qualifyingHeats && (
                <EventQualifyingHeats
                    eventId={event.id}
                    eventTitle={event.title}
                    qualifyingHeats={event.qualifyingHeats}
                />
            )}
        </>
    );
}
