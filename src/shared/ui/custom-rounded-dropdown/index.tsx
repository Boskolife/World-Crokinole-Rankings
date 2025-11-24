"use client";
import React, { useState, useEffect, useRef } from "react";
import css from "./styles.module.scss";
import { Icon } from "@/shared/ui/icons";
import cn from "classnames";

interface ICustomRoundedDropdownProps {
    id: string;
    placeholder?: string;
    options: Array<{ value: string; label: string }>;
    value?: string;
    onChange?: (value: string) => void;
    className?: string;
    disabled?: boolean;
}

export function CustomRoundedDropdown(props: ICustomRoundedDropdownProps) {
    const {
        id,
        placeholder = "Select an option",
        options,
        value,
        onChange,
        className,
        disabled = false,
    } = props;

    const [isOpen, setIsOpen] = useState(false);
    const [isClosing, setIsClosing] = useState(false);
    const dropdownRef = useRef<HTMLDivElement>(null);
    const timeoutRef = useRef<NodeJS.Timeout | null>(null);

    const [internalValue, setInternalValue] = useState<string>(
        () => value || ""
    );

    const selectedValue = value !== undefined ? value : internalValue;
    const isFilled = !!selectedValue && selectedValue.trim().length > 0;
    const selectedOption = options.find((opt) => opt.value === selectedValue);

    React.useEffect(() => {
        if (value !== undefined && value !== internalValue) {
            setInternalValue(value);
        }
    }, [value, internalValue]);

    const handleToggle = () => {
        if (disabled) return;

        if (isOpen) {
            handleClose();
        } else {
            if (timeoutRef.current) {
                clearTimeout(timeoutRef.current);
            }
            setIsClosing(false);
            setIsOpen(true);
        }
    };

    const handleClose = () => {
        setIsClosing(true);
        if (timeoutRef.current) {
            clearTimeout(timeoutRef.current);
        }
        timeoutRef.current = setTimeout(() => {
            setIsOpen(false);
            setIsClosing(false);
        }, 300);
    };

    const handleSelect = (optionValue: string) => {
        setInternalValue(optionValue);
        onChange?.(optionValue);
        handleClose();
    };

    useEffect(() => {
        const handleClickOutside = (event: MouseEvent) => {
            if (
                dropdownRef.current &&
                !dropdownRef.current.contains(event.target as Node)
            ) {
                if (isOpen) {
                    handleClose();
                }
            }
        };

        const handleEscape = (event: KeyboardEvent) => {
            if (event.key === "Escape" && isOpen) {
                handleClose();
            }
        };

        if (isOpen) {
            document.addEventListener("mousedown", handleClickOutside);
            document.addEventListener("keydown", handleEscape);
        }

        return () => {
            document.removeEventListener("mousedown", handleClickOutside);
            document.removeEventListener("keydown", handleEscape);
            if (timeoutRef.current) {
                clearTimeout(timeoutRef.current);
            }
        };
    }, [isOpen]);

    return (
        <div
            className={cn(css.custom_rounded_dropdown, className)}
            ref={dropdownRef}
        >
            <div className={css.custom_rounded_dropdown_wrapper}>
                <button
                    id={id}
                    type="button"
                    className={cn(css.custom_rounded_dropdown_button, {
                        [css.filled]: isFilled,
                        [css.disabled]: disabled,
                        [css.with_icon]: isFilled,
                        [css.open]: isOpen,
                    })}
                    onClick={handleToggle}
                    disabled={disabled}
                    aria-haspopup="listbox"
                    aria-expanded={isOpen}
                >
                    <span className={css.custom_rounded_dropdown_button_text}>
                        {selectedOption ? selectedOption.label : placeholder}
                    </span>
                    <Icon
                        name={"chevron_down"}
                        className={cn(css.custom_rounded_dropdown_arrow, {
                            [css.open]: isOpen,
                        })}
                    />
                </button>
                {isOpen && (
                    <ul
                        className={cn(css.custom_rounded_dropdown_list, {
                            [css.closing]: isClosing,
                        })}
                        role="listbox"
                    >
                        {options.map((option) => (
                            <li
                                key={option.value}
                                className={cn(
                                    css.custom_rounded_dropdown_item,
                                    {
                                        [css.selected]:
                                            selectedValue === option.value,
                                    }
                                )}
                                role="option"
                                aria-selected={selectedValue === option.value}
                                onClick={() => handleSelect(option.value)}
                            >
                                {option.label}
                            </li>
                        ))}
                    </ul>
                )}
            </div>
        </div>
    );
}
