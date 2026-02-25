import { getPlayerById, getTournaments, getMatchHistory } from "@/shared/supabase/data";
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

    const [tournaments, matchHistory] = await Promise.all([
        getTournaments(),
        getMatchHistory(),
    ]);

    return (
        <div className={css.wrapper}>
            <div className="container">
                <h2 className={css.title}>Player profile</h2>
            </div>
            <PlayerProfileView player={player} />
            <Tournaments tournaments={tournaments} />
            <RatingList />
            <MatchHistory matches={matchHistory} />
            <Badges />
        </div>
    );
}
