import { HeroClubs } from "@/widgets/hero";
import { ClubsClient } from "./ClubsClient";

export async function ClubsPage() {
    return (
        <>
            <HeroClubs />
            <div id="clubs-list">
                <ClubsClient
                    title="Join a club"
                    needPagination={true}
                />
            </div>
        </>
    );
}
