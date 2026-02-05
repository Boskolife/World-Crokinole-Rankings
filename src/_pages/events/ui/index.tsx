import { Events } from "@/widgets/events";
import { HeroSecondary } from "@/widgets/hero-secondary";
import { getEvents } from "@/shared/supabase/data";
import { EventsClient } from "./EventsClient";

export async function EventPage() {
    const events = await getEvents();

    return (
        <>
            <HeroSecondary
                title="Discover BrownCastle Events"
                description="Discover a world of exciting tournaments and meetings. Find events near you or online, register in a few clicks and join competitions of various formats. Here you can test your strength, meet new opponents and gain valuable experience on the way to new victories."
            />
            <EventsClient
                title="Future events"
                events={events}
                needPagination
                totalItems={events.length}
            />
            <EventsClient
                isPastEvents
                title="Past events" 
                events={events}
                needPagination
                totalItems={events.length}
            />
        </>
    );
}
