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
    const { isAuth, isMounted } = useAuth();

    useEffect(() => {
        if (!isMounted) return;

        if (isAuth) {
            router.replace(`/${locale}/dashboard`);
        } else {
            router.replace(`/${locale}${clientRoutes.steps(1)}`);
        }
    }, [router, locale, isAuth, isMounted]);

    return null;
}
