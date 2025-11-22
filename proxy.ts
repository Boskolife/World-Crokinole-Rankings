import createMiddleware from "next-intl/middleware";
import { localeConfig } from "@/app/localization/config";
import { NextRequest } from "next/server";

const intlMiddleware = createMiddleware({
  locales: [...localeConfig.locales],
  defaultLocale: localeConfig.defaultLocale,
  localePrefix: localeConfig.localePrefix,
  localeDetection: localeConfig.localeDetection,
});

export default function proxy(request: NextRequest) {
  // Обработка корневого пути для as-needed режима
  // Если это корневой путь, middleware автоматически обработает его
  return intlMiddleware(request);
}

export const config = {
  matcher: [
    // Match all pathnames except for
    // - … if they start with `/api`, `/_next` or `/_vercel`
    // - … the ones containing a dot (e.g. `favicon.ico`)
    "/((?!api|_next|_vercel|.*\\..*).*)",
  ],
};

