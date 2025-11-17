
import { notFound } from "next/navigation";
import type { Metadata } from "next";
import "../styles/main.scss";
import { localeConfig } from "../localization/config";
import { ServerProviders } from "../localization/server";

export const metadata: Metadata = {
    title: "World Crokinole Rankings",
    description: "One world. One board. United by play.",
    robots: {
        index: false,
        follow: false,
        nocache: true,
    },
};

export function generateStaticParams() {
    return localeConfig.locales.map((locale) => ({ locale }));
}

export default async function LocaleLayout({
    children,
    params,
}: {
    children: React.ReactNode;
    params: Promise<{ locale: string }>;
}) {
    let { locale } = await params;

    if (!locale || locale === "") {
        locale = localeConfig.defaultLocale as string;
    }

    if (
        !localeConfig.locales.includes(
            locale as (typeof localeConfig.locales)[number]
        )
    ) {
        notFound();
    }

    return <ServerProviders locale={locale}>{children}</ServerProviders>;
}
