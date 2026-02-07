"use client";

import { Clubs } from "@/widgets/clubs";

interface ClubsClientProps {
    title: string;
    needPagination?: boolean;
    createClubButton?: boolean;
}

export function ClubsClient({
    title,
    needPagination,
    createClubButton,
}: ClubsClientProps) {
    return (
        <Clubs
            title={title}
            needPagination={needPagination}
            createClubButton={createClubButton}
        />
    );
}

