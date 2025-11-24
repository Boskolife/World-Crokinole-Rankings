export interface IEventCardProps {
    id: number;
    image: string;
    title: string;
    price: string;
    date: string;
    location: string;
    format: string;
    isRanked?: boolean;
    isRegistrationRequired?: boolean;
}
