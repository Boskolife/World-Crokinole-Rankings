"use client";

import React, { useState } from "react";
import cn from "classnames";
import { Icon } from "@/shared/ui/icons";
import type { QualifyingHeatsData, IPlayer } from "@/shared/types";
import type { EventHeatResultsData } from "@/shared/supabase/data";
import css from "./QualifyingHeatsResultsView.module.scss";

const getCountryFlagUrl = (countryCode: string) =>
    `https://flagcdn.com/w160/${(countryCode || "xx").toLowerCase()}.png`;

export interface QualifyingHeatsResultsViewProps {
    qualifyingHeats: QualifyingHeatsData;
    heatResults: EventHeatResultsData;
    playersByHeat?: IPlayer[][];
}

function AccordionHeader({
    children,
    isOpen,
    onToggle,
    className,
}: {
    children: React.ReactNode;
    isOpen: boolean;
    onToggle: () => void;
    className?: string;
}) {
    return (
        <div
            className={cn(css.accordionHeader, className)}
            onClick={onToggle}
            onKeyDown={(e) => {
                if (e.key === "Enter" || e.key === " ") {
                    e.preventDefault();
                    onToggle();
                }
            }}
            role="button"
            tabIndex={0}
            aria-expanded={isOpen}
        >
            {children}
            <div className={css.accordionChevron}>
                <Icon
                    name={isOpen ? "chevron_up" : "chevron_down"}
                    className={css.accordionChevronIcon}
                />
            </div>
        </div>
    );
}

