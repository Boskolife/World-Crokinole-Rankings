export const localeConfig = {
    locales: ["en", "fr"] as const,
    defaultLocale: "en" as const,
    localeDetection: false,
    localePrefix: "as-needed" as const,
};
export type Locale = (typeof localeConfig)["locales"][number];

export const localeNames: Record<Locale, string> = {
    en: "English",
    fr: "Français",
};
