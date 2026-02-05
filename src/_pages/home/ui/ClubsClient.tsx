"use client";

import { Clubs } from "@/widgets/clubs";
import type { IClub } from "@/shared/types";

interface ClubsClientProps {
    title: string;
    clubs: IClub[];
    needViewAllButton?: boolean;
    totalItems?: number;
}

export function ClubsClient({
    title,
    clubs,
    needViewAllButton,
    totalItems,
}: ClubsClientProps) {
    return (
        <Clubs
            title={title}
            clubs={clubs}
            needViewAllButton={needViewAllButton}
            totalItems={totalItems}
        />
    );
}

