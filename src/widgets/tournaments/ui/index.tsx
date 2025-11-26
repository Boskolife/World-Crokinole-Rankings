"use client";
import React from "react";
import css from "./styles.module.scss";
import { TournamentTable } from "@/shared/modules";
import tournamentsList from "@/data/tournaments-list.json";
import { ITournament } from "@/shared/types/tournament.interface";
import { Button } from "@/shared/ui";

export const Tournaments: React.FC = () => {
    const tournaments: ITournament[] = tournamentsList.tournaments;

    return (
        <>
            <div className={css.tournaments}>
                <div className="container">
                    <h3 className={css.tournaments_title}>
                        Top 8 Tournaments (24 months)
                    </h3>
                    <TournamentTable
                        tournaments={tournaments}
                        className={css.tournament_table}
                    />
                    <Button
                        buttonType="secondary"
                        className={css.tournaments_button}
                    >
                        View all tournaments
                    </Button>
                </div>
            </div>
        </>
    );
};
