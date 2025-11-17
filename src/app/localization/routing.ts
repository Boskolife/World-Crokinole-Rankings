import { defineRouting } from "next-intl/routing";
import { createNavigation } from "next-intl/navigation";
import { localeConfig } from "./config";

export const routing = defineRouting({
    locales: [...localeConfig.locales],
    defaultLocale: localeConfig.defaultLocale,
    localePrefix: localeConfig.localePrefix,
});

export const { Link, redirect, usePathname, useRouter } =
    createNavigation(routing);
