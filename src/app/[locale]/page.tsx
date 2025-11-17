"use client";

import { useEffect } from "react";
import { useRouter, useParams } from "next/navigation";
import { localeConfig } from "../localization/config";
import { clientRoutes } from "@/shared/routes/client";

export default function LocaleRootPage() {
    const router = useRouter();
    const params = useParams() as { locale?: string };
    const locale = params?.locale || (localeConfig.defaultLocale as string);

    useEffect(() => {
        try {
            const flag =
                typeof window !== "undefined"
                    ? window.localStorage.getItem("isLoggedIn")
                    : null;
            const isLoggedIn = flag === "1" || flag === "true";
            if (isLoggedIn) {
                router.replace(`/${locale}/dashboard`);
            } else {
                router.replace(`/${locale}${clientRoutes.steps(1)}`);
            }
        } catch {
            router.replace(`/${locale}${clientRoutes.steps(1)}`);
        }
    }, [router, locale]);

    return null;
}
