import { Hero } from "@/widgets/hero";
import { StatsPreview } from "@/widgets/stats-preview";
import { Navigation } from "@/widgets/navigation";
import { News } from "@/widgets/news";
import { Rankings } from "@/widgets/rankings";
import { Events } from "@/widgets/events";

export function HomePage() {
    return (
        <>
            <Hero />
            <StatsPreview />
            <Navigation />
            <News />
            <Rankings />
            <Events />
        </>
    );
}
