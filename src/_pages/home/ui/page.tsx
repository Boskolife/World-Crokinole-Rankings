import { Hero } from "@/widgets/hero";
import { StatsPreview } from "@/widgets/stats-preview";
import { Navigation } from "@/widgets/navigation";

export function HomePage() {
    return (
        <>
            <Hero />
            <StatsPreview />
            <Navigation />
        </>
    );
}
