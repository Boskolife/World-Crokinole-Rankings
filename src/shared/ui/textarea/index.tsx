"use client";
import React, { useState, useEffect, useRef } from "react";
import css from "./styles.module.scss";
import { IFormFieldProps } from "@/shared/types";
import { Icon } from "@/shared/ui/icons";
import cn from "classnames";
import type { FieldValues, Path } from "react-hook-form";
import type { DetailedHTMLProps, TextareaHTMLAttributes } from "react";

type TextareaFieldProps<TFieldValues extends FieldValues = FieldValues> = Omit<
    IFormFieldProps<TFieldValues>,
    "onChange" | "type"
> & {
    onChange?: (e: React.ChangeEvent<HTMLTextAreaElement>) => void;
} & Omit<
        DetailedHTMLProps<
            TextareaHTMLAttributes<HTMLTextAreaElement>,
            HTMLTextAreaElement
        >,
        "onChange"
    >;

export function TextareaField<TFieldValues extends FieldValues = FieldValues>(
    props: TextareaFieldProps<TFieldValues>
) {
    const {
        id,
        name,
        label,
        placeholder,
        value,
        onChange,
        register,
        rules,
        error,
        labelClassName,
        className,
        maxLength,
        minLength,
        ...restProps
    } = props;

    const textareaRef = useRef<HTMLTextAreaElement>(null);
    const [isFilled, setIsFilled] = useState(() => {
        if (typeof value === "string") {
            return !!value && value.trim().length > 0;
        }
        return !!value;
    });

    useEffect(() => {
        const checkFilled = () => {
            if (textareaRef.current) {
                const fieldValue = textareaRef.current.value;
                setIsFilled(!!fieldValue && fieldValue.trim().length > 0);
            }
        };

        const currentTextarea = textareaRef.current;
        if (currentTextarea) {
            checkFilled();
            currentTextarea.addEventListener("input", checkFilled);
            return () => {
                currentTextarea.removeEventListener("input", checkFilled);
            };
        } else {
            checkFilled();
        }
    }, [value]);

    const handleChange = (e: React.ChangeEvent<HTMLTextAreaElement>) => {
        setIsFilled(!!e.target.value && e.target.value.trim().length > 0);
        onChange?.(e);
    };

    const handleInput = (e: React.ChangeEvent<HTMLTextAreaElement>) => {
        let value = e.target.value;

        if (maxLength && value.length > maxLength) {
            value = value.slice(0, maxLength);
            e.target.value = value;
        }
    };

    const registration = register
        ? register(name as unknown as Path<TFieldValues>, rules)
        : undefined;

    const handleClear = () => {
        if (textareaRef.current) {
            const textareaElement = textareaRef.current;
            textareaElement.value = "";
            setIsFilled(false);

            const syntheticEvent = {
                target: textareaElement,
                currentTarget: textareaElement,
                bubbles: true,
                cancelable: false,
            } as React.ChangeEvent<HTMLTextAreaElement>;

            if (registration) {
                registration.onChange?.(
                    syntheticEvent as unknown as React.ChangeEvent<HTMLInputElement>
                );
            }

            onChange?.(syntheticEvent);
            textareaElement.focus();
        }
    };

    const assignRef = React.useCallback(
        (node: HTMLTextAreaElement | null) => {
            textareaRef.current = node;
            if (registration?.ref) {
                if (typeof registration.ref === "function") {
                    registration.ref(node as unknown as HTMLInputElement);
                }
            }
        },
        [registration]
    );

    return (
        <div className={cn(css.form_field, className)}>
            {label && (
                <label
                    className={cn(css.form_field_label, labelClassName)}
                    htmlFor={id}
                >
                    {label}
                </label>
            )}
            <div className={css.form_field_input_wrapper}>
                <textarea
                    id={id}
                    className={cn(css.form_field_input, {
                        [css.error]: error,
                        [css.filled]: isFilled,
                        [css.form_field_input_with_icon]: isFilled,
                    })}
                    placeholder={placeholder}
                    aria-invalid={!!error}
                    maxLength={maxLength}
                    minLength={minLength}
                    onInput={handleInput}
                    {...restProps}
                    {...(registration
                        ? {
                              ...registration,
                              ref: assignRef,
                              onChange: (
                                  e: React.ChangeEvent<HTMLTextAreaElement>
                              ) => {
                                  registration.onChange?.(
                                      e as unknown as React.ChangeEvent<HTMLInputElement>
                                  );
                                  handleChange(e);
                              },
                          }
                        : {
                              name,
                              value,
                              onChange: handleChange,
                              ref: assignRef,
                          })}
                />
                {isFilled && (
                    <button
                        type="button"
                        className={css.form_field_clear}
                        onClick={handleClear}
                        aria-label="Clear field"
                    >
                        <Icon name="x" className={css.form_field_clear_icon} />
                    </button>
                )}
            </div>
            {error && <span className={css.form_field_error}>{error}</span>}
        </div>
    );
}
