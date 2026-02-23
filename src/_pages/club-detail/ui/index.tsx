import {
    getClubById,
    getClubMembers,
    getClubAdmins,
    getClubDiscounts,
} from "@/shared/supabase/data";
import { notFound } from "next/navigation";
import { ClubDetailClient } from "./ClubDetailClient";

interface ClubDetailPageProps {
    id: string;
}

export async function ClubDetailPage({ id }: ClubDetailPageProps) {
    const clubId = parseInt(id, 10);
    if (Number.isNaN(clubId)) notFound();

    const club = await getClubById(clubId);
    if (!club) notFound();

    const [members, admins, discounts] = await Promise.all([
        getClubMembers(club.title, clubId),
        getClubAdmins(clubId),
        getClubDiscounts(clubId),
    ]);

    return (
        <ClubDetailClient
            club={club}
            members={members}
            admins={admins}
            discounts={discounts}
        />
    );
}
