export interface INewsItem {
    id: number;
    image: string | null;
    title: string;
    description: string;
    link: string;
    linkText: string;
    sortOrder?: number;
    createdAt?: string;
}
