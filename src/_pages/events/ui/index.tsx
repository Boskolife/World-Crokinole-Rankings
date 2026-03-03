import { HeroEvents } from "@/widgets/hero";
import { getFutureEvents, getPastEvents } from "@/shared/supabase/data";
import { EventsListClient } from "./EventsListClient";

export async function EventPage() {
    const [futureEvents, pastEvents] = await Promise.all([
        getFutureEvents(),
        getPastEvents(),
    ]);

    return (
        <>
            <HeroEvents />
            <EventsListClient
                futureEvents={futureEvents}
                pastEvents={pastEvents}
            />
        </>
    );
}
