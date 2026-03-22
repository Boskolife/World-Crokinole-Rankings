"use client";

import React, { useLayoutEffect, useMemo, useRef, useState } from "react";
import Image from "next/image";
import type { IPlayer } from "@/shared/types";
import { Icon } from "@/shared/ui/icons";
import { CustomRoundedDropdown } from "@/shared/ui";
import { stageFormatOptions } from "@/shared/constants/dropdown-options";
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

interface ParsedStage {
    stageFormat?: string;
    seedingMethod?: string;
    numberOfRounds?: string;
    matchType?: string;
}

interface ParsedStructure {
    stages: ParsedStage[];
}

function parseStructure(structure: string | undefined): ParsedStructure | null {
    const raw = (structure ?? "").trim();
    if (!raw) return null;
    if (raw.startsWith("{")) {
        try {
            const p = JSON.parse(raw) as { stages?: ParsedStage[] };
            return p.stages?.length ? { stages: p.stages } : null;
        } catch {
            return null;
        }
    }
    const idx = raw.indexOf("{\"stages\":");
    if (idx >= 0) {
        try {
            const p = JSON.parse(raw.slice(idx)) as { stages?: ParsedStage[] };
            return p.stages?.length ? { stages: p.stages } : null;
        } catch {
            return null;
        }
    }
    return null;
}

function normalizeStages(parsed: ParsedStructure | null): ParsedStage[] {
    if (parsed?.stages?.length) return parsed.stages;
    return [{ stageFormat: "single_elimination", seedingMethod: "auto_rating" }];
}

function getRoundsAndSize(
    totalParticipants: number | null | undefined,
    playerCount: number
): { rounds: number; size: number } {
    let size = 8;
    const n = totalParticipants ?? playerCount;
    if (n > 0) {
        size = Math.max(4, Math.min(32, 2 ** Math.ceil(Math.log2(n))));
    }
    const rounds = Math.max(1, Math.ceil(Math.log2(size)));
    return { rounds, size };
}

function buildBracketRoundFilterOptions(totalRounds: number): { value: string; label: string }[] {
    if (totalRounds <= 1) {
        return [{ value: "all", label: "All Rounds" }];
    }
    const out: { value: string; label: string }[] = [{ value: "all", label: "All Rounds" }];
    for (let v = 1; v < totalRounds; v++) {
        const label = v === 1 ? "Final" : `Top ${2 ** v}`;
        out.push({ value: String(v), label });
    }
    return out;
}

function parseVisibleRoundsCount(roundFilter: string, totalRounds: number): number {
    if (roundFilter === "all") return totalRounds;
    const n = parseInt(roundFilter, 10);
    if (Number.isNaN(n) || n < 1) return totalRounds;
    return Math.min(totalRounds, n);
}

function getRoundLabel(roundIndex: number, roundCount: number, bracketSize: number): string {
    if (roundIndex === roundCount - 1) {
        return "Final";
    }
    const playersAtStart = bracketSize / 2 ** roundIndex;
    if (playersAtStart >= 32) {
        return `Round of ${playersAtStart}`;
    }
    if (playersAtStart === 16) {
        return "Round of 16";
    }
    if (playersAtStart === 8) {
        return roundIndex === 0 && bracketSize === 8 ? "Round of 8" : "Quarterfinals";
    }
    if (playersAtStart === 4) {
        return "Semifinals";
    }
    return `Round of ${playersAtStart}`;
}

function stageFormatLabel(value: string | undefined): string {
    const v = (value ?? "single_elimination").toLowerCase();
    const found = stageFormatOptions.find((o) => o.value === v);
    return found?.label ?? "Single Elimination";
}

function seedingDetailPhrase(method: string | undefined): string {
    if ((method ?? "").toLowerCase() === "manual") {
        return "Manual seeding";
    }
    return "Seeded by rating";
}

