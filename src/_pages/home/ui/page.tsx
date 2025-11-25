import { Hero } from "@/widgets/hero";
import { StatsPreview } from "@/widgets/stats-preview";
import { Navigation } from "@/widgets/navigation";
import { News } from "@/widgets/news";
import { Rankings } from "@/widgets/rankings";
import { Events } from "@/widgets/events";
import { Clubs } from "@/widgets/clubs";
import { Plans } from "@/widgets/plans";
import eventsList from "@/data/events-list.json";

const events = eventsList.events;

export function HomePage() {
    return (
        <>
            <Hero />
            <StatsPreview />
            <Navigation />
            <News />
            <Rankings />
            <Events
                title="Future events"
                events={events}
                needViewAllButton={true}
                totalItems={6}
            />
            <Clubs />
            <Plans />
        </>
    );
}
