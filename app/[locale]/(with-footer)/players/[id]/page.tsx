import { PlayerProfilePage } from "@/_pages/player-profile";

type PageProps = {
    params: Promise<{ id: string }>;
};

export default async function PlayerProfileRoute({ params }: PageProps) {
    const { id } = await params;
    return <PlayerProfilePage id={id} />;
}
