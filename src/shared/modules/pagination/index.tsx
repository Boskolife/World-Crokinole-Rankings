import React from "react";
import css from "./styles.module.scss";
import cn from "classnames";
import { Icon } from "@/shared/ui/icons";

interface IPaginationProps {
    totalItems: number;
    pageSize: number;
    currentPage: number;
    onPageChange: (page: number) => void;
}

export const Pagination: React.FC<IPaginationProps> = ({
    totalItems,
    pageSize,
    currentPage,
    onPageChange,
}) => {
    const totalPages = Math.ceil(totalItems / pageSize);

    if (totalPages <= 1) {
        return null;
    }

    const handlePrev = () => {
        if (currentPage > 1) {
            onPageChange(currentPage - 1);
        }
    };

    const handleNext = () => {
        if (currentPage < totalPages) {
            onPageChange(currentPage + 1);
        }
    };

    const getVisiblePages = () => {
        const visiblePages: (number | string)[] = [];
        const maxVisible = 5;

        if (totalPages <= maxVisible + 2) {
            // Если страниц мало, показываем все
            return Array.from({ length: totalPages }, (_, i) => i + 1);
        }

        if (currentPage <= maxVisible - 1) {
            // Показываем первые страницы + последнюю
            for (let i = 1; i <= maxVisible; i++) {
                visiblePages.push(i);
            }
            visiblePages.push("...");
            visiblePages.push(totalPages);
        } else if (currentPage >= totalPages - maxVisible + 2) {
            // Показываем первую + последние страницы
            visiblePages.push(1);
            visiblePages.push("...");
            for (let i = totalPages - maxVisible + 1; i <= totalPages; i++) {
                visiblePages.push(i);
            }
        } else {
            // Показываем первую + средние + последнюю
            visiblePages.push(1);
            visiblePages.push("...");
            for (let i = currentPage - 1; i <= currentPage + 1; i++) {
                visiblePages.push(i);
            }
            visiblePages.push("...");
            visiblePages.push(totalPages);
        }

        return visiblePages;
    };

    const visiblePages = getVisiblePages();

    return (
        <div className={css.pagination}>
            <button
                type="button"
                className={cn(css.pagination_control, {
                    [css.disabled]: currentPage === 1,
                })}
                onClick={handlePrev}
                disabled={currentPage === 1}
                aria-label="Previous page"
            >
                <Icon
                    name="chevron_prev"
                    className={cn(css.pagination_control_icon, css.pagination_control_icon_prev)}
                />
            </button>
            <div className={css.pagination_pages}>
                {visiblePages.map((page, index) => {
                    if (page === "...") {
                        return (
                            <span key={`ellipsis-${index}`} className={css.pagination_ellipsis}>
                                ...
                            </span>
                        );
                    }
                    return (
                        <button
                            type="button"
                            key={page}
                            className={cn(css.pagination_page, {
                                [css.active]: page === currentPage,
                            })}
                            onClick={() => onPageChange(page as number)}
                            aria-current={page === currentPage ? "page" : undefined}
                        >
                            {page}
                        </button>
                    );
                })}
            </div>
            <button
                type="button"
                className={cn(css.pagination_control, {
                    [css.disabled]: currentPage === totalPages,
                })}
                onClick={handleNext}
                disabled={currentPage === totalPages}
                aria-label="Next page"
            >
                <Icon
                    name="chevron_next"
                    className={cn(css.pagination_control_icon, css.pagination_control_icon_next)}
                />
            </button>
        </div>
    );
};
