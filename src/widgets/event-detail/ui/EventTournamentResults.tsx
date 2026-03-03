"use client";

import React from "react";
import css from "./EventTournamentResults.module.scss";

export interface EventTournamentResultsProps {
    isRanked?: boolean;
}

export function EventTournamentResults({ isRanked = true }: EventTournamentResultsProps) {
    const statusLabel = isRanked ? "In process" : "The event has ended";

    return (
        <section className={css.section}>
            <div className="container">
                <div className={css.resultsWrap}>
                    <h2 className={css.resultsTitle}>Tournament results</h2>
                    <div className={css.resultsList}>
                        <div className={css.resultsRow}>
                            <span className={css.resultsLabel}>Match results</span>
                            <span className={css.inProcessPill}>{statusLabel}</span>
                        </div>
                        <div className={css.resultsRow}>
                            <span className={css.resultsLabel}>Leaderboard</span>
                            <span className={css.inProcessPill}>{statusLabel}</span>
                        </div>
                    </div>
                </div>
            </div>
        </section>
    );
}
