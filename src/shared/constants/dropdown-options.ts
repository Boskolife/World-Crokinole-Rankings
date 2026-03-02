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
    { value: "singles_or_doubles", label: "Singles or Doubles" },
];

export const eventTypeOptions: DropdownOption[] = [
    { value: "ranked", label: "Ranked" },
    { value: "unranked", label: "Unranked" },
];

export const needToRegisterOptions: DropdownOption[] = [
    { value: "yes", label: "Yes" },
    { value: "no", label: "No" },
];

const QUALIFYING_HEATS_MAX = 10;
export const qualifyingHeatsOptions: DropdownOption[] = [
    { value: "0", label: "No qualifying heats" },
    ...Array.from({ length: QUALIFYING_HEATS_MAX }, (_, i) => {
        const n = i + 1;
        return {
            value: String(n),
            label: n === 1 ? "1 qualifying heat" : `${n} qualifying heats`,
        };
    }),
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
    { value: "id", label: "Default" },
    { value: "members-desc", label: "Members (High to Low)" },
    { value: "members-asc", label: "Members (Low to High)" },
];

export const ratingListSwitcherOptions: DropdownOption[] = [
    { value: "Singles", label: "Singles" },
    { value: "Doubles", label: "Doubles" },
];

export const ratingListDropdownOptions: DropdownOption[] = [
    { value: "Jan 2025 - Sep 2025 ", label: "Jan 2025 - Sep 2025 " },
    { value: "Oct 2025 - Dec 2025", label: "Oct 2025 - Dec 2025" },
];