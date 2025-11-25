import React from "react";
import css from "./styles.module.scss";
import { CustomRoundedDropdown, SearchInput } from "@/shared/ui";

const kingdomOptions = [
    { value: "kingdom-1", label: "Kingdom 1" },
    { value: "kingdom-2", label: "Kingdom 2" },
    { value: "kingdom-3", label: "Kingdom 3" },
];
const clubOptions = [
    { value: "club-1", label: "Club 1" },
    { value: "club-2", label: "Club 2" },
    { value: "club-3", label: "Club 3" },
];

export const Players: React.FC = () => {
    return (
        <div className={css.players}>
            <div className="container">
                <h2 className={css.players_title}>Players</h2>
                <p className={css.players_description}>
                    Explore player profiles and stats
                </p>
                <div className={css.players_head}>
                    <SearchInput
                        placeholder="Find player by name or club"
                        ariaLabel="Find player by name or club"
                        className={css.players_head_search}
                    />
                    <div className={css.players_filters}>
                        <CustomRoundedDropdown
                            id="kingdom"
                            options={kingdomOptions}
                            placeholder="Kingdom"
                            className={css.players_filters_dropdown}
                        />
                        <CustomRoundedDropdown
                            id="club"
                            options={clubOptions}
                            placeholder="Club"
                            className={css.players_filters_dropdown}
                        />
                    </div>
                </div>
            </div>
        </div>
    );
};
