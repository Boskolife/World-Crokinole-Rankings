import { Account } from "@/widgets/account";
import { MatchHistory } from "@/widgets/match-history";
import { Tournaments } from "@/widgets/tournaments";
import { RatingList } from "@/widgets/rating-list";
import { Badges } from "@/widgets/badges";
import { getTournaments, getMatchHistory } from "@/shared/supabase/data";
import { TournamentsClient } from "./TournamentsClient";
import { MatchHistoryClient } from "./MatchHistoryClient";

export async function ProfilePage() {
    const [tournaments, matchHistory] = await Promise.all([
        getTournaments(),
        getMatchHistory(),
    ]);

    return (
        <>
            <Account />
            <TournamentsClient tournaments={tournaments} />
            <RatingList />
            <MatchHistoryClient matches={matchHistory} />
            <Badges />
        </>
    );
}
