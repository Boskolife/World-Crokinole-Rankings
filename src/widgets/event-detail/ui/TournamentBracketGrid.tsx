"use client";

import React, { useLayoutEffect, useMemo, useRef, useState } from "react";
import Image from "next/image";
import type { IPlayer } from "@/shared/types";
import css from "./TournamentBracketGrid.module.scss";

const BRACKET_ORDER_8 = [0, 7, 3, 4, 1, 6, 2, 5];
const BRACKET_ORDER_16 = [0, 15, 7, 8, 3, 12, 4, 11, 1, 14, 6, 9, 2, 13, 5, 10];
const BRACKET_ORDER_4 = [0, 3, 1, 2];

function getBracketSlotOrder(size: number): number[] {
    if (size <= 4) return BRACKET_ORDER_4.slice(0, size);
    if (size <= 8) return BRACKET_ORDER_8.slice(0, size);
    if (size <= 16) return BRACKET_ORDER_16.slice(0, size);
    const order: number[] = [];
    for (let i = 0; i < size; i++) order.push(i);
    return order;
}

export interface TournamentBracketGridProps {
    structure: string | undefined;
    players: IPlayer[];
    totalParticipants: number | null | undefined;
    winner?: string | null;
}

interface ParsedStructure {
    stages: Array<{ stageFormat?: string; numberOfRounds?: string }>;
}

function parseStructure(structure: string | undefined): ParsedStructure | null {
    const raw = (structure ?? "").trim();
    if (!raw) return null;
    if (raw.startsWith("{")) {
        try {
            const p = JSON.parse(raw) as { stages?: ParsedStructure["stages"] };
            return p.stages?.length ? { stages: p.stages } : null;
        } catch {
            return null;
        }
    }
    const idx = raw.indexOf("{\"stages\":");
    if (idx >= 0) {
        try {
            const p = JSON.parse(raw.slice(idx)) as { stages?: ParsedStructure["stages"] };
            return p.stages?.length ? { stages: p.stages } : null;
        } catch {
            return null;
        }
    }
    return null;
}

function getRoundsAndSize(
    parsed: ParsedStructure | null,
    totalParticipants: number | null | undefined
): { rounds: number; size: number } {
    let size = 8;
    if (totalParticipants != null && totalParticipants > 0) {
        size = Math.max(4, Math.min(32, 2 ** Math.ceil(Math.log2(totalParticipants))));
    }
    const rounds = Math.max(1, Math.ceil(Math.log2(size)));
    return { rounds, size };
}

const getCountryFlagUrl = (countryCode: string) =>
    `https://flagcdn.com/w160/${countryCode.toLowerCase()}.png`;

function SlotRow({
    slotRole,
    seed,
    player,
    score,
    isWinner,
}: {
    slotRole: "upper" | "lower";
    seed: number;
    player: IPlayer | null;
    score: string | null;
    isWinner: boolean;
}) {
    const isEmpty = !player;
    const showSeed = seed > 0;
    return (
        <div
            data-slot-role={slotRole}
            className={
                isWinner
                    ? `${css.slotRow} ${css.slotRowWinner}`
                    : `${css.slotRow} ${css.slotRowDefault}`
            }
        >
            <div className={css.slotLeft}>
                {showSeed && (
                    <span className={isWinner ? css.seedBadgeWinner : css.seedBadge}>
                        #{seed}
                    </span>
                )}
                <span className={css.slotFlag}>
                    {player?.countryCode ? (
                        <Image
                            src={getCountryFlagUrl(player.countryCode)}
                            alt=""
                            width={24}
                            height={24}
                            className={css.flagImg}
                        />
                    ) : (
                        <span className={css.flagPlaceholder} />
                    )}
                </span>
                <span className={isEmpty ? css.slotNameEmpty : css.slotName}>
                    {player?.name ?? "—"}
                </span>
            </div>
            {score != null && score !== "" && (
                <span className={isWinner ? css.slotScoreWinner : css.slotScore}>{score}</span>
            )}
        </div>
    );
}

function MatchPair({
    matchIndex,
    slots,
    playersBySeed,
    setPairEl,
}: {
    matchIndex: number;
    slots: [number, number];
    playersBySeed: (IPlayer | null)[];
    setPairEl: (el: HTMLDivElement | null) => void;
}) {
    const [seedA, seedB] = slots;
    const isPlaceholder = seedA < 0 || seedB < 0;
    const playerA = !isPlaceholder ? (playersBySeed[seedA] ?? null) : null;
    const playerB = !isPlaceholder ? (playersBySeed[seedB] ?? null) : null;
    const hasA = playerA != null;
    const hasB = playerB != null;
    const winnerTop = hasA && !hasB;
    return (
        <div className={css.pair} ref={setPairEl}>
            <SlotRow
                slotRole="upper"
                seed={isPlaceholder ? 0 : seedA + 1}
                player={playerA}
                score={null}
                isWinner={winnerTop}
            />
            <SlotRow
                slotRole="lower"
                seed={isPlaceholder ? 0 : seedB + 1}
                player={playerB}
                score={null}
                isWinner={hasB && !hasA}
            />
        </div>
    );
}

