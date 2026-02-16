import { getAllRankings } from "@/shared/supabase/data";
import { RankingsClient } from "./RankingsClient";

export async function RankingsPage() {
    const rankings = await getAllRankings();

    return (
        <RankingsClient
            rankings={rankings}
            defaultExpanded
        />
    );
}
