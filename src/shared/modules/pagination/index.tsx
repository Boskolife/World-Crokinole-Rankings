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

    const pages = Array.from({ length: totalPages }, (_, index) => index + 1);

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
                {pages.map((page) => (
                    <button
                        type="button"
                        key={page}
                        className={cn(css.pagination_page, {
                            [css.active]: page === currentPage,
                        })}
                        onClick={() => onPageChange(page)}
                        aria-current={page === currentPage ? "page" : undefined}
                    >
                        {page}
                    </button>
                ))}
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
