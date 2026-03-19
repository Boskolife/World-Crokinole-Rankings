/**
 * Common dropdown options used across the application
 */

export interface DropdownOption {
    value: string;
    label: string;
}

export type StageFormatValue = "single_elimination" | "double_elimination";

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

export const locationCountryOptions: DropdownOption[] = [
    { value: "United States", label: "United States" },
    { value: "Canada", label: "Canada" },
    { value: "United Kingdom", label: "United Kingdom" },
    { value: "Australia", label: "Australia" },
    { value: "New Zealand", label: "New Zealand" },
    { value: "Other", label: "Other" },
];

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

export function getRatingListPeriodOptions(): DropdownOption[] {
    const year = new Date().getFullYear();
    return [
        { value: "both", label: `Last 24 months` },
        { value: "thisYear", label: `Jan – Dec ${year}` },
        { value: "lastYear", label: `Jan – Dec ${year - 1}` },
    ];
}

export const tournamentTypeOptions: DropdownOption[] = [
    { value: "ranked", label: "Ranked" },
    { value: "unranked", label: "Unranked" },
];

const POINTS_OPTIONS = [100, 150, 200, 220, 250, 300];
export const tournamentPointsOptions: DropdownOption[] = POINTS_OPTIONS.map((n) => ({
    value: String(n),
    label: String(n),
}));

const TOTAL_PLAYERS_OPTIONS = [4, 8, 16, 32, 64];
export const tournamentTotalPlayersOptions: DropdownOption[] = TOTAL_PLAYERS_OPTIONS.map((n) => ({
    value: String(n),
    label: String(n),
}));

export const tournamentOrganizerOptions: DropdownOption[] = [
    { value: "me", label: "Me" },
    { value: "club", label: "Club" },
    { value: "other", label: "Other" },
];

export const stageFormatOptions: DropdownOption[] = [
    { value: "single_elimination", label: "Single Elimination" },
    { value: "double_elimination", label: "Double Elimination" },
];

export const seedingMethodOptions: DropdownOption[] = [
    { value: "auto_rating", label: "Auto (by rating)" },
    { value: "manual", label: "Manual" },
    { value: "random", label: "Random" },
];

export const tournamentVisibilityOptions: DropdownOption[] = [
    { value: "draft", label: "Draft (not public)" },
    { value: "public", label: "Public" },
];