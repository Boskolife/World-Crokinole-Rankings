import { HeroSecondary } from "@/widgets/hero-secondary";
import { ClubsClient } from "./ClubsClient";

export async function ClubsPage() {
    return (
        <>
            <HeroSecondary
                title="Gaming Clubs"
                description="Join a club to unlock exclusive bonuses and compete with fellow gamers"
            />
            <ClubsClient
                title="Join a club"
                needPagination={true}
                createClubButton={true}
            />
        </>
    );
}
