"use client";

import React, { useState, useEffect, useRef } from "react";
import { useRouter } from "next/navigation";
import cn from "classnames";
import { Icon } from "@/shared/ui/icons";
import { getEventHeatResults, saveEventHeatResults } from "@/shared/supabase/data";
import type { QualifyingHeatsData, IPlayer } from "@/shared/types";
import css from "./QualifyingHeatsResultsCreatorView.module.scss";

function parseResultsCsv(
    text: string,
    defaultHeatIndex: number,
    playersByHeat: IPlayer[][],
    allPlayers: IPlayer[]
): { roundsByHeat: Record<number, number[]>; matchesByHeatRound: Record<string, MatchRow[]> } {
    const roundsByHeat: Record<number, number[]> = {};
    const matchesByHeatRound: Record<string, MatchRow[]> = {};
    const lines = text.trim().split(/\r?\n/).filter((line) => line.trim());
    if (lines.length < 2) return { roundsByHeat, matchesByHeatRound };

    const parseRow = (line: string): string[] => {
        const result: string[] = [];
        let current = "";
        let inQuotes = false;
        for (let i = 0; i < line.length; i++) {
            const c = line[i];
            if (c === '"') {
                inQuotes = !inQuotes;
            } else if (c === "," && !inQuotes) {
                result.push(current.trim());
                current = "";
            } else {
                current += c;
            }
        }
        result.push(current.trim());
        return result;
    };

    const headerRow = parseRow(lines[0]);
    const cols = headerRow.map((c) => c.trim().toLowerCase());
    const hasHeat = cols.some((c) => c === "heat");
    const heatIdx = hasHeat ? cols.indexOf("heat") : -1;
    const roundIdx = cols.indexOf("round");
    const p1Idx = cols.indexOf("player1");
    const p2Idx = cols.indexOf("player2");
    const s1Idx = cols.indexOf("score1");
    const s2Idx = cols.indexOf("score2");
    if (roundIdx < 0 || p1Idx < 0 || p2Idx < 0 || s1Idx < 0 || s2Idx < 0) {
        throw new Error("CSV must have columns: round, player1, player2, score1, score2 (and optionally heat)");
    }

    const resolvePlayer = (value: string, heatIndex: number): string => {
        const v = (value ?? "").trim();
        if (!v) return "";
        const heatPlayers = playersByHeat[heatIndex] ?? allPlayers;
        const byId = heatPlayers.find((p) => p.id === v);
        if (byId) return byId.id;
        const byName = heatPlayers.find((p) => p.name.trim().toLowerCase() === v.toLowerCase());
        if (byName) return byName.id;
        const fromAll = allPlayers.find((p) => p.id === v || p.name.trim().toLowerCase() === v.toLowerCase());
        return fromAll?.id ?? "";
    };

    for (let i = 1; i < lines.length; i++) {
        const row = parseRow(lines[i]);
        if (row.length < Math.max(roundIdx, p1Idx, p2Idx, s1Idx, s2Idx) + 1) continue;
        const heat = hasHeat && heatIdx >= 0 ? parseInt(row[heatIdx], 10) : defaultHeatIndex;
        if (Number.isNaN(heat) || heat < 0) continue;
        const round = parseInt(row[roundIdx], 10);
        if (Number.isNaN(round) || round < 0) continue;
        const player1 = resolvePlayer(row[p1Idx] ?? "", heat);
        const player2 = resolvePlayer(row[p2Idx] ?? "", heat);
        const score1 = parseInt(row[s1Idx], 10) || 0;
        const score2 = parseInt(row[s2Idx], 10) || 0;

        if (!roundsByHeat[heat]) roundsByHeat[heat] = [];
        if (!roundsByHeat[heat].includes(round)) roundsByHeat[heat].push(round);

        const key = `${heat}-${round}`;
        if (!matchesByHeatRound[key]) matchesByHeatRound[key] = [];
        matchesByHeatRound[key].push({ player1Id: player1, player2Id: player2, score1, score2 });
    }

    for (const heat of Object.keys(roundsByHeat).map(Number)) {
        roundsByHeat[heat].sort((a, b) => a - b);
    }
    return { roundsByHeat, matchesByHeatRound };
}

