import { getTranslations } from "next-intl/server";
import { notFound } from "next/navigation";
import type { Metadata } from "next";
import { Header } from "@/widgets/header";
import { Footer } from "@/widgets/footer";
import { localeConfig } from "@/app/localization/config";
import { ServerProviders } from "@/app/localization/server";
import "@/app/styles/main.scss";

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

export default async function LocaleLayoutWithFooter({
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
            <Footer />
        </ServerProviders>
    );
}
