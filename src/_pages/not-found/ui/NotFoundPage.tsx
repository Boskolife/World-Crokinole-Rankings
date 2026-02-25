"use client";

import React from "react";
import { usePathname } from "next/navigation";
import { localeConfig } from "@/app/localization/config";
import type { Locale } from "@/app/localization/config";
import css from "./styles.module.scss";

const texts: Record<
    Locale,
    { notFound: string; notFoundDescription: string; backToHome: string }
> = {
    en: {
        notFound: "Page not found",
        notFoundDescription:
            "The page you're looking for doesn't exist or has been moved.",
        backToHome: "Back to home",
    },
    fr: {
        notFound: "Page non trouvée",
        notFoundDescription:
            "La page demandée n'existe pas ou a été déplacée.",
        backToHome: "Retour à l'accueil",
    },
};

function getLocaleFromPathname(pathname: string): Locale {
    const segment = pathname.split("/")[1] ?? "";
    if (localeConfig.locales.includes(segment as Locale)) return segment as Locale;
    return localeConfig.defaultLocale;
}

export function NotFoundPage() {
    const pathname = usePathname();
    const locale = getLocaleFromPathname(pathname ?? "");
    const t = texts[locale];
    const homeHref =
        locale === localeConfig.defaultLocale ? "/" : `/${locale}`;

    return (
        <div className={css.not_found}>
            <div className={css.not_found_content}>
                <p className={css.not_found_code}>404</p>
                <h1 className={css.not_found_title}>{t.notFound}</h1>
                <p className={css.not_found_text}>{t.notFoundDescription}</p>
                <a href={homeHref} className={css.not_found_btn}>
                    {t.backToHome}
                </a>
            </div>
        </div>
    );
}
