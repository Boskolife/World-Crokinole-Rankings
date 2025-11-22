import { Hero } from "@/widgets/hero";
import { StatsPreview } from "@/widgets/stats-preview";
import { Navigation } from "@/widgets/navigation";
import { News } from "@/widgets/news";

export function HomePage() {
    return (
        <>
            <Hero />
            <StatsPreview />
            <Navigation />
            <News />
        </>
    );
}
