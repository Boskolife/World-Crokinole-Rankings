import { getTranslations } from "next-intl/server";
import { notFound } from "next/navigation";
import type { Metadata } from "next";
import "@/app/styles/main.scss";
import { Header } from "@/widgets/header";
import { localeConfig } from "@/app/localization/config";
import { ServerProviders } from "@/app/localization/server";

export function generateStaticParams() {
    return localeConfig.locales.map((locale) => ({ locale }));
}

export async function generateMetadata({
    params,
}: {
    params: Promise<{ locale: string }>;
}): Promise<Metadata> {
    const { locale } = await params;
    const t = await getTranslations({ locale, namespace: "home" });

    return {
        title: t("title"),
        description: t("description"),
        robots: {
            index: false,
            follow: false,
            nocache: true,
        },
    };
}

export default async function LocaleLayoutNoFooter({
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

    return (
        <ServerProviders locale={locale}>
            <Header />
            {children}
        </ServerProviders>
    );
}
