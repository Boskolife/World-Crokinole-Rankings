import { Players } from "@/widgets/players/ui";
import { getPlayers } from "@/shared/supabase/data";

export async function PlayersPage() {
    const players = await getPlayers();

    return <Players players={players} />;
}