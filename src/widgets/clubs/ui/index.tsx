"use client";
import React from "react";
import css from "./styles.module.scss";
import { Icon } from "@/shared/ui/icons";
import { CustomButton, CustomRoundedDropdown } from "@/shared/ui";
import clubsList from "@/data/clubs-list.json";
import { IClub } from "@/shared/types";
import { ClubCard } from "../components/club-card/ClubCard";
import { clientRoutes } from "@/shared/routes/client";
import { useRouter } from "next/navigation";

const kingdomOptions = [
    { value: "kingdom-1", label: "Kingdom 1" },
    { value: "kingdom-2", label: "Kingdom 2" },
    { value: "kingdom-3", label: "Kingdom 3" },
];

export const Clubs: React.FC = () => {
    const clubs: IClub[] = clubsList.clubs;
    const router = useRouter();
    return (
        <section className={css.clubs}>
            <div className="container">
                <h2 className={css.clubs_title}>Clubs</h2>
                <div className={css.clubs_head}>
                    <div className={css.clubs_head_search}>
                        <input
                            type="search"
                            placeholder="Find player by name or club"
                            aria-label="Find club by name"
                        />
                        <button
                            type="button"
                            className={css.rankings_head_search_button}
                            aria-label="Search player"
                        >
                            <Icon
                                name="search"
                                className={css.rankings_head_search_button_icon}
                            />
                        </button>
                    </div>
                    <CustomRoundedDropdown
                        id="club-dropdown"
                        options={kingdomOptions}
                        placeholder="Kingdom"
                        aria-label="Select Kingdom"
                        className={css.clubs_head_dropdown}
                    />
                </div>
                <div className={css.clubs_content}>
                    {clubs.map((club) => (
                        <ClubCard key={club.id} {...club} />
                    ))}
                </div>
                <CustomButton
                    className={css.clubs_button}
                    onClick={() => router.push(clientRoutes.clubs)}
                >
                    View all Clubs
                </CustomButton>
            </div>
        </section>
    );
};
