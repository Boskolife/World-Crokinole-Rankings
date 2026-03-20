"use client";

import React, { useEffect, useMemo, useState } from "react";
import Image from "next/image";
import Link from "next/link";
import { useRouter } from "next/navigation";
import cn from "classnames";
import { Icon } from "@/shared/ui/icons";
import { usePopup } from "@/shared/contexts/popup-context";
import { useAuth, useUserProfile } from "@/shared/hooks";
import { useEventRegistration } from "@/shared/hooks/use-event-registration";
import { useEventRegistrationStatus } from "@/shared/hooks/use-event-registration-status";
import type { IEventCardProps } from "@/shared/types";
import { localeConfig } from "@/app/localization/config";
import { useParams } from "next/navigation";
import { RootLink } from "@/shared/ui/links/root-link";
import { clientRoutes } from "@/shared/routes/client";
import { stageFormatOptions, seedingMethodOptions } from "@/shared/constants/dropdown-options";
import { supabase, isSupabaseConfigured } from "@/shared/supabase/client";
import css from "./EventDetailHero.module.scss";

const stageFormatLabel = (value: string) =>
    stageFormatOptions.find((o) => o.value === value)?.label ?? value;
const seedingMethodLabel = (value: string) =>
    seedingMethodOptions.find((o) => o.value === value)?.label ?? value;

type StructureParsed = {
    description?: string;
    stages?: Array<{
        stageFormat?: string;
        seedingMethod?: string;
        numberOfRounds?: string;
        matchType?: string;
    }>;
};

function parseStructureDisplay(structure: string | undefined): StructureParsed | null {
    if (!structure?.trim()) return null;
    const raw = structure.trim();
    let parsed: StructureParsed | null = null;
    if (raw.startsWith("{")) {
        try {
            parsed = JSON.parse(raw) as StructureParsed;
        } catch {
            return null;
        }
    } else {
        const jsonStart = raw.indexOf("{\"stages\":");
        if (jsonStart >= 0) {
            const desc = raw.slice(0, jsonStart).trim();
            try {
                const parsedJson: StructureParsed = JSON.parse(raw.slice(jsonStart));
                parsed = desc ? { ...parsedJson, description: desc } : parsedJson;
            } catch {
                return null;
            }
        } else {
            return null;
        }
    }

    return parsed;
}

function formatStructureDisplay(structure: string | undefined): string {
    if (!structure?.trim()) return "";
    const raw = structure.trim();
    const parsed = parseStructureDisplay(structure);
    if (!parsed) return raw;
    const parts: string[] = [];
    if (parsed.description) parts.push(parsed.description);
    if (parsed.stages?.length) {
        parsed.stages.forEach((s, i) => {
            const format = stageFormatLabel(s.stageFormat ?? "");
            const seeding = seedingMethodLabel(s.seedingMethod ?? "");
            const rounds = (s.numberOfRounds ?? "").trim();
            const line = rounds
                ? `Stage ${i + 1}: ${format}, Seeding: ${seeding}, Rounds: ${rounds}`
                : `Stage ${i + 1}: ${format}, Seeding: ${seeding}`;
            parts.push(line);
        });
    }
    return parts.join("\n");
}

export interface EventDetailHeroProps {
    event: IEventCardProps;
}

function DetailRow({
    label,
    value,
    inline = false,
    preLine = false,
}: {
    label: string;
    value: string | number | undefined;
    inline?: boolean;
    preLine?: boolean;
}) {
    if (value === undefined || value === "") return null;
    return (
        <div className={cn(css.detail_row, { [css.detail_row_inline]: inline })}>
            <span className={css.detail_label}>{label}</span>
            <span className={cn(css.detail_value, { [css.detail_value_pre]: preLine })}>{value}</span>
        </div>
    );
}

