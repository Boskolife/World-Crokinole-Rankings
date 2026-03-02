"use client";

import React, { useState } from "react";
import { Icon } from "@/shared/ui/icons";
import { usePopup } from "@/shared/contexts/popup-context";
import type { QualifyingHeatsData } from "@/shared/types";
import css from "./EventQualifyingHeats.module.scss";

export interface EventQualifyingHeatsProps {
    eventId: number;
    eventTitle: string;
    qualifyingHeats: QualifyingHeatsData;
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
}: EventQualifyingHeatsProps) {
    const { openPopup } = usePopup();
    const [isOpen, setIsOpen] = useState(true);
    const { heats, final } = qualifyingHeats;

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
                                    <button
                                        type="button"
                                        className={css.btnPrimary}
                                        onClick={() =>
                                            openPopup("join-tournament", {
                                                title: eventTitle,
                                                heatIndex: i + 1,
                                            })
                                        }
                                    >
                                        Sign Up
                                    </button>
                                    <button
                                        type="button"
                                        className={css.btnOutline}
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
