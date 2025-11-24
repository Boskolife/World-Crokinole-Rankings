export interface IClub {
    id: number;
    image: string;
    title: string;
    description: string;
    members: number;
    location: string;
    labels: string;
    country: string;

    //TODO: Rename for backend integration
    labelItem1: string;
    labelItem2: string;
    //TODO: Rename for backend integration
    hosted: number;
    veteranPlayers: number;

    isLocked?: boolean;
}
