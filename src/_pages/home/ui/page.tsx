import { Hero } from "@/widgets/hero";
import { StatsPreview } from "@/widgets/stats-preview";
import { Navigation } from "@/widgets/navigation";
import { News } from "@/widgets/news";
import { Rankings } from "@/widgets/rankings";
import { Events } from "@/widgets/events";
import { Clubs } from "@/widgets/clubs";
import { SubscribePlans } from "@/shared/modules";
import { getEvents, getAllRankings, getClubs } from "@/shared/supabase/data";
import { EventsClient } from "./EventsClient";
import { RankingsClient } from "./RankingsClient";
import { ClubsClient } from "./ClubsClient";

export async function HomePage() {
    const [events, rankings, clubs] = await Promise.all([
        getEvents(),
        getAllRankings(),
        getClubs(),
    ]);

    return (
        <>
            <Hero />
            <StatsPreview />
            <Navigation />
            <News />
            <RankingsClient rankings={rankings} />
            <EventsClient
                title="Future events"
                events={events}
                needViewAllButton={true}
                totalItems={6}
            />
            <ClubsClient
                title="Clubs"
                clubs={clubs}
                needViewAllButton={true}
                totalItems={6}
            />
            <SubscribePlans
                title="Upgrade to Premium to create ranked events and unlock more
                features"
            />
        </>
    );
}
