"use client";

import { MatchHistory } from "@/widgets/match-history";
import type { IMatchHistory } from "@/shared/types/match-history.interface";

interface MatchHistoryClientProps {
    matches: IMatchHistory[];
}

export function MatchHistoryClient({ matches }: MatchHistoryClientProps) {
    return <MatchHistory matches={matches} />;
}


