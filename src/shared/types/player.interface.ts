export interface IPlayer {
    id: string;
    name: string;
    countryCode: string; // ISO country code for flag (e.g., "us", "ca", "fr", "ge")
    kingdom: string;
    club: string;
    rating: number;
}

