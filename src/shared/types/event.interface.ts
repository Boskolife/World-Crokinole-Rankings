export interface QualifyingHeatSlot {
    start: string;
    end: string;
}

export interface QualifyingHeatsData {
    heats: QualifyingHeatSlot[];
    final?: QualifyingHeatSlot;
}

export interface IEventCardProps {
    id: number;
    createdBy?: string | null;
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
    endDate?: string;
    timezone?: string | null;
    structure?: string;
    strengthOfField?: number;
    tournamentPointsAvailable?: number;
    qualifyingHeats?: QualifyingHeatsData | null;
}
