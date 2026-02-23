"use client";
import React, { useState, useEffect } from "react";
import css from "./styles.module.scss";
import {
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
    getClubsWhereUserIsAdmin,
} from "@/shared/supabase/data";
import { sortOrderOptions } from "@/shared/constants";
import { useAuth } from "@/shared/hooks/use-auth";

export interface IClubsProps {
    title?: string;
    initialClubs?: IClub[];
    needViewAllButton?: boolean;
    needPagination?: boolean;
}

export const Clubs: React.FC<IClubsProps> = ({
    title,
    initialClubs = [],
    needViewAllButton = false,
    needPagination = true,
}) => {
    title = title || "Clubs";
    const router = useRouter();
    const { user } = useAuth();
    const [clubs, setClubs] = useState<IClub[]>(initialClubs);
    const [yourClubs, setYourClubs] = useState<IClub[]>([]);
    const [totalClubs, setTotalClubs] = useState(0);
    const [isLoading, setIsLoading] = useState(false);
    const [currentPage, setCurrentPage] = useState(1);
    const [search, setSearch] = useState("");
    const [searchValue, setSearchValue] = useState("");
    const [selectedLocation, setSelectedLocation] = useState("");
    const [sortBy, setSortBy] = useState("");
    const [locationOptions, setLocationOptions] = useState<
        Array<{ value: string; label: string }>
    >([]);

    const pageSize = 6;

    useEffect(() => {
        if (!user?.id) {
            setYourClubs([]);
            return;
        }
        getClubsWhereUserIsAdmin(user.id).then(setYourClubs);
    }, [user?.id]);

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
                    sortBy: sortBy || "id",
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
                {yourClubs.length > 0 && (
                    <>
                        <div className={css.clubs_title_wrap}>
                            <h2 className={css.clubs_title}>Your clubs</h2>
                        </div>
                        <div className={css.clubs_content}>
                            {yourClubs.map((club) => (
                                <ClubCard
                                    key={club.id}
                                    {...club}
                                    showJoinButton={false}
                                />
                            ))}
                        </div>
                    </>
                )}
                <div className={css.clubs_title_wrap}>
                    <h2 className={css.clubs_title}>{title}</h2>
                </div>
                {needPagination && (
                    <div className={css.clubs_head}>
                        <SearchInput
                            placeholder="Find your club by name"
                            ariaLabel="Find your club by name"
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
                                options={[
                                    {
                                        value: "",
                                        label: "Sorted by default",
                                    },
                                    ...sortOrderOptions.filter(
                                        (o) => o.value !== "id"
                                    ),
                                ]}
                                placeholder="Sorted by default"
                                aria-label="Select sort order"
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
                                <ClubCard
                                    key={club.id}
                                    {...club}
                                    showJoinButton={!yourClubs.some(
                                        (c) => c.id === club.id
                                    )}
                                />
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
