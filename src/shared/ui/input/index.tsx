import React from "react";
import css from "./styles.module.scss";
import { IFormFieldProps } from "@/shared/types";
import cn from "classnames";
import type { FieldValues, Path } from "react-hook-form";

export function FormField<TFieldValues extends FieldValues = FieldValues>(
    props: IFormFieldProps<TFieldValues>
) {
    const {
        id,
        name,
        label,
        type,
        placeholder,
        value,
        onChange,
        register,
        rules,
        error,
        labelClassName,
        className,
    } = props;
    return (
        <div
            className={cn(css.form_field, className)}
        >
            {label && (
                <label
                    className={cn(css.form_field_label, labelClassName)}
                    htmlFor={id}
                >
                    {label}
                </label>
            )}
            <input
                id={id}
                className={cn(css.form_field_input, {
                    [css.error]: error,
                })}
                type={type || "text"}
                placeholder={placeholder}
                aria-invalid={!!error}
                {...(register
                    ? register(name as unknown as Path<TFieldValues>, rules)
                    : {
                          name,
                          value,
                          onChange,
                      })}
            />
            {error && <span className={css.form_field_error}>{error}</span>}
        </div>
    );
}
