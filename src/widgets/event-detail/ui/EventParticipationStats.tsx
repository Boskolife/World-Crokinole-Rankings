"use client";

import React from "react";
import css from "./EventParticipationStats.module.scss";

export interface EventParticipationStatsProps {
    participantsCount: number;
    gamesPlayedCount: number;
    countriesCount: number;
    clubsCount: number;
}

export function EventParticipationStats({
    participantsCount,
    gamesPlayedCount,
    countriesCount,
    clubsCount,
}: EventParticipationStatsProps) {
    return (
        <section className={css.section}>
            <div className="container">
                <div className={css.grid}>
                    <div className={css.card}>
                        <div className={css.cardValue}>{participantsCount}</div>
                        <p className={css.cardLabel}>Number of players who participated</p>
                    </div>
                    <div className={css.card}>
                        <div className={css.cardValue}>{gamesPlayedCount}</div>
                        <p className={css.cardLabel}>Number of games played</p>
                    </div>
                    <div className={css.card}>
                        <div className={css.cardValue}>{countriesCount}</div>
                        <p className={css.cardLabel}>Number of countries/states that participated</p>
                    </div>
                    <div className={css.card}>
                        <div className={css.cardValue}>{clubsCount}</div>
                        <p className={css.cardLabel}>Number of clubs that participated</p>
                    </div>
                </div>
            </div>
        </section>
    );
}
