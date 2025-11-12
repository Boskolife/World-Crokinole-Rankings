import createMiddleware from "next-intl/middleware";
import { routing } from "./src/app/localization/routing";
import { NextRequest, NextResponse } from "next/server";

const intlMiddleware = createMiddleware(routing);

export default function middleware(request: NextRequest) {
  // Обработка корневого пути для as-needed режима
  const { pathname } = request.nextUrl;
  
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
