"use client";

import React, { useMemo, useState } from "react";
import Image from "next/image";
import { useRouter } from "next/navigation";
import cn from "classnames";
import { Icon } from "@/shared/ui/icons";
import { CustomRoundedDropdown } from "@/shared/ui";
import { usePopup } from "@/shared/contexts/popup-context";
import type { IPlayer, TournamentMatchResultPayload } from "@/shared/types";
import css from "./EditTournamentMatchPopup.module.scss";
import popupBase from "../styles.module.scss";

const getCountryFlagUrl = (countryCode: string) =>
    `https://flagcdn.com/w160/${countryCode.toLowerCase()}.png`;

export type EditTournamentMatchPopupData = {
    eventId: number;
    isRanked: boolean;
    matchKey: string;
    roundTitle: string;
    allPlayers: IPlayer[];
    defaultPlayer1Id: string | null;
    defaultPlayer2Id: string | null;
    saved?: TournamentMatchResultPayload | null;
    eventStartDate?: string | null;
    seedLabel1?: number;
    seedLabel2?: number;
};

function formatOrdinalDate(iso?: string | null): string {
    if (!iso) return "—";
    const d = new Date(iso);
    if (Number.isNaN(d.getTime())) return "—";
    const day = d.getDate();
    const j = day % 10;
    const k = day % 100;
    let suff = "th";
    if (j === 1 && k !== 11) suff = "st";
    else if (j === 2 && k !== 12) suff = "nd";
    else if (j === 3 && k !== 13) suff = "rd";
    const month = d.toLocaleDateString("en-GB", { month: "long" });
    const year = d.getFullYear();
    return `${day}${suff} of ${month} ${year}`;
}

function defaultRounds(): [number, number][] {
    return [
        [0, 0],
        [0, 0],
        [0, 0],
        [0, 0],
    ];
}

