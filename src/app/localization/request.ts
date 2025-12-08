import { getRequestConfig } from "next-intl/server";
import { localeConfig } from "./config";

export default getRequestConfig(async ({ requestLocale }) => {
  let locale = await requestLocale;

  if (!locale || !localeConfig.locales.includes(locale as (typeof localeConfig.locales)[number])) {
    locale = localeConfig.defaultLocale as string;
  }

  return {
    locale,
    messages: (await import(`./translates/${locale}.json`)).default,
  };
});
