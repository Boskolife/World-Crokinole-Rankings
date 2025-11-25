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
            // Если кликнули на ту же колонку, меняем направление
            setSortDirection((prev) => (prev === "asc" ? "desc" : "asc"));
        } else {
            // Если кликнули на другую колонку, устанавливаем её и направление по умолчанию
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
                // Fallback: пытаемся получить значение через ключ объекта
                aValue = (a as Record<string, unknown>)[sortColumn] as string | number;
                bValue = (b as Record<string, unknown>)[sortColumn] as string | number;
            }

            // Нормализуем строковые значения
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

