import { getPlayerById, getTournaments, getMatchHistoryFromSinglesAndDoubles, getRatingHistoryFromSinglesAndDoubles, updatePlayerRatingsFromMatches } from "@/shared/supabase/data";
import { notFound } from "next/navigation";
import { PlayerProfileView } from "@/shared/modules";
import { Tournaments } from "@/widgets/tournaments";
import { RatingList } from "@/widgets/rating-list";
import { MatchHistory } from "@/widgets/match-history";
import { Badges } from "@/widgets/badges";
import css from "./styles.module.scss";

interface PlayerProfilePageProps {
    id: string;
}

export async function PlayerProfilePage({ id }: PlayerProfilePageProps) {
    const player = await getPlayerById(id);
    if (!player) notFound();

    const [tournaments, matchHistory, ratingData] = await Promise.all([
        getTournaments(),
        getMatchHistoryFromSinglesAndDoubles(player.id),
        getRatingHistoryFromSinglesAndDoubles(player.id),
    ]);

    updatePlayerRatingsFromMatches(
        player.id,
        ratingData.singles.currentValue,
        ratingData.doubles.currentValue,
        ratingData.singles.matchCount > 0,
        ratingData.doubles.matchCount > 0
    ).catch(() => {});

    return (
        <div className={css.wrapper}>
            <div className="container">
                <h2 className={css.title}>Player profile</h2>
            </div>
            <PlayerProfileView
                player={player}
                singlesRatingFromMatches={ratingData.singles.currentValue}
                doublesRatingFromMatches={ratingData.doubles.currentValue}
            />
            <Tournaments tournaments={tournaments} />
            <RatingList ratingData={ratingData} />
            <MatchHistory matches={matchHistory} />
            <Badges />
        </div>
    );
}
