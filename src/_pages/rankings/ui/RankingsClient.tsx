"use client";

import { Rankings } from "@/widgets/rankings";
import type { IRankList } from "@/shared/types";

interface RankingsClientProps {
    rankings: {
        laurels: IRankList[];
        singles: IRankList[];
        doubles: IRankList[];
    };
    defaultExpanded?: boolean;
}

export function RankingsClient({
    rankings,
    defaultExpanded = false,
}: RankingsClientProps) {
    return (
        <Rankings
            rankings={rankings}
            defaultExpanded
        />
    );
}
