import { notFound } from "next/navigation";
import { getRequestConfig } from "next-intl/server";
import { localeConfig } from "./config";

export default getRequestConfig(async ({ requestLocale }) => {
    let locale = await requestLocale;

    if (
        !locale ||
        !localeConfig.locales.includes(
            locale as (typeof localeConfig.locales)[number]
        )
    ) {
        locale = localeConfig.defaultLocale as string;
    }

    if (
        !localeConfig.locales.includes(
            locale as (typeof localeConfig.locales)[number]
        )
    ) {
        notFound();
    }

    return {
        locale,
        messages: (await import(`./translates/${locale}.json`)).default,
    };
});


