"use client";

import { useState, useMemo } from "react";

type SortDirection = "asc" | "desc";

interface UseTableSortOptions<T> {
    data: T[];
    sortFn?: (item: T, column: string) => string | number;
}

interface UseTableSortResult<T> {
    sortColumn: string | null;
    sortDirection: SortDirection;
    sortedData: T[];
    handleSort: (column: string) => void;
}

export const useTableSort = <T,>({
    data,
    sortFn,
}: UseTableSortOptions<T>): UseTableSortResult<T> => {
    const [sortColumn, setSortColumn] = useState<string | null>(null);
    const [sortDirection, setSortDirection] = useState<SortDirection>("asc");

    const handleSort = (column: string) => {
        if (sortColumn === column) {
            // If clicked on the same column, change direction
            setSortDirection((prev) => (prev === "asc" ? "desc" : "asc"));
        } else {
            // If clicked on a different column, set it and default direction
            setSortColumn(column);
            setSortDirection("asc");
        }
    };

    const sortedData = useMemo(() => {
        if (!sortColumn) {
            return data;
        }

        const sorted = [...data].sort((a, b) => {
            let aValue: string | number;
            let bValue: string | number;

            if (sortFn) {
                aValue = sortFn(a, sortColumn);
                bValue = sortFn(b, sortColumn);
            } else {
                // Fallback: try to get value via object key
                aValue = (a as Record<string, unknown>)[sortColumn] as string | number;
                bValue = (b as Record<string, unknown>)[sortColumn] as string | number;
            }

            // Normalize string values
            if (typeof aValue === "string") {
                aValue = aValue.toLowerCase();
            }
            if (typeof bValue === "string") {
                bValue = bValue.toLowerCase();
            }

            if (typeof aValue === "string" && typeof bValue === "string") {
                if (sortDirection === "asc") {
                    return aValue.localeCompare(bValue);
                } else {
                    return bValue.localeCompare(aValue);
                }
            } else {
                if (sortDirection === "asc") {
                    return (aValue as number) - (bValue as number);
                } else {
                    return (bValue as number) - (aValue as number);
                }
            }
        });

        return sorted;
    }, [data, sortColumn, sortDirection, sortFn]);

    return {
        sortColumn,
        sortDirection,
        sortedData,
        handleSort,
    };
};

