"use client";

import React, { useState } from "react";
import { useRouter } from "next/navigation";
import css from "../styles.module.scss";
import { Icon } from "@/shared/ui/icons";
import { CustomRoundedDropdown } from "@/shared/ui";
import { usePopup } from "@/shared/contexts/popup-context";
import { useAuth } from "@/shared/hooks/use-auth";
import { useEventRegistration } from "@/shared/hooks/use-event-registration";
import type { QualifyingHeatsData } from "@/shared/types";
import cn from "classnames";

type JoinTournamentPopupData = {
    eventId?: number;
    title?: string;
    qualifyingHeats?: QualifyingHeatsData;
    heatIndex?: number;
    totalParticipants?: number;
};

export const JoinTournamentPopup: React.FC = () => {
    const router = useRouter();
    const { closePopup, getPopupData } = usePopup();
    const { isAuth, user } = useAuth();
    const { registerForEvent, state, resetState } = useEventRegistration();
    const data = getPopupData("join-tournament") as JoinTournamentPopupData | undefined;
    const title = data?.title ?? "Tournament";
    const eventId = data?.eventId ?? 0;
    const qualifyingHeats = data?.qualifyingHeats;
    const heats = qualifyingHeats?.heats ?? [];

    const heatOptions = heats.map((_, i) => ({
        value: String(i + 1),
        label: `Qualifying Heat ${i + 1}`,
    }));

    const [selectedHeat, setSelectedHeat] = useState(() => {
        const hi = data?.heatIndex;
        if (hi != null && hi >= 1 && hi <= heats.length) return String(hi);
        return "";
    });

    const handleSubmit = async (e: React.FormEvent) => {
        e.preventDefault();
        if (!isAuth || !user?.id || !eventId) return;
        if (heats.length > 0 && !selectedHeat) return;
        const heatIndex = selectedHeat ? parseInt(selectedHeat, 10) : undefined;
        const ok = await registerForEvent(eventId, user.id, heatIndex, data?.totalParticipants);
        if (ok) {
            resetState();
            closePopup("join-tournament");
            window.dispatchEvent(new CustomEvent("event-registration-updated", { detail: { eventId } }));
            router.refresh();
        }
    };

    return (
        <div className={css.popup}>
            <div className={css.popup_close}>
                <Icon
                    name="x"
                    className={css.popup_close_icon}
                    onClick={() => {
                        resetState();
                        closePopup("join-tournament");
                    }}
                />
            </div>
            <div className={css.popup_content}>
                <h2 className={css.join_tournament_title}>{title}</h2>
                {!isAuth ? (
                    <p className={css.join_tournament_description}>
                        Sign in to register for this tournament.
                    </p>
                ) : (
                    <>
                        <p className={css.join_tournament_description}>
                            Choose a qualifying heat to register.
                        </p>
                        <form
                            noValidate
                            onSubmit={handleSubmit}
                            className={css.popup_form}
                        >
                            <div className={css.join_tournament_dropdown_wrap}>
                                <label
                                    className={css.join_tournament_dropdown_label}
                                    htmlFor="qualifying-heats"
                                >
                                    Qualifying heats to the tournament
                                </label>
                                <CustomRoundedDropdown
                                    id="qualifying-heats"
                                    placeholder="Choose a qualifying heat"
                                    options={heatOptions}
                                    value={selectedHeat}
                                    onChange={setSelectedHeat}
                                    className={css.join_tournament_dropdown}
                                />
                            </div>
                            {state.status === "error" && (
                                <p className={css.join_tournament_error}>
                                    {state.message}
                                </p>
                            )}
                            <button
                                type="submit"
                                disabled={state.status === "loading" || (heats.length > 0 && !selectedHeat)}
                                className={cn(css.popup_button, css.join_tournament_submit)}
                            >
                                {state.status === "loading"
                                    ? "Registering…"
                                    : "Register for tournament"}
                            </button>
                        </form>
                    </>
                )}
            </div>
        </div>
    );
};
