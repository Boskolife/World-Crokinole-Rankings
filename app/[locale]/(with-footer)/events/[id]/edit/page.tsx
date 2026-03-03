"use client";

import { useEffect } from "react";
import { useRouter, useParams } from "next/navigation";
import { useAuth } from "@/shared/hooks/use-auth";
import { getEventById } from "@/shared/supabase/data";
import { localeConfig } from "@/app/localization/config";
import { EditEventForm } from "@/widgets/events/edit-event-form/EditEventForm";
import css from "@/widgets/events/create-event-form/styles.module.scss";
import type { IEventCardProps } from "@/shared/types";
import { useState } from "react";

export default function EditEventPage() {
    const { isAuth, user, isMounted } = useAuth();
    const router = useRouter();
    const params = useParams() as { locale?: string; id?: string };
    const locale = params?.locale ?? localeConfig.defaultLocale;
    const eventId = params?.id;
    const [event, setEvent] = useState<IEventCardProps | null>(null);
    const [loading, setLoading] = useState(true);
    const [notFound, setNotFound] = useState(false);

    useEffect(() => {
        if (!isMounted || !eventId) return;
        if (!isAuth) {
            router.push(`/${locale}/auth/sign-in`);
            return;
        }
        const id = parseInt(String(eventId), 10);
        if (Number.isNaN(id)) {
            setNotFound(true);
            setLoading(false);
            return;
        }
        getEventById(id).then((e) => {
            setEvent(e ?? null);
            setNotFound(!e);
            setLoading(false);
        });
    }, [isMounted, isAuth, eventId, locale, router]);

    useEffect(() => {
        if (!loading && event && user?.id && event.createdBy !== user.id) {
            router.push(`/${locale}/events/${eventId}`);
        }
    }, [loading, event, user?.id, locale, eventId, router]);

    if (!isMounted || !isAuth) {
        return (
            <div className={css.hero}>
                <div className={css.backLink}>Redirecting...</div>
            </div>
        );
    }

    if (loading) {
        return (
            <div className={css.hero}>
                <div className={css.backLink}>Loading...</div>
            </div>
        );
    }

    if (notFound || !event) {
        return (
            <div className={css.hero}>
                <div className={css.backLink}>Event not found.</div>
            </div>
        );
    }

    if (event.createdBy !== user?.id) {
        return null;
    }

    return (
        <EditEventForm
            event={event}
            backLinkHref={`/${locale}/events/${event.id}`}
            backLinkLabel="Back to Event"
            successRedirect={`/${locale}/events/${event.id}`}
        />
    );
}
