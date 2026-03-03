"use client";

import React, { useState } from "react";
import { useRouter } from "next/navigation";
import cn from "classnames";
import { Icon } from "@/shared/ui/icons";
import { usePopup } from "@/shared/contexts/popup-context";
import { useAuth } from "@/shared/hooks/use-auth";
import { useEventRegistration } from "@/shared/hooks/use-event-registration";
import { useEventRegistrationStatus } from "@/shared/hooks/use-event-registration-status";
import type { QualifyingHeatsData, IPlayer } from "@/shared/types";
import css from "./EventQualifyingHeats.module.scss";

export interface EventQualifyingHeatsProps {
    eventId: number;
    eventTitle: string;
    qualifyingHeats: QualifyingHeatsData;
    playersByHeat?: IPlayer[][];
    isFull?: boolean;
    totalParticipants?: number | null;
    createdBy?: string | null;
}

function formatHeatDateTime(start: string, end: string): string {
    const s = new Date(start);
    const e = new Date(end);
    const month = s.getMonth() + 1;
    const day = s.getDate();
    const year = String(s.getFullYear()).slice(-2);
    const dayName = s.toLocaleDateString("en-US", { weekday: "long" });
    const startTime = s.toLocaleTimeString("en-US", {
        hour: "numeric",
        minute: "2-digit",
        hour12: true,
    });
    const endTime = e.toLocaleTimeString("en-US", {
        hour: "numeric",
        minute: "2-digit",
        hour12: true,
    });
    return `${month}/${day}/${year} ${dayName}, ${startTime}-${endTime}`;
}

export function EventQualifyingHeats({
    eventId,
    eventTitle,
    qualifyingHeats,
    playersByHeat = [],
    isFull = false,
    totalParticipants,
    createdBy,
}: EventQualifyingHeatsProps) {
    const router = useRouter();
    const { openPopup } = usePopup();
    const { user } = useAuth();
    const isCreator = Boolean(createdBy && user?.id && createdBy === user.id);
    const { status: regStatus } = useEventRegistrationStatus(eventId, user?.id);
    const { registerForEvent, state: regState, resetState } = useEventRegistration();
    const [isOpen, setIsOpen] = useState(true);
    const [registeringHeatIndex, setRegisteringHeatIndex] = useState<number | null>(null);
    const { heats, final } = qualifyingHeats;

    const handleSignUp = (heatIndex: number) => {
        if (!user?.id) return;
        setRegisteringHeatIndex(heatIndex);
        registerForEvent(
            eventId,
            user.id,
            heatIndex,
            totalParticipants ?? undefined
        ).then((ok) => {
            setRegisteringHeatIndex(null);
            if (ok) {
                window.dispatchEvent(
                    new CustomEvent("event-registration-updated", { detail: { eventId } })
                );
                router.refresh();
            } else {
                resetState();
            }
        });
    };

    if (!heats?.length) return null;

    return (
        <section className={css.section}>
            <div className="container">
                <div
                    className={css.header}
                    onClick={() => setIsOpen((v) => !v)}
                    onKeyDown={(e) => {
                        if (e.key === "Enter" || e.key === " ") {
                            e.preventDefault();
                            setIsOpen((v) => !v);
                        }
                    }}
                    role="button"
                    tabIndex={0}
                    aria-expanded={isOpen}
                >
                    <h2 className={css.title}>Qualifying heats to the tournament</h2>
                    <div className={css.chevronWrap} aria-hidden>
                        <Icon
                            name={isOpen ? "chevron_up" : "chevron_down"}
                            className={css.chevron}
                        />
                    </div>
                </div>
                {isOpen && (
                    <div className={css.grid}>
                        {heats.map((slot, i) => (
                            <div key={i} className={css.heatCard}>
                                <div className={css.heatCardContent}>
                                    <h3 className={css.heatTitle}>
                                        Qualifying Heat {i + 1}
                                    </h3>
                                    <p className={css.heatDateTime}>
                                        {formatHeatDateTime(slot.start, slot.end)}
                                    </p>
                                </div>
                                <div className={css.heatActions}>
                                    {isCreator ? null : regStatus?.isRegistered && regStatus.heatIndex === i + 1 ? (
                                        <span
                                            className={cn(css.btnPrimary, css.btnPrimary_registered)}
                                        >
                                            Registered
                                        </span>
                                    ) : regStatus?.isRegistered && regStatus.heatIndex != null ? (
                                        <span
                                            className={cn(css.btnPrimary, css.btnPrimary_registered)}
                                        >
                                            Registered for Heat {regStatus.heatIndex}
                                        </span>
                                    ) : isFull ? (
                                        <span
                                            className={cn(css.btnPrimary, css.btnPrimary_registered)}
                                        >
                                            Full
                                        </span>
                                    ) : (
                                        <>
                                            <button
                                                type="button"
                                                className={css.btnPrimary}
                                                disabled={registeringHeatIndex !== null}
                                                onClick={() => handleSignUp(i + 1)}
                                            >
                                                {registeringHeatIndex === i + 1 &&
                                                regState.status === "loading"
                                                    ? "Registering…"
                                                    : "Sign Up"}
                                            </button>
                                            {registeringHeatIndex === i + 1 &&
                                                regState.status === "error" && (
                                                    <span className={css.heatError}>
                                                        {regState.message}
                                                    </span>
                                                )}
                                        </>
                                    )}
                                    <button
                                        type="button"
                                        className={css.btnOutline}
                                        onClick={() =>
                                            openPopup("view-heat-participants", {
                                                heatLabel: `Qualifying Heat ${i + 1}`,
                                                heatDateTime: formatHeatDateTime(slot.start, slot.end),
                                                players: playersByHeat[i] ?? [],
                                                eventId,
                                                createdBy,
                                            })
                                        }
                                    >
                                        View participants
                                    </button>
                                </div>
                            </div>
                        ))}
                        {final && (
                            <div className={css.finalCard}>
                                <h3 className={css.finalTitle}>Final</h3>
                                <p className={css.finalDateTime}>
                                    {formatHeatDateTime(final.start, final.end)}
                                </p>
                            </div>
                        )}
                    </div>
                )}
            </div>
        </section>
    );
}
