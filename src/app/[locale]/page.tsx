"use client";

import { useEffect } from "react";
import { useRouter } from "next/navigation";
import { defaultLocale } from "../localization/config";
import { clientRoutes } from "@/shared/routes/client";

export default function LocaleRootPage({
    params,
}: {
    params: { locale: string };
}) {
    const router = useRouter();
    const locale = params?.locale || defaultLocale;

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
