import { Clubs } from "@/widgets/clubs";
import { HeroSecondary } from "@/widgets/hero-secondary";
import { getClubs } from "@/shared/supabase/data";
import { ClubsClient } from "./ClubsClient";

export async function ClubsPage() {
    const clubs = await getClubs();

    return (
        <>
            <HeroSecondary
                title="Gaming Clubs"
                description="Join a club to unlock exclusive bonuses and compete with fellow gamers"
            />
            <ClubsClient
                title="Join a club"
                clubs={clubs}
                needPagination={true}
                createClubButton={true}
            />
        </>
    );
}
