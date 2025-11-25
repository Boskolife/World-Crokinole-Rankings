"use client";
import React from "react";
import css from "./styles.module.scss";
import {
    Button,
    CustomButton,
    CustomRoundedDropdown,
    SearchInput,
} from "@/shared/ui";
import clubsList from "@/data/clubs-list.json";
import { IClub } from "@/shared/types";
import { ClubCard } from "../components/club-card/ClubCard";
import { clientRoutes } from "@/shared/routes/client";
import { useRouter } from "next/navigation";
import { Pagination } from "@/shared/modules";
import { useClubs } from "@/shared/hooks";
import { exampleKingdomOptions, sortOrderOptions } from "@/shared/constants";

export interface IClubsProps {
    title?: string;
    clubs?: IClub[];
    needViewAllButton?: boolean;
    needPagination?: boolean;
    totalItems?: number;
    createClubButton?: boolean;
}

export const Clubs: React.FC<IClubsProps> = ({
    title,
    clubs: clubsProp,
    needViewAllButton = false,
    needPagination = false,
    totalItems,
    createClubButton = false,
}) => {
    title = title || "Clubs";
    const clubs: IClub[] = clubsProp || clubsList.clubs;
    const router = useRouter();
    const {
        clubsContainerRef,
        displayedClubs,
        effectiveTotalItems,
        resolvedCurrentPage,
        pageSize,
        handlePageChange,
    } = useClubs({
        clubs,
        needPagination,
        totalItems,
    });

    return (
        <section className={css.clubs} ref={clubsContainerRef}>
            <div className="container">
                <div className={css.clubs_title_wrap}>
                    <h2 className={css.clubs_title}>{title}</h2>

                    {createClubButton && (
                        <Button
                            className={css.clubs_create_club_button}
                            buttonType="secondary"
                            icon="plus"
                        >
                            Create Club
                        </Button>
                    )}
                </div>
                <div className={css.clubs_head}>
                    <SearchInput
                        placeholder="Find player by name or club"
                        ariaLabel="Find club by name"
                        className={css.clubs_head_search}
                    />
                    <div className={css.clubs_head_dropdowns}>
                        <CustomRoundedDropdown
                            id="club-dropdown"
                            options={exampleKingdomOptions}
                            placeholder="Kingdom"
                            aria-label="Select Kingdom"
                            className={css.clubs_head_dropdown}
                        />
                        <CustomRoundedDropdown
                            id="sort-dropdown"
                            options={sortOrderOptions}
                            placeholder="Sort by Rank"
                            aria-label="Select Sort by"
                            className={css.clubs_head_dropdown}
                        />
                    </div>
                </div>
                <div className={css.clubs_content}>
                    {displayedClubs.map((club) => (
                        <ClubCard key={club.id} {...club} />
                    ))}
                </div>
                {needPagination && (
                    <Pagination
                        totalItems={effectiveTotalItems}
                        pageSize={pageSize}
                        currentPage={resolvedCurrentPage}
                        onPageChange={handlePageChange}
                    />
                )}
                {needViewAllButton && (
                    <CustomButton
                        className={css.clubs_button}
                        onClick={() => router.push(clientRoutes.clubs)}
                    >
                        View all Clubs
                    </CustomButton>
                )}
            </div>
        </section>
    );
};
