"use client";
import React, { useState, useEffect, useRef } from "react";
import css from "./styles.module.scss";
import { ICustomDropdownProps } from "@/shared/types";
import { Icon } from "@/shared/ui/icons";
import cn from "classnames";
import type { FieldValues, Path } from "react-hook-form";

export function CustomDropdown<TFieldValues extends FieldValues = FieldValues>(
    props: ICustomDropdownProps<TFieldValues>
) {
    const {
        id,
        name,
        label,
        placeholder = "Select an option",
        options,
        value,
        onChange,
        register,
        rules,
        error,
        labelClassName,
        className,
        disabled = false,
    } = props;

    const [isOpen, setIsOpen] = useState(false);
    const [isClosing, setIsClosing] = useState(false);
    const dropdownRef = useRef<HTMLDivElement>(null);
    const timeoutRef = useRef<NodeJS.Timeout | null>(null);

    const registration = register
        ? register(name as unknown as Path<TFieldValues>, rules)
        : undefined;

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

        if (registration) {
            const syntheticEvent = {
                target: {
                    value: optionValue,
                    name: name,
                },
                currentTarget: {
                    value: optionValue,
                    name: name,
                },
            } as React.ChangeEvent<HTMLInputElement>;

            registration.onChange?.(syntheticEvent);

            const blurEvent = {
                target: syntheticEvent.target,
                currentTarget: syntheticEvent.currentTarget,
            } as React.FocusEvent<HTMLInputElement>;
            registration.onBlur?.(blurEvent);
        }

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
        <div className={cn(css.custom_dropdown, className)} ref={dropdownRef}>
            {label && (
                <label
                    className={cn(css.custom_dropdown_label, labelClassName)}
                    htmlFor={id}
                >
                    {label}
                </label>
            )}
            <div className={css.custom_dropdown_wrapper}>
                <button
                    id={id}
                    type="button"
                    className={cn(css.custom_dropdown_button, {
                        [css.error]: error,
                        [css.filled]: isFilled,
                        [css.disabled]: disabled,
                        [css.custom_dropdown_button_with_icon]: isFilled,
                    })}
                    onClick={handleToggle}
                    disabled={disabled}
                    aria-haspopup="listbox"
                    aria-expanded={isOpen}
                    aria-describedby={error ? `${id}-error` : undefined}
                >
                    <span className={css.custom_dropdown_button_text}>
                        {selectedOption ? selectedOption.label : placeholder}
                    </span>
                    <Icon
                        name={"chevron_down"}
                        className={cn(css.custom_dropdown_arrow, {
                            [css.custom_dropdown_arrow_open]: isOpen,
                        })}
                    />
                </button>
                {isOpen && (
                    <ul
                        className={cn(css.custom_dropdown_list, {
                            [css.custom_dropdown_list_closing]: isClosing,
                        })}
                        role="listbox"
                    >
                        {options.map((option) => (
                            <li
                                key={option.value}
                                className={cn(css.custom_dropdown_item, {
                                    [css.custom_dropdown_item_selected]:
                                        selectedValue === option.value,
                                })}
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
            {error && (
                <span id={`${id}-error`} className={css.custom_dropdown_error}>
                    {error}
                </span>
            )}
            {registration && (
                <input type="hidden" {...registration} value={selectedValue} />
            )}
        </div>
    );
}
