"use client";

import { Rankings } from "@/widgets/rankings";
import type { IRankList } from "@/shared/types";

interface RankingsClientProps {
    rankings: {
        laurels: IRankList[];
        singles: IRankList[];
        doubles: IRankList[];
    };
}

export function RankingsClient({ rankings }: RankingsClientProps) {
    return <Rankings rankings={rankings} />;
}

