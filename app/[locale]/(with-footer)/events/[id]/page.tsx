import { EventDetailPage } from "@/_pages/event-detail";

type PageProps = {
    params: Promise<{ id: string }>;
};

export default async function EventDetailRoute({ params }: PageProps) {
    const { id } = await params;
    return <EventDetailPage id={id} />;
}