export function EventDetailHero({ event }: EventDetailHeroProps) {
    const router = useRouter();
    const params = useParams() as { locale?: string };
    const locale = params?.locale ?? localeConfig.defaultLocale;
    const { openPopup } = usePopup();
    const { isAuth, user } = useAuth();
    const { fullName: currentUserFullName } = useUserProfile();
    const { registerForEvent, state, resetState } = useEventRegistration();
    const {
        id: eventId,
        createdBy,
        image,
        title,
        price,
        date,
        location,
        format,
        isRanked,
        isRegistrationRequired,
        currentRank,
        totalParticipants,
        structure,
        strengthOfField,
        qualifyingHeats,
        endDate,
        startDate,
        winner,
        tournamentPointsAvailable,
    } = event;

    const isEventEnded = (() => {
        const ref = endDate || startDate;
        if (!ref) return false;
        return new Date(ref) < new Date();
    })();

    const isCreator = Boolean(createdBy && user?.id && createdBy === user.id);

    const { status: regStatus, refetch: refetchRegStatus } = useEventRegistrationStatus(eventId, user?.id);

    const isTournament = (format ?? "").toLowerCase() === "tournament";
    const entityLabel = isTournament ? "Tournament" : "Event";
    const joinLabel = `Join ${entityLabel}`;
    const leaveLabel = `Leave ${entityLabel.toLowerCase()}`;

    const hasQualifyingHeats =
        qualifyingHeats?.heats != null && qualifyingHeats.heats.length > 0;

    const isEventFree = (() => {
        const p = (price ?? "").toString().trim().toLowerCase();
        return p === "" || p === "free" || p === "0";
    })();

    const handleJoinClick = () => {
        if (!isAuth || !user?.id) return;
        if (!isEventFree) {
            if (hasQualifyingHeats) {
                openPopup("join-tournament", {
                    eventId,
                    title,
                    qualifyingHeats,
                    totalParticipants: totalParticipants ?? undefined,
                    fee: price,
                });
            } else {
                openPopup("pay-event-fee", {
                    eventId,
                    title,
                    fee: price,
                    totalParticipants: totalParticipants ?? undefined,
                });
            }
            return;
        }
        if (hasQualifyingHeats) {
            openPopup("join-tournament", {
                eventId,
                title,
                qualifyingHeats,
                totalParticipants: totalParticipants ?? undefined,
            });
        } else {
            registerForEvent(eventId, user.id, undefined, totalParticipants ?? undefined).then((ok) => {
                if (ok) {
                    refetchRegStatus();
                    window.dispatchEvent(
                        new CustomEvent("event-registration-updated", { detail: { eventId } })
                    );
                    router.refresh();
                } else resetState();
            });
        }
    };

    const capacityStr =
        currentRank != null && totalParticipants != null
            ? `${currentRank}/${totalParticipants}`
            : undefined;
    const isFull =
        totalParticipants != null &&
        currentRank != null &&
        currentRank >= totalParticipants;
    const feeStr = (() => {
        const p = (price ?? "").toString().trim().toLowerCase();
        return p === "" || p === "free" || p === "0" ? "Free" : `$${price}`;
    })();

    const tournamentStructure = useMemo(
        () => (isTournament ? parseStructureDisplay(structure) : null),
        [isTournament, structure]
    );

    const tournamentStageCount = tournamentStructure?.stages?.length ?? 0;
    const tournamentStagesLabel =
        tournamentStageCount > 0
            ? `${tournamentStageCount} Stage${tournamentStageCount === 1 ? "" : "s"}`
            : "—";

    const tournamentFirstStage = tournamentStructure?.stages?.[0];

    const tournamentFormat = tournamentFirstStage?.stageFormat
        ? stageFormatOptions.find((o) => o.value === tournamentFirstStage.stageFormat)?.label ??
          tournamentFirstStage.stageFormat
        : "—";

    const normalizeSeedingLabel = (label: string) =>
        label === "Auto (by rating)" ? "Auto by rating" : label;

    const tournamentSeedingMethod = tournamentFirstStage?.seedingMethod
        ? normalizeSeedingLabel(
              seedingMethodOptions.find((o) => o.value === tournamentFirstStage.seedingMethod)?.label ??
                  tournamentFirstStage.seedingMethod
          )
        : "—";

    const tournamentMatchType = (() => {
        const stages = tournamentStructure?.stages ?? [];
        if (stages.length === 0) return "—";

        const normalized = stages.map((s) => (s.matchType ?? "").trim().toLowerCase());
        if (normalized.some((v) => v !== "singles" && v !== "doubles")) return "—";

        const allSingles = normalized.every((v) => v === "singles");
        if (allSingles) return "Singles";

        const allDoubles = normalized.every((v) => v === "doubles");
        if (allDoubles) return "Doubles";

        return "Mixed";
    })();

    const tournamentCapacityLabel =
        totalParticipants != null ? `${totalParticipants} players` : "—";

    const [organizerName, setOrganizerName] = useState<string>(createdBy ?? "—");

    useEffect(() => {
        if (!isTournament) return;
        if (!createdBy) {
            setOrganizerName("—");
            return;
        }

        if (!isSupabaseConfigured) {
            setOrganizerName(createdBy);
            return;
        }

        if (user?.id && createdBy === user.id) {
            setOrganizerName(currentUserFullName || createdBy);
            return;
        }

        let alive = true;
        (async () => {
            try {
                const { data, error } = await supabase
                    .from("profiles")
                    .select("full_name")
                    .eq("id", createdBy)
                    .maybeSingle();

                if (!alive) return;
                if (error || !data) {
                    setOrganizerName(createdBy);
                    return;
                }
                const fullName = (data as { full_name?: string | null }).full_name;
                setOrganizerName(fullName?.trim() ? fullName.trim() : createdBy);
            } catch {
                if (!alive) return;
                setOrganizerName(createdBy);
            }
        })();

        return () => {
            alive = false;
        };
    }, [createdBy, currentUserFullName, isTournament, user?.id]);

    return (
        <section className={css.hero}>
            <div className="container">
                <div className={css.title_row}>
                    <h1 className={css.page_title}>{title}</h1>
                    {isCreator && (
                        <div className={css.title_actions}>
                            <Link
                                href={`/${locale}/events/${eventId}/edit`}
                                className={css.edit_button}
                            >
                                <Icon name="edit" className={css.edit_button_icon} />
                                Edit
                            </Link>
                        </div>
                    )}
                </div>

                <div className={cn(css.card, { [css.card_tournament]: isTournament })}>
                    {isTournament ? (
                        <div className={css.tournament_emblem}>
                            <div className={css.tournament_emblem_top}>
                                {image ? (
                                    <Image
                                        src={image}
                                        alt=""
                                        fill
                                        className={css.tournament_emblem_top_cover}
                                        unoptimized={image.includes("supabase.co")}
                                    />
                                ) : null}
                                <Image
                                    src="/images/crown.png"
                                    alt=""
                                    width={120}
                                    height={120}
                                    className={css.tournament_emblem_crown}
                                    priority
                                />
                            </div>

                            <div className={css.tournament_emblem_bottom}>
                                <div className={css.tournament_emblem_bottom_left}>
                                    <Icon
                                        name="laurels"
                                        className={css.tournament_emblem_bottom_icon}
                                    />
                                    <div className={css.tournament_emblem_bottom_label}>
                                        Laurels For Winning
                                    </div>
                                </div>
                                <div className={css.tournament_emblem_bottom_points}>
                                    {tournamentPointsAvailable ?? "—"}
                                </div>
                            </div>
                        </div>
                    ) : (
                        <div className={css.card_emblem}>
                            {image ? (
                                <Image
                                    src={image}
                                    alt=""
                                    fill
                                    className={css.card_emblem_img}
                                    sizes="280px"
                                />
                            ) : (
                                <div className={css.card_emblem_placeholder}>
                                    <Icon name="laurels" className={css.card_emblem_icon} />
                                </div>
                            )}
                        </div>
                    )}

                    <div className={cn(css.card_body, { [css.card_body_tournament]: isTournament })}>
                        {isTournament ? (
                            <div className={css.tournament_details}>
                                <div className={css.tournament_details_top}>
                                    <div className={css.tournament_detail_field}>
                                        <div className={css.tournament_detail_label}>
                                            Format
                                        </div>
                                        <div className={css.tournament_detail_value}>
                                            {tournamentFormat}
                                        </div>
                                    </div>
                                    <div className={css.tournament_detail_field}>
                                        <div className={css.tournament_detail_label}>
                                            Strength of field:
                                        </div>
                                        <div className={css.tournament_detail_value}>
                                            {strengthOfField ?? "—"}
                                        </div>
                                    </div>
                                </div>

                                <div className={css.tournament_details_divider} />

                                <div className={css.tournament_details_grid}>
                                    <div className={css.tournament_details_cell}>
                                        <div className={css.tournament_detail_label}>Type</div>
                                        <div className={css.tournament_detail_value}>
                                            {isRanked ? "Ranked" : "Unranked"}
                                        </div>
                                    </div>
                                    <div className={css.tournament_details_cell}>
                                        <div className={css.tournament_detail_label}>Fee</div>
                                        <div className={css.tournament_detail_value}>{feeStr}</div>
                                    </div>

                                    <div className={css.tournament_details_cell}>
                                        <div className={css.tournament_detail_label}>Data</div>
                                        <div className={css.tournament_detail_value}>{date}</div>
                                    </div>
                                    <div className={css.tournament_details_cell}>
                                        <div className={css.tournament_detail_label}>Location</div>
                                        <div className={css.tournament_detail_value}>{location}</div>
                                    </div>

                                    <div className={css.tournament_details_cell}>
                                        <div className={css.tournament_detail_label}>Stages</div>
                                        <div className={css.tournament_detail_value}>
                                            {tournamentStagesLabel}
                                        </div>
                                    </div>
                                    <div className={css.tournament_details_cell}>
                                        <div className={css.tournament_detail_label}>Capacity</div>
                                        <div className={css.tournament_detail_value}>
                                            {tournamentCapacityLabel}
                                        </div>
                                    </div>

                                    <div className={css.tournament_details_cell}>
                                        <div className={css.tournament_detail_label}>Organizer</div>
                                        <div className={css.tournament_detail_value}>
                                            {organizerName}
                                        </div>
                                    </div>
                                    <div className={css.tournament_details_cell} />
                                </div>

                                <div className={css.tournament_details_divider} />

                                <div className={css.tournament_details_bottom_grid}>
                                    <div className={css.tournament_details_cell}>
                                        <div className={css.tournament_detail_label}>
                                            Seeding method
                                        </div>
                                        <div className={css.tournament_detail_value}>
                                            {tournamentSeedingMethod}
                                        </div>
                                    </div>
                                    <div className={css.tournament_details_cell}>
                                        <div className={css.tournament_detail_label}>
                                            Match type
                                        </div>
                                        <div className={css.tournament_detail_value}>
                                            {tournamentMatchType}
                                        </div>
                                    </div>
                                </div>
                            </div>
                        ) : (
                            <>
                                <div className={css.details_top}>
                                    <div className={css.details_top_left}>
                                        <DetailRow label="Type" value={isRanked ? "Ranked" : "Unranked"} />
                                    </div>
                                    <div className={css.details_top_right}>
                                        <DetailRow
                                            label="Strength of field:"
                                            value={strengthOfField ?? "—"}
                                            inline
                                        />
                                    </div>
                                </div>
                                <div className={css.details_divider} />
                                <div className={css.details_grid}>
                                    <div className={css.details_col}>
                                        <DetailRow label="Data" value={date} />
                                        <DetailRow label="Location" value={location} />
                                        <DetailRow label="Capacity" value={capacityStr} />
                                    </div>
                                    <div className={css.details_col}>
                                        <DetailRow label="Format" value={format} />
                                        <DetailRow
                                            label="Structure"
                                            value={formatStructureDisplay(structure)}
                                            preLine
                                        />
                                        <DetailRow label="Fee" value={feeStr} />
                                        {isEventEnded && winner && <DetailRow label="Winner" value={winner} />}
                                    </div>
                                </div>
                            </>
                        )}

                        {!isEventEnded && (
                            <div className={css.card_actions}>
                                {!isCreator && (
                                    <>
                                        {!isAuth ? (
                                            <RootLink
                                                href={clientRoutes.signUp}
                                                className={css.join_button}
                                            >
                                                {joinLabel}
                                            </RootLink>
                                        ) : regStatus?.isRegistered ? (
                                            <>
                                                <span
                                                    className={cn(css.join_button, css.join_button_registered)}
                                                >
                                                    Registered
                                                </span>
                                                <button
                                                    type="button"
                                                    className={cn(css.join_button, css.join_button_leave)}
                                                    onClick={() => {
                                                        if (!user?.id) return;
                                                        openPopup("leave-event-confirm", {
                                                            eventId,
                                                            userId: user.id,
                                                            eventTitle: title,
                                                            isTournament,
                                                            onSuccess: () => {
                                                                refetchRegStatus();
                                                                window.dispatchEvent(
                                                                    new CustomEvent("event-registration-updated", {
                                                                        detail: { eventId },
                                                                    })
                                                                );
                                                                router.refresh();
                                                            },
                                                        });
                                                    }}
                                                >
                                                    {leaveLabel}
                                                </button>
                                            </>
                                        ) : isFull ? (
                                            <span
                                                className={cn(css.join_button, css.join_button_registered)}
                                            >
                                                Full
                                            </span>
                                        ) : (
                                            <>
                                                <button
                                                    type="button"
                                                    className={css.join_button}
                                                    disabled={state.status === "loading"}
                                                    onClick={handleJoinClick}
                                                >
                                                    {state.status === "loading"
                                                        ? "Joining…"
                                                        : joinLabel}
                                                </button>
                                                {state.status === "error" && (
                                                    <span className={css.join_error}>
                                                        {state.message}
                                                    </span>
                                                )}
                                            </>
                                        )}
                                    </>
                                )}
                                <span
                                    className={cn(css.registration_note, {
                                        [css._required]: isRegistrationRequired,
                                    })}
                                >
                                    {isRegistrationRequired
                                        ? (isTournament ? "Tournament registration is required" : "Registration is required")
                                        : (isTournament ? "No tournament registration required" : "No registration required")}
                                </span>
                            </div>
                        )}
                        {isEventEnded && (
                            <div className={css.event_ended_banner}>
                                {isTournament ? "The tournament has ended" : "The event has ended"}
                            </div>
                        )}
                    </div>
                </div>
            </div>
        </section>
    );
}
