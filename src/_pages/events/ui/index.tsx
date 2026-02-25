import { Events } from "@/widgets/events";
import { HeroEvents } from "@/widgets/hero";
import { getFutureEvents, getPastEvents } from "@/shared/supabase/data";
import { EventsClient } from "./EventsClient";

export async function EventPage() {
    const [futureEvents, pastEvents] = await Promise.all([
        getFutureEvents(),
        getPastEvents(),
    ]);

    return (
        <>
            <HeroEvents />
            <div id="events-list">
                <EventsClient
                    title="Future events"
                    events={futureEvents}
                    needPagination
                    totalItems={futureEvents.length}
                />
                <EventsClient
                    isPastEvents
                    title="Past events"
                    events={pastEvents}
                    needPagination
                    totalItems={pastEvents.length}
                />
            </div>
        </>
    );
}
