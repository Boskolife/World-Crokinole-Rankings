import { Account } from "@/widgets/account";
import { Tournaments } from "@/widgets/tournaments";
import { SubscriptionManagement, ProfileCreatedEvents, ProfileMyClubs } from "@/shared/modules";
import { getTournaments } from "@/shared/supabase/data";
import { TournamentsClient } from "./TournamentsClient";
import { ProfileRatingMatchBadges } from "./ProfileRatingMatchBadges";

export async function ProfilePage() {
    const tournaments = await getTournaments();

    return (
        <>
            <Account />
            <div className="container">
                <SubscriptionManagement />
            </div>
            <TournamentsClient tournaments={tournaments} />
            <ProfileRatingMatchBadges />
            <div className="container">
                <ProfileCreatedEvents />
            </div>
            <div className="container">
                <ProfileMyClubs />
            </div>
        </>
    );
}
