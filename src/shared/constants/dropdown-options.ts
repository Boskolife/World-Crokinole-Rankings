/**
 * Common dropdown options used across the application
 */

export interface DropdownOption {
    value: string;
    label: string;
}

// Location/World options (used in Rankings and Events)
export const worldOptions: DropdownOption[] = [
    { value: "world", label: "World" },
    { value: "kingdom", label: "Kingdom" },
    { value: "region", label: "Region" },
];

// Alias for consistency with Events component
export const locationOptions = worldOptions;

// Kingdom filter options (used in Rankings)
export const kingdomFilterOptions: DropdownOption[] = [
    { value: "kingdom", label: "Kingdom" },
    { value: "region", label: "Region" },
];

// Club filter options (used in Rankings)
export const clubFilterOptions: DropdownOption[] = [
    { value: "club", label: "Club" },
    { value: "region", label: "Region" },
];

// Format options (used in Events, similar to Rankings switcher)
export const formatOptions: DropdownOption[] = [
    { value: "singles", label: "Singles" },
    { value: "doubles", label: "Doubles" },
];

// Rankings category switcher options
export type RankingsCategoryValue = "laurels" | "singles" | "doubles";

export const rankingsSwitcherOptions: {
    value: RankingsCategoryValue;
    label: string;
}[] = [
    { value: "laurels", label: "Laurels" },
    { value: "singles", label: "Singles" },
    { value: "doubles", label: "Doubles" },
];

// Example kingdom options (used in Players and Clubs as placeholder/test data)
export const exampleKingdomOptions: DropdownOption[] = [
    { value: "kingdom-1", label: "Kingdom 1" },
    { value: "kingdom-2", label: "Kingdom 2" },
    { value: "kingdom-3", label: "Kingdom 3" },
];

// Sort order options (used for sorting by rank/rating)
export const sortOrderOptions: DropdownOption[] = [
    { value: "rank-asc", label: "Rank Ascending" },
    { value: "rank-desc", label: "Rank Descending" },
];

export const ratingListSwitcherOptions: DropdownOption[] = [
    { value: "Singles", label: "Singles" },
    { value: "Doubles", label: "Doubles" },
];

export const ratingListDropdownOptions: DropdownOption[] = [
    { value: "Jan 2025 - Sep 2025 ", label: "Jan 2025 - Sep 2025 " },
    { value: "Oct 2025 - Dec 2025", label: "Oct 2025 - Dec 2025" },
];