function MatchForm({
    data,
    onClose,
}: {
    data: EditTournamentMatchPopupData;
    onClose: () => void;
}) {
    const router = useRouter();
    const s = data.saved;
    const [p1, setP1] = useState(() => s?.player1Id ?? data.defaultPlayer1Id ?? "");
    const [p2, setP2] = useState(() => s?.player2Id ?? data.defaultPlayer2Id ?? "");
    const [setsP1, setSetsP1] = useState(() => s?.setsP1 ?? 0);
    const [setsP2, setSetsP2] = useState(() => s?.setsP2 ?? 0);
    const [roundScores, setRoundScores] = useState<[number, number][]>(() =>
        s?.roundScores?.length === 4 ? [...s.roundScores] : defaultRounds()
    );
    const [twP1, setTwP1] = useState(() => s?.twentiesP1 ?? 0);
    const [twP2, setTwP2] = useState(() => s?.twentiesP2 ?? 0);
    const [totP1, setTotP1] = useState(() => s?.totalP1 ?? 0);
    const [totP2, setTotP2] = useState(() => s?.totalP2 ?? 0);
    const [error, setError] = useState<string | null>(null);
    const [saving, setSaving] = useState(false);

    const options = useMemo(
        () =>
            data.allPlayers.map((pl) => ({
                value: pl.id,
                label: pl.name,
            })),
        [data.allPlayers]
    );

    const pl1 = data.allPlayers.find((x) => x.id === p1) ?? null;
    const pl2 = data.allPlayers.find((x) => x.id === p2) ?? null;
    const seed1 = data.seedLabel1 ?? 1;
    const seed2 = data.seedLabel2 ?? 2;
    const p1Ahead = setsP1 > setsP2;
    const p2Ahead = setsP2 > setsP1;

    const updateRoundScore = (idx: number, side: 0 | 1, v: number) => {
        setRoundScores((prev) => {
            const next = prev.map((row, i) => {
                if (i !== idx) return row;
                const copy: [number, number] = [...row];
                copy[side] = Number.isNaN(v) ? 0 : Math.max(0, v);
                return copy;
            });
            return next;
        });
    };

    const handleSave = async () => {
        setError(null);
        if (!p1 || !p2 || p1 === p2) {
            setError("Choose two different players.");
            return;
        }
        setSaving(true);
        try {
            const res = await fetch("/api/tournament-match-result", {
                method: "POST",
                headers: { "Content-Type": "application/json" },
                body: JSON.stringify({
                    eventId: data.eventId,
                    matchKey: data.matchKey,
                    player1Id: p1,
                    player2Id: p2,
                    setsP1,
                    setsP2,
                    roundScores,
                    twentiesP1: twP1,
                    twentiesP2: twP2,
                    totalP1: totP1,
                    totalP2: totP2,
                }),
            });
            const json = (await res.json().catch(() => ({}))) as { error?: string };
            if (!res.ok) {
                setError(json.error ?? "Save failed");
                setSaving(false);
                return;
            }
            setSaving(false);
            onClose();
            window.dispatchEvent(
                new CustomEvent("event-registration-updated", {
                    detail: { eventId: data.eventId },
                })
            );
            router.refresh();
        } catch {
            setError("Network error");
            setSaving(false);
        }
    };

    const roundLabels = ["Round 1", "Round 2", "Round 3", "Round 4"];

    return (
        <div className={cn(popupBase.popup, css.root)}>
            <button
                type="button"
                className={css.closeBtn}
                onClick={onClose}
                aria-label="Close"
            >
                <Icon name="x" className={css.closeIcon} />
            </button>
            <h2 className={css.title}>Edit Details - {data.roundTitle}</h2>

            <div className={css.row2}>
                <div className={css.fieldCol}>
                    <span className={css.fieldLabel}>Player 1</span>
                    <div className={css.dropdownWrap}>
                        <CustomRoundedDropdown
                            id={`tm-p1-${data.matchKey}`}
                            placeholder="Select player"
                            options={options}
                            value={p1}
                            onChange={setP1}
                            buttonClassName={css.ddBtn}
                        />
                    </div>
                </div>
                <div className={css.fieldCol}>
                    <span className={css.fieldLabel}>Player 2</span>
                    <div className={css.dropdownWrap}>
                        <CustomRoundedDropdown
                            id={`tm-p2-${data.matchKey}`}
                            placeholder="Select player"
                            options={options}
                            value={p2}
                            onChange={setP2}
                            buttonClassName={css.ddBtn}
                        />
                    </div>
                </div>
            </div>

            <div className={css.dateCenter}>{formatOrdinalDate(data.eventStartDate)}</div>

            <div className={css.heroScores}>
                <div className={css.heroRow}>
                    <div className={css.heroSideLeft}>
                        <div className={css.heroNameCol}>
                            <span
                                className={p1Ahead ? css.heroName : css.heroNameMuted}
                            >
                                {pl1?.name ?? "—"}
                            </span>
                            <span className={p1Ahead ? css.seedBadge : css.seedBadgeMuted}>
                                #{seed1}
                            </span>
                        </div>
                        <div className={p1Ahead ? css.flagWrap : css.flagWrapMuted}>
                            {pl1?.countryCode ? (
                                <Image
                                    src={getCountryFlagUrl(pl1.countryCode)}
                                    alt=""
                                    width={40}
                                    height={40}
                                    className={css.flagImg}
                                />
                            ) : null}
                        </div>
                    </div>
                    <div className={css.scoreBoxLg}>
                        <input
                            type="number"
                            className={css.scoreInputLg}
                            value={setsP1}
                            onChange={(e) => setSetsP1(clampIntInput(e.target.value))}
                            min={0}
                        />
                    </div>
                    <div className={css.scoreBoxLg}>
                        <input
                            type="number"
                            className={css.scoreInputLg}
                            value={setsP2}
                            onChange={(e) => setSetsP2(clampIntInput(e.target.value))}
                            min={0}
                        />
                    </div>
                    <div className={css.heroSideRight}>
                        <div className={p2Ahead ? css.flagWrap : css.flagWrapMuted}>
                            {pl2?.countryCode ? (
                                <Image
                                    src={getCountryFlagUrl(pl2.countryCode)}
                                    alt=""
                                    width={40}
                                    height={40}
                                    className={css.flagImg}
                                />
                            ) : null}
                        </div>
                        <div className={css.heroNameColRight}>
                            <span className={p2Ahead ? css.heroName : css.heroNameMuted}>
                                {pl2?.name ?? "—"}
                            </span>
                            <span className={p2Ahead ? css.seedBadge : css.seedBadgeMuted}>
                                #{seed2}
                            </span>
                        </div>
                    </div>
                </div>
            </div>

            <div className={css.detailRows}>
                {roundLabels.map((label, idx) => (
                    <div key={label} className={css.detailRow}>
                        <div className={css.scoreBoxSm}>
                            <input
                                type="number"
                                className={css.scoreInputSm}
                                value={roundScores[idx]?.[0] ?? 0}
                                onChange={(e) =>
                                    updateRoundScore(idx, 0, clampIntInput(e.target.value))
                                }
                                min={0}
                            />
                        </div>
                        <span className={css.detailLabel}>{label}</span>
                        <div className={css.scoreBoxSm}>
                            <input
                                type="number"
                                className={css.scoreInputSm}
                                value={roundScores[idx]?.[1] ?? 0}
                                onChange={(e) =>
                                    updateRoundScore(idx, 1, clampIntInput(e.target.value))
                                }
                                min={0}
                            />
                        </div>
                    </div>
                ))}
                <div className={css.detailRow}>
                    <div className={css.scoreBoxSm}>
                        <input
                            type="number"
                            className={css.scoreInputSm}
                            value={twP1}
                            onChange={(e) => setTwP1(clampIntInput(e.target.value))}
                            min={0}
                        />
                    </div>
                    <span className={css.detailLabel}>20s Scores</span>
                    <div className={css.scoreBoxSm}>
                        <input
                            type="number"
                            className={css.scoreInputSm}
                            value={twP2}
                            onChange={(e) => setTwP2(clampIntInput(e.target.value))}
                            min={0}
                        />
                    </div>
                </div>
                <div className={css.detailRow}>
                    <div className={css.scoreBoxSm}>
                        <input
                            type="number"
                            className={css.scoreInputSm}
                            value={totP1}
                            onChange={(e) => setTotP1(clampIntInput(e.target.value))}
                            min={0}
                        />
                    </div>
                    <span className={css.detailLabel}>Score</span>
                    <div className={css.scoreBoxSm}>
                        <input
                            type="number"
                            className={css.scoreInputSm}
                            value={totP2}
                            onChange={(e) => setTotP2(clampIntInput(e.target.value))}
                            min={0}
                        />
                    </div>
                </div>
            </div>

            {error ? (
                <p className={css.error} role="alert">
                    {error}
                </p>
            ) : null}

            <div className={css.actions}>
                <button type="button" className={css.btnCancel} onClick={onClose}>
                    Cancel
                </button>
                <button
                    type="button"
                    className={css.btnSave}
                    onClick={() => void handleSave()}
                    disabled={saving}
                >
                    {saving ? "Saving…" : "Save Changes and Notify Players"}
                </button>
            </div>
        </div>
    );
}

function clampIntInput(raw: string): number {
    const n = parseInt(raw, 10);
    if (Number.isNaN(n) || n < 0) return 0;
    return Math.min(n, 99999);
}

export const EditTournamentMatchPopup: React.FC = () => {
    const { closePopup, getPopupData } = usePopup();
    const data = getPopupData("edit-tournament-match") as
        | EditTournamentMatchPopupData
        | undefined;

    if (!data?.eventId || !data.matchKey) {
        return null;
    }

    return (
        <MatchForm
            key={data.matchKey}
            data={data}
            onClose={() => closePopup("edit-tournament-match")}
        />
    );
};
