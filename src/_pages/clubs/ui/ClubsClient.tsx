"use client";

import { Clubs } from "@/widgets/clubs";

interface ClubsClientProps {
    title: string;
    needPagination?: boolean;
}

export function ClubsClient({
    title,
    needPagination,
}: ClubsClientProps) {
    return (
        <Clubs
            title={title}
            needPagination={needPagination}
        />
    );
}

