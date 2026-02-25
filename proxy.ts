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
    "/((?!api|_next|_vercel|auth/callback|.*\\..*).*)",
  ],
};