export interface QualifyingHeatsResultsCreatorViewProps {
    eventId: number;
    qualifyingHeats: QualifyingHeatsData;
    playersByHeat?: IPlayer[][];
}

interface MatchRow {
    player1Id: string;
    player2Id: string;
    score1: number;
    score2: number;
}

function MatchResultCell({
    players,
    value,
    score,
    onPlayerChange,
    onScoreChange,
    placeholder = "Select a player",
}: {
    players: IPlayer[];
    value: string;
    score: number;
    onPlayerChange: (id: string) => void;
    onScoreChange: (n: number) => void;
    placeholder?: string;
}) {
    const options = [
        { value: "", label: placeholder },
        ...players.map((p) => ({ value: p.id, label: p.name })),
    ];
    const isFilled = !!value;

    return (
        <div className={cn(css.scoreResult, { [css.scoreResult_placeholder]: !isFilled })}>
            <select
                className={css.scoreResultSelect}
                value={value}
                onChange={(e) => onPlayerChange(e.target.value)}
                aria-label={placeholder}
            >
                {options.map((o) => (
                    <option key={o.value || "empty"} value={o.value}>
                        {o.label}
                    </option>
                ))}
            </select>
            <div className={css.scoreResultScoreWrap}>
                <input
                    type="number"
                    min={0}
                    max={99}
                    className={css.scoreResultScore}
                    value={score}
                    onChange={(e) => onScoreChange(parseInt(e.target.value, 10) || 0)}
                />
                <div className={css.scoreResultStepper}>
                    <button
                        type="button"
                        className={css.scoreResultStepperBtn}
                        onClick={() => onScoreChange(Math.min(99, score + 1))}
                        aria-label="Increase score"
                    >
                        <Icon name="chevron_up" className={css.scoreResultStepperIcon} />
                    </button>
                    <button
                        type="button"
                        className={css.scoreResultStepperBtn}
                        onClick={() => onScoreChange(Math.max(0, score - 1))}
                        aria-label="Decrease score"
                    >
                        <Icon name="chevron_down" className={css.scoreResultStepperIcon} />
                    </button>
                </div>
            </div>
        </div>
    );
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

export function QualifyingHeatsResultsCreatorView({
    eventId,
    qualifyingHeats,
    playersByHeat = [],
}: QualifyingHeatsResultsCreatorViewProps) {
    const [mainOpen, setMainOpen] = useState(true);
    const [heatOpen, setHeatOpen] = useState<Record<number, boolean>>({ 0: true });
    const { heats, final } = qualifyingHeats;
    const heatIndices = final
        ? [...heats.map((_, i) => i), heats.length]
        : heats.map((_, i) => i);
    const [roundsByHeat, setRoundsByHeat] = useState<Record<number, number[]>>(() =>
        Object.fromEntries(heatIndices.map((i) => [i, [0]]))
    );
    const [matchesByHeatRound, setMatchesByHeatRound] = useState<Record<string, MatchRow[]>>(() =>
        Object.fromEntries(
            heatIndices.map((heatIndex) => [
                `${heatIndex}-0`,
                [
                    { player1Id: "", player2Id: "", score1: 0, score2: 0 },
                    { player1Id: "", player2Id: "", score1: 0, score2: 0 },
                ],
            ])
        )
    );
    const [saveStatus, setSaveStatus] = useState<"idle" | "saving" | "saved" | "error">("idle");
    const [saveError, setSaveError] = useState<string | null>(null);
    const [csvError, setCsvError] = useState<string | null>(null);
    const fileInputRef = useRef<HTMLInputElement>(null);
    const currentUploadHeatRef = useRef<number>(0);
    const router = useRouter();

    useEffect(() => {
        let cancelled = false;
        getEventHeatResults(eventId).then((data) => {
            if (cancelled || !data) return;
            setRoundsByHeat((prev) => ({
                ...Object.fromEntries(heatIndices.map((i) => [i, [0]])),
                ...data.roundsByHeat,
            }));
            setMatchesByHeatRound((prev) => ({
                ...prev,
                ...data.matchesByHeatRound,
            }));
        });
        return () => {
            cancelled = true;
        };
    }, [eventId]);

    const handleSaveResults = async () => {
        setSaveStatus("saving");
        setSaveError(null);
        try {
            await saveEventHeatResults(eventId, {
                roundsByHeat,
                matchesByHeatRound,
            });
            setSaveStatus("saved");
            router.refresh();
        } catch (e) {
            setSaveStatus("error");
            setSaveError(e instanceof Error ? e.message : "Failed to save");
        }
    };

    const allPlayers = playersByHeat.flat();
    const handleCsvUpload = (file: File, heatIndex: number) => {
        setCsvError(null);
        if (!file.name.toLowerCase().endsWith(".csv")) {
            setCsvError("Please upload a CSV file");
            return;
        }
        const reader = new FileReader();
        reader.onload = () => {
            try {
                const text = String(reader.result ?? "");
                const { roundsByHeat: parsedRounds, matchesByHeatRound: parsedMatches } = parseResultsCsv(
                    text,
                    heatIndex,
                    playersByHeat,
                    allPlayers
                );
                setRoundsByHeat((prev) => {
                    const next = { ...prev };
                    for (const heat of Object.keys(parsedRounds).map(Number)) {
                        const existing = next[heat] ?? [];
                        const added = parsedRounds[heat] ?? [];
                        const combined = [...new Set([...existing, ...added])].sort((a, b) => a - b);
                        next[heat] = combined;
                    }
                    return next;
                });
                setMatchesByHeatRound((prev) => ({ ...prev, ...parsedMatches }));
            } catch (e) {
                setCsvError(e instanceof Error ? e.message : "Invalid CSV format");
            }
        };
        reader.onerror = () => setCsvError("Failed to read file");
        reader.readAsText(file, "UTF-8");
    };

    const onUploadZoneClick = (heatIndex: number) => {
        currentUploadHeatRef.current = heatIndex;
        fileInputRef.current?.click();
    };

    const onFileInputChange = (e: React.ChangeEvent<HTMLInputElement>) => {
        const file = e.target.files?.[0];
        e.target.value = "";
        if (file) handleCsvUpload(file, currentUploadHeatRef.current);
    };

    const onUploadZoneDrop = (e: React.DragEvent, heatIndex: number) => {
        e.preventDefault();
        const file = e.dataTransfer.files?.[0];
        if (file) handleCsvUpload(file, heatIndex);
    };

    const onUploadZoneDragOver = (e: React.DragEvent) => e.preventDefault();
    const heatPlayers = (heatIndex: number) => playersByHeat[heatIndex] ?? allPlayers;

    const toggleHeat = (i: number) =>
        setHeatOpen((prev) => ({ ...prev, [i]: !prev[i] }));

    const getMatches = (heatIndex: number, roundIndex: number) =>
        matchesByHeatRound[`${heatIndex}-${roundIndex}`] ?? [
            { player1Id: "", player2Id: "", score1: 0, score2: 0 },
            { player1Id: "", player2Id: "", score1: 0, score2: 0 },
        ];

    const setMatches = (heatIndex: number, roundIndex: number, rows: MatchRow[]) =>
        setMatchesByHeatRound((prev) => ({ ...prev, [`${heatIndex}-${roundIndex}`]: rows }));

    const addMatch = (heatIndex: number, roundIndex: number) => {
        const key = `${heatIndex}-${roundIndex}`;
        const current = matchesByHeatRound[key] ?? [];
        setMatchesByHeatRound((prev) => ({
            ...prev,
            [key]: [...current, { player1Id: "", player2Id: "", score1: 0, score2: 0 }],
        }));
    };

    const updateMatch = (
        heatIndex: number,
        roundIndex: number,
        matchIndex: number,
        patch: Partial<MatchRow>
    ) => {
        const key = `${heatIndex}-${roundIndex}`;
        const current = [...(matchesByHeatRound[key] ?? [])];
        if (!current[matchIndex]) return;
        current[matchIndex] = { ...current[matchIndex], ...patch };
        setMatchesByHeatRound((prev) => ({ ...prev, [key]: current }));
    };

    const addRound = (heatIndex: number) => {
        const nextIndex = (roundsByHeat[heatIndex] ?? [0]).length;
        setRoundsByHeat((prev) => ({
            ...prev,
            [heatIndex]: [...(prev[heatIndex] ?? [0]), nextIndex],
        }));
        setMatchesByHeatRound((prev) => ({
            ...prev,
            [`${heatIndex}-${nextIndex}`]: [
                { player1Id: "", player2Id: "", score1: 0, score2: 0 },
                { player1Id: "", player2Id: "", score1: 0, score2: 0 },
            ],
        }));
    };

    const removeRound = (heatIndex: number, roundIndex: number) => {
        setRoundsByHeat((prev) => {
            const arr = (prev[heatIndex] ?? [0]).filter((r) => r !== roundIndex);
            if (arr.length === 0) return prev;
            return { ...prev, [heatIndex]: arr };
        });
        setMatchesByHeatRound((prev) => {
            const next = { ...prev };
            delete next[`${heatIndex}-${roundIndex}`];
            return next;
        });
        };

    const removeMatch = (heatIndex: number, roundIndex: number, matchIndex: number) => {
        const key = `${heatIndex}-${roundIndex}`;
        const current = matchesByHeatRound[key] ?? [];
        if (current.length <= 1) return;
        const next = current.filter((_, i) => i !== matchIndex);
        setMatchesByHeatRound((prev) => ({ ...prev, [key]: next }));
    };

    const getQualifiedFromHeat = (heatIndex: number): IPlayer[] => {
        const rounds = roundsByHeat[heatIndex] ?? [0];
        const players = heatPlayers(heatIndex);
        const idToPlayer = new Map(players.map((p) => [p.id, p]));
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
        return order.map((id) => idToPlayer.get(id)).filter(Boolean) as IPlayer[];
    };

    const getQualifiedForFinal = (): IPlayer[] => {
        const seen = new Set<string>();
        const result: IPlayer[] = [];
        for (let i = 0; i < heats.length; i++) {
            for (const p of getQualifiedFromHeat(i)) {
                if (!seen.has(p.id)) {
                    seen.add(p.id);
                    result.push(p);
                }
            }
        }
        return result;
    };

    return (
        <section className={css.section}>
            <input
                ref={fileInputRef}
                type="file"
                accept=".csv"
                className={css.hiddenInput}
                aria-hidden
                onChange={onFileInputChange}
            />
            <div className="container">
                <div className={css.mainAccordion}>
                    <AccordionHeader
                        className={css.mainTitleRow}
                        isOpen={mainOpen}
                        onToggle={() => setMainOpen((v) => !v)}
                    >
                        <h2 className={css.mainTitle}>Qualifying Heats results</h2>
                    </AccordionHeader>

                    {mainOpen && (
                        <div className={css.accordionBody}>
                            {heats.map((_, heatIndex) => {
                                const isHeatOpen = heatOpen[heatIndex] ?? heatIndex === 0;
                                const players = heatPlayers(heatIndex);
                                return (
                                    <div key={heatIndex} className={css.heatBlock}>
                                        <AccordionHeader
                                            className={css.heatTitleRow}
                                            isOpen={isHeatOpen}
                                            onToggle={() => toggleHeat(heatIndex)}
                                        >
                                            <h3 className={css.heatTitle}>
                                                Qualifying Heat {heatIndex + 1}
                                            </h3>
                                        </AccordionHeader>

                                        {isHeatOpen && (
                                            <div className={css.heatBody}>
                                                <div className={css.manualSection}>
                                                    <div className={css.headRow}>
                                                        <span className={css.headLabel}>
                                                            Head 1
                                                        </span>
                                                        <button
                                                            type="button"
                                                            className={css.linkBtn}
                                                            onClick={() => addRound(heatIndex)}
                                                        >
                                                            Add Round to Head 1
                                                        </button>
                                                    </div>
                                                </div>

                                                <div className={css.uploadSection}>
                                                    <h4 className={css.uploadTitle}>
                                                        Upload CSV
                                                    </h4>
                                                    <p className={css.uploadHint}>
                                                        Drag and drop or browse. Columns: heat, round, player1, player2, score1, score2
                                                    </p>
                                                    {csvError && (
                                                        <p className={css.uploadError} role="alert">
                                                            {csvError}
                                                        </p>
                                                    )}
                                                    <div
                                                        className={css.uploadZone}
                                                        onDrop={(e) => onUploadZoneDrop(e, heatIndex)}
                                                        onDragOver={onUploadZoneDragOver}
                                                    >
                                                        <span
                                                            className={css.uploadIcon}
                                                            aria-hidden
                                                        >
                                                            ↓
                                                        </span>
                                                        <p className={css.uploadZoneText}>
                                                            Choose a file or drag &
                                                            drop it here.
                                                        </p>
                                                        <p className={css.uploadZoneMeta}>
                                                            CSV - Up to 5 MB
                                                        </p>
                                                        <button
                                                            type="button"
                                                            className={css.browseBtn}
                                                            onClick={() => onUploadZoneClick(heatIndex)}
                                                        >
                                                            Browse files
                                                        </button>
                                                    </div>
                                                </div>

                                                {(roundsByHeat[heatIndex] ?? [0]).map(
                                                    (roundIndex) => (
                                                        <div
                                                            key={`${heatIndex}-${roundIndex}`}
                                                            className={css.roundBlock}
                                                        >
                                                            <div className={css.roundTitleRow}>
                                                                <div className={css.roundTitleWithActions}>
                                                                    <span className={css.roundTitle}>
                                                                        Round {roundIndex + 1}
                                                                    </span>
                                                                    <div className={css.roundHeaderActions}>
                                                                        <button
                                                                            type="button"
                                                                            className={css.linkBtn}
                                                                            onClick={() =>
                                                                                addMatch(
                                                                                    heatIndex,
                                                                                    roundIndex
                                                                                )
                                                                            }
                                                                        >
                                                                            Add Match to Round{" "}
                                                                            {roundIndex + 1}
                                                                        </button>
                                                                        {(roundsByHeat[heatIndex] ?? [0])
                                                                            .length > 1 && (
                                                                            <button
                                                                                type="button"
                                                                                className={css.removeRoundBtn}
                                                                                onClick={() =>
                                                                                    removeRound(
                                                                                        heatIndex,
                                                                                        roundIndex
                                                                                    )
                                                                                }
                                                                                title="Remove round"
                                                                            >
                                                                                Remove round
                                                                            </button>
                                                                        )}
                                                                    </div>
                                                                </div>
                                                            </div>

                                                            <div className={css.roundBody}>
                                                                <div className={css.manualSection}>
                                                                    <h4 className={css.manualTitle}>
                                                                        Manual data entry
                                                                    </h4>
                                                                    <div className={css.matchesGrid}>
                                                                            <div className={css.matchesCol}>
                                                                                {getMatches(
                                                                                    heatIndex,
                                                                                    roundIndex
                                                                                ).map((m, idx) => (
                                                                                    <div
                                                                                        key={idx}
                                                                                        className={css.matchRowWrap}
                                                                                    >
                                                                                        <MatchResultCell
                                                                                            players={players}
                                                                                            value={m.player1Id}
                                                                                            score={m.score1}
                                                                                            onPlayerChange={(id) =>
                                                                                                updateMatch(
                                                                                                    heatIndex,
                                                                                                    roundIndex,
                                                                                                    idx,
                                                                                                    {
                                                                                                        player1Id: id,
                                                                                                    }
                                                                                                )
                                                                                            }
                                                                                            onScoreChange={(n) =>
                                                                                                updateMatch(
                                                                                                    heatIndex,
                                                                                                    roundIndex,
                                                                                                    idx,
                                                                                                    {
                                                                                                        score1: n,
                                                                                                    }
                                                                                                )
                                                                                            }
                                                                                        />
                                                                                        <button
                                                                                            type="button"
                                                                                            className={css.removeMatchBtn}
                                                                                            onClick={() =>
                                                                                                removeMatch(
                                                                                                    heatIndex,
                                                                                                    roundIndex,
                                                                                                    idx
                                                                                                )
                                                                                            }
                                                                                            disabled={
                                                                                                getMatches(
                                                                                                    heatIndex,
                                                                                                    roundIndex
                                                                                                ).length <= 1
                                                                                            }
                                                                                            title="Remove match"
                                                                                            aria-label="Remove match"
                                                                                        >
                                                                                            <Icon
                                                                                                name="x"
                                                                                                className={css.removeMatchIcon}
                                                                                            />
                                                                                        </button>
                                                                                    </div>
                                                                                ))}
                                                                            </div>
                                                                            <div className={css.matchesCol}>
                                                                                {getMatches(
                                                                                    heatIndex,
                                                                                    roundIndex
                                                                                ).map((m, idx) => (
                                                                                    <div
                                                                                        key={idx}
                                                                                        className={css.matchRowWrap}
                                                                                    >
                                                                                        <MatchResultCell
                                                                                            players={players}
                                                                                            value={m.player2Id}
                                                                                            score={m.score2}
                                                                                            onPlayerChange={(id) =>
                                                                                                updateMatch(
                                                                                                    heatIndex,
                                                                                                    roundIndex,
                                                                                                    idx,
                                                                                                    {
                                                                                                        player2Id: id,
                                                                                                    }
                                                                                                )
                                                                                            }
                                                                                            onScoreChange={(n) =>
                                                                                                updateMatch(
                                                                                                    heatIndex,
                                                                                                    roundIndex,
                                                                                                    idx,
                                                                                                    {
                                                                                                        score2: n,
                                                                                                    }
                                                                                                )
                                                                                            }
                                                                                        />
                                                                                        <button
                                                                                            type="button"
                                                                                            className={css.removeMatchBtn}
                                                                                            onClick={() =>
                                                                                                removeMatch(
                                                                                                    heatIndex,
                                                                                                    roundIndex,
                                                                                                    idx
                                                                                                )
                                                                                            }
                                                                                            disabled={
                                                                                                getMatches(
                                                                                                    heatIndex,
                                                                                                    roundIndex
                                                                                                ).length <= 1
                                                                                            }
                                                                                            title="Remove match"
                                                                                            aria-label="Remove match"
                                                                                        >
                                                                                            <Icon
                                                                                                name="x"
                                                                                                className={css.removeMatchIcon}
                                                                                            />
                                                                                        </button>
                                                                                    </div>
                                                                                ))}
                                                                            </div>
                                                                        </div>
                                                                        <button
                                                                            type="button"
                                                                            className={css.saveResultsBtn}
                                                                            onClick={handleSaveResults}
                                                                            disabled={saveStatus === "saving"}
                                                                        >
                                                                            {saveStatus === "saving"
                                                                                ? "Saving…"
                                                                                : "Save results"}
                                                                        </button>
                                                                    </div>
                                                                </div>
                                                        </div>
                                                    )
                                                )}

                                                <div className={css.qualifiedBlock}>
                                                    <h4 className={css.qualifiedTitle}>
                                                        Players who have qualified from heat{" "}
                                                        {heatIndex + 1}
                                                    </h4>
                                                    <ol className={css.qualifiedList}>
                                                        {(() => {
                                                            const qualified = getQualifiedFromHeat(heatIndex);
                                                            if (qualified.length === 0) {
                                                                return (
                                                                    <li className={css.qualifiedItem}>
                                                                        —
                                                                    </li>
                                                                );
                                                            }
                                                            return qualified.map((p) => (
                                                                <li
                                                                    key={p.id}
                                                                    className={css.qualifiedItem}
                                                                >
                                                                    {p.name}
                                                                </li>
                                                            ));
                                                        })()}
                                                    </ol>
                                                </div>
                                            </div>
                                        )}
                                    </div>
                                );
                            })}

                            {final && (
                                <div className={css.heatBlock}>
                                    <AccordionHeader
                                        className={css.heatTitleRow}
                                        isOpen={heatOpen[heats.length] ?? false}
                                        onToggle={() => toggleHeat(heats.length)}
                                    >
                                        <h3 className={css.heatTitle}>Final</h3>
                                    </AccordionHeader>
                                    {heatOpen[heats.length] && (
                                        <div className={css.heatBody}>
                                            <div className={css.manualSection}>
                                                <div className={css.headRow}>
                                                    <span className={css.headLabel}>Head 1</span>
                                                    <button
                                                        type="button"
                                                        className={css.linkBtn}
                                                        onClick={() => addRound(heats.length)}
                                                    >
                                                        Add Round to Head 1
                                                    </button>
                                                </div>
                                            </div>
                                            <div className={css.uploadSection}>
                                                <h4 className={css.uploadTitle}>Upload CSV</h4>
                                                <p className={css.uploadHint}>
                                                    Drag and drop or browse. Columns: heat, round, player1, player2, score1, score2
                                                </p>
                                                {csvError && (
                                                    <p className={css.uploadError} role="alert">
                                                        {csvError}
                                                    </p>
                                                )}
                                                <div
                                                    className={css.uploadZone}
                                                    onDrop={(e) => onUploadZoneDrop(e, heats.length)}
                                                    onDragOver={onUploadZoneDragOver}
                                                >
                                                    <span className={css.uploadIcon} aria-hidden>
                                                        ↓
                                                    </span>
                                                    <p className={css.uploadZoneText}>
                                                        Choose a file or drag & drop it here.
                                                    </p>
                                                    <p className={css.uploadZoneMeta}>
                                                        CSV - Up to 5 MB
                                                    </p>
                                                    <button
                                                        type="button"
                                                        className={css.browseBtn}
                                                        onClick={() => onUploadZoneClick(heats.length)}
                                                    >
                                                        Browse files
                                                    </button>
                                                </div>
                                            </div>
                                            {(roundsByHeat[heats.length] ?? [0]).map(
                                                (roundIndex) => (
                                                    <div
                                                        key={`final-${roundIndex}`}
                                                        className={css.roundBlock}
                                                    >
                                                        <div className={css.roundTitleRow}>
                                                            <div className={css.roundTitleWithActions}>
                                                                <span className={css.roundTitle}>
                                                                    Round {roundIndex + 1}
                                                                </span>
                                                                <div className={css.roundHeaderActions}>
                                                                    <button
                                                                        type="button"
                                                                        className={css.linkBtn}
                                                                        onClick={() =>
                                                                            addMatch(
                                                                                heats.length,
                                                                                roundIndex
                                                                            )
                                                                        }
                                                                    >
                                                                        Add Match to Round{" "}
                                                                        {roundIndex + 1}
                                                                    </button>
                                                                    {(roundsByHeat[heats.length] ?? [0])
                                                                        .length > 1 && (
                                                                        <button
                                                                            type="button"
                                                                            className={css.removeRoundBtn}
                                                                            onClick={() =>
                                                                                removeRound(
                                                                                    heats.length,
                                                                                    roundIndex
                                                                                )
                                                                            }
                                                                            title="Remove round"
                                                                        >
                                                                            Remove round
                                                                        </button>
                                                                    )}
                                                                </div>
                                                            </div>
                                                        </div>
                                                        <div className={css.roundBody}>
                                                            <div className={css.manualSection}>
                                                                <h4 className={css.manualTitle}>
                                                                    Manual data entry
                                                                </h4>
                                                                <div className={css.matchesGrid}>
                                                                    <div className={css.matchesCol}>
                                                                        {getMatches(
                                                                            heats.length,
                                                                            roundIndex
                                                                        ).map((m, idx) => (
                                                                            <div
                                                                                key={idx}
                                                                                className={css.matchRowWrap}
                                                                            >
                                                                                <MatchResultCell
                                                                                    players={getQualifiedForFinal()}
                                                                                    value={m.player1Id}
                                                                                    score={m.score1}
                                                                                    onPlayerChange={(id) =>
                                                                                        updateMatch(
                                                                                            heats.length,
                                                                                            roundIndex,
                                                                                            idx,
                                                                                            {
                                                                                                player1Id: id,
                                                                                            }
                                                                                        )
                                                                                    }
                                                                                    onScoreChange={(n) =>
                                                                                        updateMatch(
                                                                                            heats.length,
                                                                                            roundIndex,
                                                                                            idx,
                                                                                            {
                                                                                                score1: n,
                                                                                            }
                                                                                        )
                                                                                    }
                                                                                />
                                                                                <button
                                                                                    type="button"
                                                                                    className={css.removeMatchBtn}
                                                                                    onClick={() =>
                                                                                        removeMatch(
                                                                                            heats.length,
                                                                                            roundIndex,
                                                                                            idx
                                                                                        )
                                                                                    }
                                                                                    disabled={
                                                                                        getMatches(
                                                                                            heats.length,
                                                                                            roundIndex
                                                                                        ).length <= 1
                                                                                    }
                                                                                    title="Remove match"
                                                                                    aria-label="Remove match"
                                                                                >
                                                                                    <Icon
                                                                                        name="x"
                                                                                        className={css.removeMatchIcon}
                                                                                    />
                                                                                </button>
                                                                            </div>
                                                                        ))}
                                                                    </div>
                                                                    <div className={css.matchesCol}>
                                                                        {getMatches(
                                                                            heats.length,
                                                                            roundIndex
                                                                        ).map((m, idx) => (
                                                                            <div
                                                                                key={idx}
                                                                                className={css.matchRowWrap}
                                                                            >
                                                                                <MatchResultCell
                                                                                    players={getQualifiedForFinal()}
                                                                                    value={m.player2Id}
                                                                                    score={m.score2}
                                                                                    onPlayerChange={(id) =>
                                                                                        updateMatch(
                                                                                            heats.length,
                                                                                            roundIndex,
                                                                                            idx,
                                                                                            {
                                                                                                player2Id: id,
                                                                                            }
                                                                                        )
                                                                                    }
                                                                                    onScoreChange={(n) =>
                                                                                        updateMatch(
                                                                                            heats.length,
                                                                                            roundIndex,
                                                                                            idx,
                                                                                            {
                                                                                                score2: n,
                                                                                            }
                                                                                        )
                                                                                    }
                                                                                />
                                                                                <button
                                                                                    type="button"
                                                                                    className={css.removeMatchBtn}
                                                                                    onClick={() =>
                                                                                        removeMatch(
                                                                                            heats.length,
                                                                                            roundIndex,
                                                                                            idx
                                                                                        )
                                                                                    }
                                                                                    disabled={
                                                                                        getMatches(
                                                                                            heats.length,
                                                                                            roundIndex
                                                                                        ).length <= 1
                                                                                    }
                                                                                    title="Remove match"
                                                                                    aria-label="Remove match"
                                                                                >
                                                                                    <Icon
                                                                                        name="x"
                                                                                        className={css.removeMatchIcon}
                                                                                    />
                                                                                </button>
                                                                            </div>
                                                                        ))}
                                                                    </div>
                                                                </div>
                                                                <button
                                                                    type="button"
                                                                    className={css.saveResultsBtn}
                                                                    onClick={handleSaveResults}
                                                                    disabled={saveStatus === "saving"}
                                                                >
                                                                    {saveStatus === "saving"
                                                                        ? "Saving…"
                                                                        : "Save results"}
                                                                </button>
                                                            </div>
                                                        </div>
                                                    </div>
                                                )
                                            )}
                                        </div>
                                    )}
                                </div>
                            )}
                        </div>
                    )}
                </div>

                {saveStatus === "saved" && (
                    <p className={css.saveStatus} role="status">
                        Results saved.
                    </p>
                )}
                {saveStatus === "error" && saveError && (
                    <p className={css.saveError} role="alert">
                        {saveError}
                    </p>
                )}
            </div>
        </section>
    );
}