export function TournamentBracketGrid({
    structure,
    players,
    totalParticipants,
    winner,
}: TournamentBracketGridProps) {
    const bracketRef = useRef<HTMLDivElement | null>(null);
    const championRef = useRef<HTMLDivElement | null>(null);
    const pairRefs = useRef<Record<string, HTMLDivElement | null>>({});
    const [connectorPoints, setConnectorPoints] = useState<string[]>([]);

    const parsed = useMemo(() => parseStructure(structure), [structure]);
    const { rounds, size } = useMemo(
        () => getRoundsAndSize(parsed, totalParticipants ?? players.length),
        [parsed, totalParticipants, players.length]
    );

    const bracketOrder = useMemo(() => getBracketSlotOrder(size), [size]);
    const seededPlayers = useMemo(() => {
        const sorted = [...players].sort((a, b) => (b.rating ?? 0) - (a.rating ?? 0));
        const bySeed: (IPlayer | null)[] = Array(size).fill(null);
        bracketOrder.forEach((slotIdx, orderIdx) => {
            if (orderIdx < sorted.length) {
                bySeed[slotIdx] = sorted[orderIdx];
            }
        });
        return bySeed;
    }, [players, size, bracketOrder]);

    const roundColumns = useMemo(() => {
        const cols: { roundIndex: number; matches: [number, number][] }[] = [];
        for (let r = 0; r < rounds; r++) {
            const matchCount = size / 2 ** (r + 1);
            const matches: [number, number][] = [];
            if (r === 0) {
                for (let m = 0; m < matchCount; m++) {
                    const s1 = bracketOrder[m * 2];
                    const s2 = bracketOrder[m * 2 + 1];
                    if (s1 !== undefined && s2 !== undefined) matches.push([s1, s2]);
                }
            } else {
                for (let m = 0; m < matchCount; m++) matches.push([-1, -1]);
            }
            cols.push({ roundIndex: r, matches });
        }
        return cols;
    }, [rounds, size, bracketOrder]);

    const setPairEl = (roundIndex: number, matchIndex: number) => (el: HTMLDivElement | null) => {
        pairRefs.current[`${roundIndex}-${matchIndex}`] = el;
    };

    useLayoutEffect(() => {
        const bracketEl = bracketRef.current;
        if (!bracketEl) return;

        const bracketRect = bracketEl.getBoundingClientRect();

        const lines: string[] = [];

        for (let r = 0; r < Math.max(0, rounds - 1); r++) {
            const matchCount = size / 2 ** (r + 1);
            for (let m = 0; m < matchCount; m++) {
                const childEl = pairRefs.current[`${r}-${m}`];
                const parentEl = pairRefs.current[`${r + 1}-${Math.floor(m / 2)}`];

                if (!childEl || !parentEl) continue;

                const childRect = childEl.getBoundingClientRect();
                const parentRect = parentEl.getBoundingClientRect();

                const yChild = (childRect.top + childRect.bottom) / 2 - bracketRect.top;
                const xStart = childRect.right - bracketRect.left;
                const xEnd = parentRect.left - bracketRect.left;

                const role = m % 2 === 0 ? "upper" : "lower";
                const parentSlot = parentEl.querySelector(
                    `[data-slot-role="${role}"]`
                ) as HTMLElement | null;

                if (!parentSlot) continue;

                const parentSlotRect = parentSlot.getBoundingClientRect();
                const yEnd = (parentSlotRect.top + parentSlotRect.bottom) / 2 - bracketRect.top;

                const xMid = xStart + (xEnd - xStart) / 2;

                lines.push(`${xStart},${yChild} ${xMid},${yChild} ${xMid},${yEnd} ${xEnd},${yEnd}`);
            }
        }

        if (winner && rounds >= 1 && championRef.current) {
            const lastPairEl = pairRefs.current[`${rounds - 1}-0`];
            if (lastPairEl) {
                const lastRect = lastPairEl.getBoundingClientRect();
                const champRect = championRef.current.getBoundingClientRect();

                const yLast = (lastRect.top + lastRect.bottom) / 2 - bracketRect.top;
                const xStart = lastRect.right - bracketRect.left;
                const xEnd = champRect.left - bracketRect.left;
                const yEnd = (champRect.top + champRect.bottom) / 2 - bracketRect.top;

                const xMid = xStart + (xEnd - xStart) / 2;
                lines.push(`${xStart},${yLast} ${xMid},${yLast} ${xMid},${yEnd} ${xEnd},${yEnd}`);
            }
        }

        setConnectorPoints(lines);
    }, [rounds, size, winner]);

    if (rounds < 1 || size < 2) return null;

    return (
        <section className={css.section}>
            <div className={css.container}>
                <div ref={bracketRef} className={css.bracketWrap}>
                    <svg className={css.connectorsSvg} aria-hidden>
                        {connectorPoints.map((pts, i) => (
                            <polyline
                                key={i}
                                points={pts}
                                fill="none"
                                stroke="#dee2e6"
                                strokeWidth="2"
                                strokeLinecap="square"
                                strokeLinejoin="miter"
                            />
                        ))}
                    </svg>

                    {roundColumns.map((col) => (
                        <div key={col.roundIndex} className={css.roundColumn}>
                            {col.matches.map((slots, mi) => (
                                <MatchPair
                                    key={`${col.roundIndex}-${mi}`}
                                    matchIndex={mi}
                                    slots={slots}
                                    playersBySeed={seededPlayers}
                                    setPairEl={setPairEl(col.roundIndex, mi)}
                                />
                            ))}
                        </div>
                    ))}

                    {winner && (
                        <div ref={championRef} className={css.championBanner}>
                            <div className={css.championIconWrap}>
                                <Image
                                    src="/images/logo.png"
                                    alt=""
                                    width={44}
                                    height={44}
                                    className={css.championIcon}
                                />
                            </div>
                            <span className={css.championLabel}>Champion</span>
                            <span className={css.championName}>{winner}</span>
                        </div>
                    )}
                </div>
            </div>
        </section>
    );
}
