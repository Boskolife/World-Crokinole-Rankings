"use client";

import { useEffect } from "react";
import { useRouter, useParams } from "next/navigation";
import { useAuth, useUserProfile } from "@/shared/hooks";
import { localeConfig } from "@/app/localization/config";
import { CreateTournamentForm } from "@/widgets/events/create-tournament-form";
import css from "@/widgets/events/create-tournament-form/styles.module.scss";

export default function CreateEventPage() {
    const { isAuth, isMounted } = useAuth();
    const { profile, isLoading: profileLoading } = useUserProfile();
    const router = useRouter();
    const params = useParams() as { locale?: string };
    const locale = params?.locale ?? localeConfig.defaultLocale;
    const profileReady = !profileLoading && profile !== null;

    useEffect(() => {
        if (!isMounted) return;
        if (!isAuth) {
            router.push(`/${locale}/auth/sign-in`);
        }
    }, [isMounted, isAuth, locale, router]);

    if (!isMounted || !isAuth) {
        return (
            <div className={css.hero}>
                <div className={css.backLink}>Redirecting...</div>
            </div>
        );
    }

    if (!profileReady) {
        return (
            <div className={css.hero}>
                <div className={css.backLink}>Loading...</div>
            </div>
        );
    }

    return (
        <CreateTournamentForm
            backLinkHref={`/${locale}/events`}
            backLinkLabel="Back to Events"
            onNextStep={() => {}}
        />
    );
}
