export interface IEventCardProps {
    id: number;
    image: string;
    title: string;
    price: string;
    date: string;
    location: string;
    format: string;
    latitude?: number | null;
    longitude?: number | null;
    isRanked?: boolean;
    isRegistrationRequired?: boolean;
    isPastEvent?: boolean;
    winner?: string;
    currentRank?: number;
    totalParticipants?: number;
    startDate?: string;
    structure?: string;
    strengthOfField?: number;
    tournamentPointsAvailable?: number;
}
