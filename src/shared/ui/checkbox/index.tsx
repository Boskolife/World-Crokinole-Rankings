"use client";
import React, { useState, useEffect } from "react";
import css from "./styles.module.scss";
import { ICheckboxProps } from "@/shared/types/form.interface";
import { FieldValues, Path } from "react-hook-form";
import cn from "classnames";

interface ICustomCheckboxProps<TFieldValues extends FieldValues = FieldValues>
    extends ICheckboxProps<TFieldValues> {
    classNameLabel?: string;
    className?: string;
}

export const CustomCheckbox = <TFieldValues extends FieldValues = FieldValues>({
    label,
    name,
    isNeedToClean,
    checked = false,
    onChange,
    register,
    rules,
    error,
    className,
    classNameLabel,
}: ICustomCheckboxProps<TFieldValues>) => {
    const inputId = React.useId();
    const [isChecked, setIsChecked] = useState(checked);

    useEffect(() => {
        setIsChecked(checked);
    }, [checked]);

    useEffect(() => {
        if (isNeedToClean) {
            setTimeout(() => {
                setIsChecked(false);
            }, 0);
        }
    }, [isNeedToClean]);

    const registration = register
        ? register(name as Path<TFieldValues>, rules)
        : undefined;

    const assignRef = (node: HTMLInputElement | null) => {
        if (registration && typeof registration.ref === "function") {
            registration.ref(node);
        }
    };

    const handleChange = (e: React.ChangeEvent<HTMLInputElement>) => {
        setIsChecked(e.target.checked);
        registration?.onChange?.(e);
        onChange?.(e);
    };

    const handleBlur = (e: React.FocusEvent<HTMLInputElement>) => {
        registration?.onBlur?.(e);
    };

    return (
        <div className={cn(css.checkbox_wrapper, className)}>
            <label
                className={cn(css.checkbox, className, {
                    [css.checkbox_checked]: isChecked,
                    [css.checkbox_invalid]: !!error,
                })}
                htmlFor={inputId}
            >
                <input
                    id={inputId}
                    className={css.checkbox_input}
                    type="checkbox"
                    name={registration?.name ?? name}
                    checked={isChecked}
                    ref={assignRef}
                    onChange={handleChange}
                    onBlur={handleBlur}
                    aria-invalid={!!error}
                    required={Boolean(rules?.required)}
                />
                <span
                    className={cn(css.checkbox_box, {
                        [css.checkbox_box_checked]: isChecked,
                    })}
                    aria-hidden="true"
                />
                <span className={cn(css.checkbox_label, classNameLabel)}>
                    {label}
                </span>
            </label>
            {error && <span className={css.checkbox_error}>{error}</span>}
        </div>
    );
};
