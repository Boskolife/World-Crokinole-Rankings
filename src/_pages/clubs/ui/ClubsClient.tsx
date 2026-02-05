"use client";

import { Clubs } from "@/widgets/clubs";
import type { IClub } from "@/shared/types";

interface ClubsClientProps {
    title: string;
    clubs: IClub[];
    needPagination?: boolean;
    createClubButton?: boolean;
}

export function ClubsClient({
    title,
    clubs,
    needPagination,
    createClubButton,
}: ClubsClientProps) {
    return (
        <Clubs
            title={title}
            clubs={clubs}
            needPagination={needPagination}
            createClubButton={createClubButton}
        />
    );
}

