import { Events } from "@/widgets/events";
import eventsList from "@/data/events-list.json";
import { HeroSecondary } from "@/widgets/hero-secondary";

const events = eventsList.events;

export function EventPage() {
    return (
        <>
            <HeroSecondary
                title="Discover BrownCastle Events"
                description="Discover a world of exciting tournaments and meetings. Find events near you or online, register in a few clicks and join competitions of various formats. Here you can test your strength, meet new opponents and gain valuable experience on the way to new victories."
            />
            <Events
                title="Future events"
                events={events}
                needPagination
                totalItems={events.length}
            />
            <Events
                isPastEvents
                title="Past events" 
                events={events}
                needPagination
                totalItems={events.length}
            />
        </>
    );
}
