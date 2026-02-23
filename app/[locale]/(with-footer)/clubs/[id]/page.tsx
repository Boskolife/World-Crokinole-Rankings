import { ClubDetailPage } from "@/_pages/club-detail";

type PageProps = {
    params: Promise<{ id: string }>;
};

export default async function ClubDetailRoute({ params }: PageProps) {
    const { id } = await params;
    return <ClubDetailPage id={id} />;
}