export function QualifyingHeatsResultsView({
    qualifyingHeats,
    heatResults,
    playersByHeat = [],
}: QualifyingHeatsResultsViewProps) {

    const { heats, final } = qualifyingHeats;
    const allPlayers = playersByHeat.flat();
    const idToPlayer = new Map(allPlayers.map((p) => [p.id, p]));

    const heatIndices = final && heats?.length != null
        ? [...heats.map((_, i) => i), heats.length]
        : heats.map((_, i) => i);

    const [mainOpen, setMainOpen] = useState(true);
    const [heatOpen, setHeatOpen] = useState<Record<number, boolean>>(() => {
        const open: Record<number, boolean> = { 0: true };
        if (final && heats?.length != null) open[heats.length] = true;
        return open;
    });
    const [roundOpen, setRoundOpen] = useState<Record<string, boolean>>({ "0-0": true });

    const getMatches = (heatIndex: number, roundIndex: number) =>
        heatResults.matchesByHeatRound[`${heatIndex}-${roundIndex}`] ?? [];

    const heatPlayers = (heatIndex: number) => playersByHeat[heatIndex] ?? allPlayers;

    const getQualifiedFromHeat = (heatIndex: number): IPlayer[] => {
        const rounds = heatResults.roundsByHeat[heatIndex] ?? [0];
        const players = heatPlayers(heatIndex);
        const idToP = new Map(players.map((p) => [p.id, p]));
        const seen = new Set<string>();
        const order: string[] = [];
        for (const roundIndex of rounds) {
            const matches = getMatches(heatIndex, roundIndex);
            for (const m of matches) {
                if (!m.player1Id || !m.player2Id) continue;
                if (m.score1 > m.score2) {
                    if (!seen.has(m.player1Id)) {
                        seen.add(m.player1Id);
                        order.push(m.player1Id);
                    }
                } else if (m.score2 > m.score1) {
                    if (!seen.has(m.player2Id)) {
                        seen.add(m.player2Id);
                        order.push(m.player2Id);
                    }
                } else {
                    if (!seen.has(m.player1Id)) {
                        seen.add(m.player1Id);
                        order.push(m.player1Id);
                    }
                    if (!seen.has(m.player2Id)) {
                        seen.add(m.player2Id);
                        order.push(m.player2Id);
                    }
                }
            }
        }
        return order.map((id) => idToP.get(id)).filter(Boolean) as IPlayer[];
    };

    const toggleHeat = (i: number) =>
        setHeatOpen((prev) => ({ ...prev, [i]: !prev[i] }));

    const roundKey = (heatIndex: number, roundIndex: number) => `${heatIndex}-${roundIndex}`;
    const isRoundOpen = (heatIndex: number, roundIndex: number) =>
        roundOpen[roundKey(heatIndex, roundIndex)] ?? (heatIndex === 0 && roundIndex === 0);
    const toggleRound = (heatIndex: number, roundIndex: number) =>
        setRoundOpen((prev) => ({ ...prev, [roundKey(heatIndex, roundIndex)]: !prev[roundKey(heatIndex, roundIndex)] }));

    return (
        <section className={css.section}>
            <div className="container">
                <div className={css.mainAccordion}>
                    <AccordionHeader
                        className={css.mainTitleRow}
                        isOpen={mainOpen}
                        onToggle={() => setMainOpen((v) => !v)}
                    >
                        <h2 className={css.mainTitle}>Qualifying Heats results</h2>
                    </AccordionHeader>

                    {mainOpen &&
                        heatIndices.map((heatIndex) => {
                            const isHeatOpen = heatOpen[heatIndex] ?? heatIndex === 0;
                            const rounds = heatResults.roundsByHeat[heatIndex] ?? [0];
                            const isFinal = final && heatIndex === heats.length;

                            return (
                                <div key={heatIndex} className={css.heatBlock}>
                                    <AccordionHeader
                                        className={css.heatTitleRow}
                                        isOpen={isHeatOpen}
                                        onToggle={() => toggleHeat(heatIndex)}
                                    >
                                        <h3 className={css.heatTitle}>
                                            {isFinal ? "Final" : `Qualifying Heat ${heatIndex + 1}`}
                                        </h3>
                                    </AccordionHeader>

                                    {isHeatOpen && (
                                        <div className={css.heatBody}>
                                            {rounds.map((roundIndex) => {
                                                const matches = getMatches(heatIndex, roundIndex);
                                                const open = isRoundOpen(heatIndex, roundIndex);
                                                return (
                                                    <div key={roundIndex} className={css.roundBlock}>
                                                        <AccordionHeader
                                                            className={css.roundTitleRow}
                                                            isOpen={open}
                                                            onToggle={() => toggleRound(heatIndex, roundIndex)}
                                                        >
                                                            <span className={css.roundTitle}>
                                                                Round {roundIndex + 1}
                                                            </span>
                                                        </AccordionHeader>
                                                        {open && (
                                                            <div className={css.roundBody}>
                                                                {matches.map((m, idx) => {
                                                                    const p1 = idToPlayer.get(m.player1Id);
                                                                    const p2 = idToPlayer.get(m.player2Id);
                                                                    const p1Winner = m.score1 > m.score2;
                                                                    const p2Winner = m.score2 > m.score1;
                                                                    return (
                                                                        <div key={idx} className={css.matchRow}>
                                                                            <div className={css.matchPlayerLeft}>
                                                                                <span
                                                                                    className={cn(
                                                                                        css.matchPlayerName,
                                                                                        p1Winner && css.matchPlayerName_winner
                                                                                    )}
                                                                                >
                                                                                    {p1?.name ?? m.player1Id ?? "—"}
                                                                                </span>
                                                                                {p1?.countryCode && (
                                                                                    <img
                                                                                        src={getCountryFlagUrl(p1.countryCode)}
                                                                                        alt=""
                                                                                        className={css.matchFlag}
                                                                                    />
                                                                                )}
                                                                            </div>
                                                                            <div className={css.matchScores}>
                                                                                <span className={css.matchScore}>
                                                                                    {m.score1}
                                                                                </span>
                                                                                <span className={css.matchScoreDivider} />
                                                                                <span className={css.matchScore}>
                                                                                    {m.score2}
                                                                                </span>
                                                                            </div>
                                                                            <div className={css.matchPlayerRight}>
                                                                                {p2?.countryCode && (
                                                                                    <img
                                                                                        src={getCountryFlagUrl(p2.countryCode)}
                                                                                        alt=""
                                                                                        className={css.matchFlag}
                                                                                    />
                                                                                )}
                                                                                <span
                                                                                    className={cn(
                                                                                        css.matchPlayerName,
                                                                                        p2Winner && css.matchPlayerName_winner
                                                                                    )}
                                                                                >
                                                                                    {p2?.name ?? m.player2Id ?? "—"}
                                                                                </span>
                                                                            </div>
                                                                        </div>
                                                                    );
                                                                })}
                                                            </div>
                                                        )}
                                                    </div>
                                                );
                                            })}

                                            {!isFinal && (
                                                <div className={css.qualifiedBlock}>
                                                    <h4 className={css.qualifiedTitle}>
                                                        Players who have qualified from heat {heatIndex + 1}
                                                    </h4>
                                                    <ol className={css.qualifiedList}>
                                                        {(() => {
                                                            const qualified = getQualifiedFromHeat(heatIndex);
                                                            if (qualified.length === 0) {
                                                                return (
                                                                    <li className={css.qualifiedItem}>—</li>
                                                                );
                                                            }
                                                            return qualified.map((p) => (
                                                                <li key={p.id} className={css.qualifiedItem}>
                                                                    {p.name}
                                                                </li>
                                                            ));
                                                        })()}
                                                    </ol>
                                                </div>
                                            )}
                                        </div>
                                    )}
                                </div>
                            );
                        })}
                </div>
            </div>
        </section>
    );
}
