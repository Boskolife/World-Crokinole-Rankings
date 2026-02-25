"use client";

import { useEffect } from "react";
import { useRouter, useParams } from "next/navigation";
import { useAuth, useUserProfile } from "@/shared/hooks";
import { localeConfig } from "@/app/localization/config";
import { CreateEventForm } from "@/widgets/events/create-event-form/CreateEventForm";
import css from "@/widgets/events/create-event-form/styles.module.scss";

export default function CreateEventPage() {
    const { isAuth, isMounted } = useAuth();
    const { profile, isLoading: profileLoading } = useUserProfile();
    const router = useRouter();
    const params = useParams() as { locale?: string };
    const locale = params?.locale ?? localeConfig.defaultLocale;
    const isPremiumOrAdmin =
        profile?.subscription_plan === "premium" ||
        profile?.subscription_plan === "administrator";
    const profileReady = !profileLoading && profile !== null;

    useEffect(() => {
        if (!isMounted) return;
        if (!isAuth) {
            router.push(`/${locale}/auth/sign-in`);
            return;
        }
        if (profileReady && !isPremiumOrAdmin) {
            router.push(`/${locale}/membership-plans`);
        }
    }, [isMounted, isAuth, profileReady, isPremiumOrAdmin, locale, router]);

    if (!isMounted || !isAuth) {
        return (
            <div className={css.hero}>
                <div className={css.backLink}>Redirecting...</div>
            </div>
        );
    }

    if (!profileReady || !isPremiumOrAdmin) {
        return (
            <div className={css.hero}>
                <div className={css.backLink}>Loading...</div>
            </div>
        );
    }

    return (
        <CreateEventForm
            backLinkHref={`/${locale}/events`}
            backLinkLabel="Back to Events"
            successRedirect={`/${locale}/events`}
        />
    );
}
