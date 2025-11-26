import { Account } from "@/widgets/account";
import { MatchHistory } from "@/widgets/match-history";
import { Tournaments } from "@/widgets/tournaments";
import { RatingList } from "@/widgets/rating-list";

export function ProfilePage() {
    return (
        <>
            <Account />
            <Tournaments />
            <RatingList />
            <MatchHistory />
        </>
    );
}
