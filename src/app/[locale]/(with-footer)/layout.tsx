import { NextIntlClientProvider } from "next-intl";
import { getMessages, getTranslations } from "next-intl/server";
import { notFound } from "next/navigation";
import type { Metadata } from "next";
import "../../styles/main.scss";
import { Header } from "@/widgets/header";
import { Footer } from "@/widgets/footer";
import { locales, defaultLocale } from "../../localization/config";

export function generateStaticParams() {
    return locales.map((locale) => ({ locale }));
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
        locale = defaultLocale;
    }

    if (!locales.includes(locale as (typeof locales)[number])) {
        notFound();
    }

    const messages = await getMessages({ locale });

    return (
        <>
            <NextIntlClientProvider messages={messages}>
                <Header />
                {children}
                <Footer />
            </NextIntlClientProvider>
        </>
    );
}


