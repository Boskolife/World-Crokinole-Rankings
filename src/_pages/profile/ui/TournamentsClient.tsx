"use client";

import { Tournaments } from "@/widgets/tournaments";
import type { ITournament } from "@/shared/types/tournament.interface";

interface TournamentsClientProps {
    tournaments: ITournament[];
}

export function TournamentsClient({ tournaments }: TournamentsClientProps) {
    return <Tournaments tournaments={tournaments} />;
}

