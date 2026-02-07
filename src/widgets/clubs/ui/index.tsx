"use client";
import React, { useState, useEffect, useCallback } from "react";
import css from "./styles.module.scss";
import {
    Button,
    CustomButton,
    CustomRoundedDropdown,
    SearchInput,
} from "@/shared/ui";
import { IClub } from "@/shared/types";
import { ClubCard } from "../components/club-card/ClubCard";
import { clientRoutes } from "@/shared/routes/client";
import { useRouter } from "next/navigation";
import { Pagination } from "@/shared/modules";
import {
    getClubsWithFilters,
    getUniqueLocations,
} from "@/shared/supabase/data";
import { sortOrderOptions } from "@/shared/constants";

export interface IClubsProps {
    title?: string;
    initialClubs?: IClub[];
    needViewAllButton?: boolean;
    needPagination?: boolean;
    createClubButton?: boolean;
}

export const Clubs: React.FC<IClubsProps> = ({
    title,
    initialClubs = [],
    needViewAllButton = false,
    needPagination = true,
    createClubButton = false,
}) => {
    title = title || "Clubs";
    const router = useRouter();
    const [clubs, setClubs] = useState<IClub[]>(initialClubs);
    const [totalClubs, setTotalClubs] = useState(0);
    const [isLoading, setIsLoading] = useState(false);
    const [currentPage, setCurrentPage] = useState(1);
    const [search, setSearch] = useState("");
    const [searchValue, setSearchValue] = useState("");
    const [selectedLocation, setSelectedLocation] = useState("");
    const [sortBy, setSortBy] = useState("id");
    const [locationOptions, setLocationOptions] = useState<
        Array<{ value: string; label: string }>
    >([]);

    const pageSize = 6;

    useEffect(() => {
        if (!needPagination) {
            if (initialClubs && initialClubs.length > 0) {
                setClubs(initialClubs);
            }
            return;
        }

        const loadFilterOptions = async () => {
            try {
                const locations = await getUniqueLocations();
                setLocationOptions(locations);
            } catch (error) {
                console.error("Error loading filter options:", error);
            }
        };

        loadFilterOptions();
    }, [needPagination]);

    useEffect(() => {
        if (!needPagination) return;

        const loadClubs = async () => {
            setIsLoading(true);
            try {
                const result = await getClubsWithFilters({
                    search,
                    location: selectedLocation || undefined,
                    page: currentPage,
                    pageSize,
                    sortBy,
                });
                setClubs(result.clubs);
                setTotalClubs(result.total);
            } catch (error) {
                console.error("Error loading clubs:", error);
                setClubs([]);
                setTotalClubs(0);
            } finally {
                setIsLoading(false);
            }
        };

        loadClubs();
    }, [search, selectedLocation, currentPage, sortBy, needPagination, pageSize]);

    const handleSearch = () => {
        setSearch(searchValue);
        setCurrentPage(1);
    };

    const handleSearchChange = (e: React.ChangeEvent<HTMLInputElement>) => {
        setSearchValue(e.target.value);
    };

    const handleLocationChange = (value: string) => {
        setSelectedLocation(value);
        setCurrentPage(1);
    };

    const handleSortChange = (value: string) => {
        setSortBy(value);
        setCurrentPage(1);
    };

    const handlePageChange = (page: number) => {
        setCurrentPage(page);
        window.scrollTo({ top: 0, behavior: "smooth" });
    };

    return (
        <section className={css.clubs}>
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
                {needPagination && (
                    <div className={css.clubs_head}>
                        <SearchInput
                            placeholder="Find club by name or location"
                            ariaLabel="Find club by name or location"
                            className={css.clubs_head_search}
                            value={searchValue}
                            onChange={handleSearchChange}
                            onSearch={handleSearch}
                        />
                        <div className={css.clubs_head_dropdowns}>
                            <CustomRoundedDropdown
                                id="location-dropdown"
                                options={[
                                    { value: "", label: "All Locations" },
                                    ...locationOptions,
                                ]}
                                placeholder="Location"
                                aria-label="Select Location"
                                className={css.clubs_head_dropdown}
                                value={selectedLocation}
                                onChange={handleLocationChange}
                            />
                            <CustomRoundedDropdown
                                id="sort-dropdown"
                                options={sortOrderOptions}
                                placeholder="Sort by"
                                aria-label="Select Sort by"
                                className={css.clubs_head_dropdown}
                                value={sortBy}
                                onChange={handleSortChange}
                            />
                        </div>
                    </div>
                )}
                {isLoading ? (
                    <div className={css.clubs_loading}>Loading...</div>
                ) : (
                    <>
                        <div className={css.clubs_content}>
                            {clubs.map((club) => (
                                <ClubCard key={club.id} {...club} />
                            ))}
                        </div>
                        {needPagination && totalClubs > 0 && (
                            <Pagination
                                totalItems={totalClubs}
                                pageSize={pageSize}
                                currentPage={currentPage}
                                onPageChange={handlePageChange}
                            />
                        )}
                    </>
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
