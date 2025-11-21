"use client";

import { useEffect } from "react";
import { useRouter, useParams } from "next/navigation";
import { localeConfig } from "@/app/localization/config";
import { clientRoutes } from "@/shared/routes/client";
import { useAuth } from "@/shared/hooks";

export default function LocaleRootPage() {
    const router = useRouter();
    const params = useParams() as { locale?: string };
    const locale = params?.locale || (localeConfig.defaultLocale as string);
    const { isAuth } = useAuth();
    useEffect(() => {
        try {
            const flag =
                typeof window !== "undefined"
                    ? window.localStorage.getItem("isAuth")
                    : null;
            const isAuth = flag === "true";
            if (isAuth) {
                router.replace(`/${locale}/dashboard`);
            } else {
                router.replace(`/${locale}${clientRoutes.steps(1)}`);
            }
        } catch {
            router.replace(`/${locale}${clientRoutes.steps(1)}`);
        }
    }, [router, locale, isAuth]);

    return null;
}
