"use client";

import React, { useMemo, useState } from "react";
import { Pagination } from "@/shared/modules/pagination";
import type { INewsItem } from "@/shared/types";
import { News } from "./index";
import css from "./styles.module.scss";

interface NewsClientProps {
    items: INewsItem[];
    pageSize?: number;
}

export const NewsClient: React.FC<NewsClientProps> = ({ items, pageSize = 3 }) => {
    const [currentPage, setCurrentPage] = useState(1);

    const paginatedItems = useMemo(() => {
        const start = (currentPage - 1) * pageSize;
        return items.slice(start, start + pageSize);
    }, [items, currentPage, pageSize]);

    return (
        <div>
            <News items={paginatedItems} expectedItemsCount={pageSize} />
            <div className={css.news_pagination}>
                <Pagination
                    totalItems={items.length}
                    pageSize={pageSize}
                    currentPage={currentPage}
                    onPageChange={setCurrentPage}
                />
            </div>
        </div>
    );
};
