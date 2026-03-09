"use client";

import React, { useMemo } from "react";
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
    let rounds = Math.max(1, Math.ceil(Math.log2(size)));
    if (parsed?.stages?.length) {
        const first = parsed.stages[0];
        const nr = (first.numberOfRounds ?? "").trim();
        if (nr) {
            const r = parseInt(nr, 10);
            if (!Number.isNaN(r) && r >= 1) rounds = r;
        }
    }
    return { rounds, size };
}

const getCountryFlagUrl = (countryCode: string) =>
    `https://flagcdn.com/w160/${countryCode.toLowerCase()}.png`;

function SlotRow({
    seed,
    player,
    score,
    isWinner,
}: {
    seed: number;
    player: IPlayer | null;
    score: string | null;
    isWinner: boolean;
}) {
    const isEmpty = !player;
    const showSeed = seed > 0;
    return (
        <div
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
    roundIndex,
    slots,
    playersBySeed,
}: {
    roundIndex: number;
    slots: [number, number];
    playersBySeed: (IPlayer | null)[];
}) {
    const [seedA, seedB] = slots;
    const isPlaceholder = seedA < 0 || seedB < 0;
    const playerA = !isPlaceholder ? (playersBySeed[seedA] ?? null) : null;
    const playerB = !isPlaceholder ? (playersBySeed[seedB] ?? null) : null;
    const hasA = playerA != null;
    const hasB = playerB != null;
    const winnerTop = hasA && !hasB;
    return (
        <div className={css.pair}>
            <SlotRow
                seed={isPlaceholder ? 0 : seedA + 1}
                player={playerA}
                score={null}
                isWinner={winnerTop}
            />
            <SlotRow
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

    if (rounds < 1 || size < 2) return null;

    return (
        <section className={css.section}>
            <div className={css.container}>
                <div className={css.bracketWrap}>
                    {roundColumns.map((col) => (
                        <div key={col.roundIndex} className={css.roundColumn}>
                            {col.matches.map((slots, mi) => (
                                <MatchPair
                                    key={`${col.roundIndex}-${mi}`}
                                    roundIndex={col.roundIndex}
                                    slots={slots}
                                    playersBySeed={seededPlayers}
                                />
                            ))}
                        </div>
                    ))}
                    {winner && (
                        <div className={css.championBanner}>
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
