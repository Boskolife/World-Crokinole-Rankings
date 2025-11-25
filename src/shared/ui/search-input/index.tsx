"use client";
import React from "react";
import css from "./styles.module.scss";
import { Icon } from "@/shared/ui/icons";
import cn from "classnames";

interface SearchInputProps {
    placeholder?: string;
    ariaLabel?: string;
    searchButtonAriaLabel?: string;
    className?: string;
    value?: string;
    onChange?: (e: React.ChangeEvent<HTMLInputElement>) => void;
    onSearch?: () => void;
    id?: string;
    name?: string;
}

export const SearchInput: React.FC<SearchInputProps> = ({
    placeholder = "Find player by name or club",
    ariaLabel,
    searchButtonAriaLabel = "Search player",
    className,
    value,
    onChange,
    onSearch,
    id,
    name,
}) => {
    const handleSearch = () => {
        onSearch?.();
    };

    const handleKeyDown = (e: React.KeyboardEvent<HTMLInputElement>) => {
        if (e.key === "Enter") {
            e.preventDefault();
            handleSearch();
        }
    };

    return (
        <div className={cn(css.search_input, className)}>
            <input
                id={id}
                name={name}
                type="search"
                placeholder={placeholder}
                aria-label={ariaLabel || placeholder}
                value={value}
                onChange={onChange}
                onKeyDown={handleKeyDown}
            />
            <button
                type="button"
                className={css.search_input_button}
                onClick={handleSearch}
                aria-label={searchButtonAriaLabel}
            >
                <Icon
                    name="search"
                    className={css.search_input_button_icon}
                />
            </button>
        </div>
    );
};

