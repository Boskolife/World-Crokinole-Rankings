import { Clubs } from "@/widgets/clubs";
import { HeroSecondary } from "@/widgets/hero-secondary";

export function ClubsPage() {
    return (
        <>
            <HeroSecondary
                title="Gaming Clubs"
                description="Join a club to unlock exclusive bonuses and compete with fellow gamers"
            />
            <Clubs title="Join a club" needPagination={true} createClubButton={true} />
        </>
    );
}
