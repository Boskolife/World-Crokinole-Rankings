import { Events } from "@/widgets/events";
import eventsList from "@/data/events-list.json";
import { HeroSecondary } from "@/widgets/hero-secondary";

const events = eventsList.events;

export function EventPage() {
    return (
        <>
            <HeroSecondary />
            <Events
                title="Future events"
                events={events}
                needPagination
                totalItems={events.length}
            />
            <Events
                title="Past events"
                events={events}
                needPagination
                totalItems={events.length}
            />
        </>
    );
}