function buildStageSubtitle(stage: ParsedStage, playerCount: number): string {
    const parts: string[] = [];
    parts.push(`${playerCount} players`);
    const mt = (stage.matchType ?? "").toLowerCase();
    if (mt === "doubles") parts.push("Doubles");
    if (mt === "singles") parts.push("Singles");
    parts.push(seedingDetailPhrase(stage.seedingMethod));
    const fmt = (stage.stageFormat ?? "single_elimination").toLowerCase();
    if (fmt === "single_elimination") {
        parts.push("Single loss elimination", "Winner advances");
    }
    return parts.join(" · ");
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
    slots,
    playersBySeed,
    setPairEl,
}: {
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

type TournamentBracketCoreProps = {
    players: IPlayer[];
    totalParticipants: number | null | undefined;
    winner?: string | null;
    showChampionColumn: boolean;
    roundFilter: string;
};

function TournamentBracketCore({
    players,
    totalParticipants,
    winner,
    showChampionColumn,
    roundFilter,
}: TournamentBracketCoreProps) {
    const bracketRef = useRef<HTMLDivElement | null>(null);
    const championRef = useRef<HTMLDivElement | null>(null);
    const pairRefs = useRef<Record<string, HTMLDivElement | null>>({});
    const [connectorPoints, setConnectorPoints] = useState<string[]>([]);

    const { rounds, size } = useMemo(
        () => getRoundsAndSize(totalParticipants, players.length),
        [totalParticipants, players.length]
    );

    const visibleRoundsCount = useMemo(
        () => parseVisibleRoundsCount(roundFilter, rounds),
        [roundFilter, rounds]
    );
    const sliceStart = Math.max(0, rounds - visibleRoundsCount);

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

    const roundLabels = useMemo(
        () => Array.from({ length: rounds }, (_, i) => getRoundLabel(i, rounds, size)),
        [rounds, size]
    );

    const visibleRoundColumns = useMemo(
        () => roundColumns.slice(sliceStart),
        [roundColumns, sliceStart]
    );
    const visibleRoundLabels = useMemo(
        () => roundLabels.slice(sliceStart),
        [roundLabels, sliceStart]
    );
    const visibleColCount = visibleRoundColumns.length;

    const finalRoundIndex = rounds - 1;
    const finalRoundInView = visibleRoundColumns.some(
        (c) => c.roundIndex === finalRoundIndex
    );
    const championBannerColumnIndex = useMemo(() => {
        if (visibleRoundColumns.length === 0) return -1;
        const finalIdx = visibleRoundColumns.findIndex(
            (c) => c.roundIndex === finalRoundIndex
        );
        return finalIdx >= 0 ? finalIdx : visibleRoundColumns.length - 1;
    }, [visibleRoundColumns, finalRoundIndex]);
    const showChampionBanner =
        showChampionColumn && championBannerColumnIndex >= 0;

    const winnerTrimmed = (winner ?? "").trim();
    const championDisplayName = winnerTrimmed.length > 0 ? winnerTrimmed : "—";
    const championWinnerPlayer = useMemo(() => {
        if (!winnerTrimmed) return null;
        return players.find((p) => p.name === winnerTrimmed) ?? null;
    }, [players, winnerTrimmed]);

    const bracketGridTemplateColumns = useMemo(
        () => `repeat(${visibleColCount}, minmax(0, 1fr))`,
        [visibleColCount]
    );

    const setPairEl = (roundIndex: number, matchIndex: number) => (el: HTMLDivElement | null) => {
        pairRefs.current[`${roundIndex}-${matchIndex}`] = el;
    };

    useLayoutEffect(() => {
        const bracketEl = bracketRef.current;
        if (!bracketEl) return;

        const bracketRect = bracketEl.getBoundingClientRect();

        const lines: string[] = [];

        for (let r = sliceStart; r < rounds - 1; r++) {
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

        if (
            showChampionColumn &&
            finalRoundInView &&
            rounds >= 1 &&
            championRef.current
        ) {
            const lastPairEl = pairRefs.current[`${rounds - 1}-0`];
            if (lastPairEl) {
                const lastRect = lastPairEl.getBoundingClientRect();
                const champRect = championRef.current.getBoundingClientRect();

                const xMatch =
                    (lastRect.left + lastRect.right) / 2 - bracketRect.left;
                const yMatchTop = lastRect.top - bracketRect.top;
                const xChamp =
                    (champRect.left + champRect.right) / 2 - bracketRect.left;
                const yChampBottom = champRect.bottom - bracketRect.top;

                lines.push(
                    `${xMatch},${yMatchTop} ${xChamp},${yMatchTop} ${xChamp},${yChampBottom}`,
                );
            }
        }

        setConnectorPoints(lines);
    }, [rounds, size, showChampionColumn, finalRoundInView, sliceStart]);

    if (rounds < 1 || size < 2) return null;

    return (
        <div className={css.bracketStack}>
            <div
                className={css.roundHeaderRow}
                style={{ gridTemplateColumns: bracketGridTemplateColumns }}
            >
                {visibleRoundLabels.map((label, i) => (
                    <div key={sliceStart + i} className={css.roundHeaderCell}>
                        {label}
                    </div>
                ))}
            </div>

            <div
                ref={bracketRef}
                className={css.bracketWrap}
                style={{ gridTemplateColumns: bracketGridTemplateColumns }}
            >
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

                {visibleRoundColumns.map((col, i) => {
                    const showBanner =
                        showChampionBanner && i === championBannerColumnIndex;
                    const matchPairs = col.matches.map((slots, mi) => (
                        <MatchPair
                            key={`${col.roundIndex}-${mi}`}
                            slots={slots}
                            playersBySeed={seededPlayers}
                            setPairEl={setPairEl(col.roundIndex, mi)}
                        />
                    ));
                    if (!showBanner) {
                        return (
                            <div key={col.roundIndex} className={css.roundColumn}>
                                {matchPairs}
                            </div>
                        );
                    }
                    return (
                        <div
                            key={col.roundIndex}
                            className={css.roundColumnWithChampion}
                        >
                            <div
                                ref={championRef}
                                className={css.championBannerCard}
                            >
                                <div className={css.championIconWrap}>
                                    <Image
                                        src="/images/logo.png"
                                        alt=""
                                        width={44}
                                        height={44}
                                        className={css.championIcon}
                                    />
                                </div>
                                <span className={css.championLabel}>
                                    Champion
                                </span>
                                <div className={css.championPlayerRow}>
                                    <span className={css.championPlayerFlag}>
                                        {championWinnerPlayer?.countryCode ? (
                                            <Image
                                                src={getCountryFlagUrl(
                                                    championWinnerPlayer.countryCode
                                                )}
                                                alt=""
                                                width={24}
                                                height={24}
                                                className={css.championFlagImg}
                                            />
                                        ) : (
                                            <span
                                                className={
                                                    css.championFlagPlaceholder
                                                }
                                            />
                                        )}
                                    </span>
                                    <span
                                        className={
                                            winnerTrimmed
                                                ? css.championPlayerName
                                                : css.championPlayerNameEmpty
                                        }
                                    >
                                        {championDisplayName}
                                    </span>
                                    <span
                                        className={css.championTrophy}
                                        aria-hidden
                                    >
                                        🏆
                                    </span>
                                </div>
                            </div>
                            <div className={css.roundColumn}>{matchPairs}</div>
                        </div>
                    );
                })}
            </div>
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
    const stages = useMemo(() => normalizeStages(parsed), [parsed]);
    const [expandedByIndex, setExpandedByIndex] = useState<Record<number, boolean>>({});
    const [roundFilterByStage, setRoundFilterByStage] = useState<Record<number, string>>({});

    const fullBracketRounds = useMemo(
        () => getRoundsAndSize(totalParticipants, players.length).rounds,
        [totalParticipants, players.length]
    );
    const bracketRoundFilterOptions = useMemo(
        () => buildBracketRoundFilterOptions(fullBracketRounds),
        [fullBracketRounds]
    );

    const displayPlayerCount =
        totalParticipants != null && totalParticipants > 0
            ? totalParticipants
            : players.length > 0
              ? players.length
              : 8;

    const isStageExpanded = (index: number) => expandedByIndex[index] !== false;

    const toggleStage = (index: number) => {
        setExpandedByIndex((prev) => ({
            ...prev,
            [index]: !isStageExpanded(index),
        }));
    };

    const getSafeRoundFilter = (stageIndex: number) => {
        const raw = roundFilterByStage[stageIndex] ?? "all";
        return bracketRoundFilterOptions.some((o) => o.value === raw) ? raw : "all";
    };

    const setStageRoundFilter = (stageIndex: number, value: string) => {
        setRoundFilterByStage((prev) => ({ ...prev, [stageIndex]: value }));
    };

    return (
        <section className={css.section}>
            <div className={css.container}>
                <div className={css.stagesStack}>
                    {stages.map((stage, index) => {
                        const title = `Stage ${index + 1} · ${stageFormatLabel(stage.stageFormat)}`;
                        const subtitle = buildStageSubtitle(stage, displayPlayerCount);
                        const expanded = isStageExpanded(index);
                        return (
                            <div key={index} className={css.stageBlock}>
                                <button
                                    type="button"
                                    className={css.stageHeader}
                                    aria-expanded={expanded}
                                    onClick={() => toggleStage(index)}
                                >
                                    <div className={css.stageHeaderMain}>
                                        <h3 className={css.stageTitle}>{title}</h3>
                                        <p className={css.stageSubtitle}>{subtitle}</p>
                                    </div>
                                    <span className={css.stageChevronBtn}>
                                        <Icon
                                            name={expanded ? "chevron_up" : "chevron_down"}
                                            className={css.stageChevronIcon}
                                        />
                                    </span>
                                </button>
                                {expanded && (
                                    <div className={css.stageBracketBody}>
                                        {fullBracketRounds > 1 && (
                                            <div className={css.roundFilterRow}>
                                                <CustomRoundedDropdown
                                                    id={`tournament-stage-${index}-round-filter`}
                                                    placeholder="All Rounds"
                                                    options={bracketRoundFilterOptions}
                                                    value={getSafeRoundFilter(index)}
                                                    onChange={(v) =>
                                                        setStageRoundFilter(index, v)
                                                    }
                                                    className={css.roundFilterDropdown}
                                                />
                                            </div>
                                        )}
                                        <TournamentBracketCore
                                            players={players}
                                            totalParticipants={totalParticipants}
                                            winner={winner}
                                            showChampionColumn={true}
                                            roundFilter={getSafeRoundFilter(index)}
                                        />
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
