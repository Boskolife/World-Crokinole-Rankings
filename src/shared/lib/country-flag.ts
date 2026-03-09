import { byCountry, byIso } from "country-code-lookup";

const COUNTRY_ALIASES: Record<string, string> = {
    usa: "US",
    "united states": "US",
    "united states of america": "US",
    uk: "GB",
    "united kingdom": "GB",
    "great britain": "GB",
    nz: "NZ",
    "new zealand": "NZ",
    au: "AU",
    australia: "AU",
    ca: "CA",
    canada: "CA",
    other: "US",
};

const FLAG_CDN_BASE = "https://flagcdn.com";
const DEFAULT_FLAG_URL = "/images/usa.png";

function normalizeForLookup(s: string): string {
    return s.trim().toLowerCase();
}

export function getCountryCodeFromString(input: string | null | undefined): string | null {
    if (input == null || (input = input.trim()) === "") return null;
    const normalized = normalizeForLookup(input);
    if (normalized.length === 2) {
        try {
            const found = byIso(normalized.toUpperCase());
            return found ? found.iso2 : null;
        } catch {
            return null;
        }
    }
    const alias = COUNTRY_ALIASES[normalized];
    if (alias) return alias;
    try {
        const byName = byCountry(input.trim());
        if (byName) return byName.iso2;
    } catch {
        // ignore
    }
    const lastPart = input.split(",").map((p) => p.trim()).filter(Boolean).pop();
    if (lastPart && lastPart !== input) {
        const lastNorm = normalizeForLookup(lastPart);
        if (COUNTRY_ALIASES[lastNorm]) return COUNTRY_ALIASES[lastNorm];
        if (lastPart.length === 2) {
            try {
                const found = byIso(lastPart.toUpperCase());
                return found ? found.iso2 : null;
            } catch {
                return null;
            }
        }
        try {
            const byName = byCountry(lastPart);
            if (byName) return byName.iso2;
        } catch {
            // ignore
        }
    }
    return null;
}

export function getCountryFlagUrl(input: string | null | undefined, size: 80 | 160 = 80): string {
    const code = getCountryCodeFromString(input);
    if (!code) return DEFAULT_FLAG_URL;
    return `${FLAG_CDN_BASE}/w${size}/${code.toLowerCase()}.png`;
}
