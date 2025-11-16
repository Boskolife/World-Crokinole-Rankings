"use client";

import { useEffect } from "react";
import { useRouter } from "next/navigation";
import { defaultLocale } from "../localization/config";

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
                router.replace(`/${locale}/new-visitor`);
            }
        } catch {
            router.replace(`/${locale}/new-visitor`);
        }
    }, [router, locale]);

    return null;
}
