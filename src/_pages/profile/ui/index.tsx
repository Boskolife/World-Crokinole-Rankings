import { Account } from "@/widgets/account";
import { MatchHistory } from "@/widgets/match-history";
import { Tournaments } from "@/widgets/tournaments";

export function ProfilePage() {
    return (
        <>
            <Account />
            <Tournaments />
            <MatchHistory />
        </>
    );
}
