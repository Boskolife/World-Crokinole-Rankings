"use client";
import React, { useState, useEffect, useRef } from "react";
import css from "./styles.module.scss";
import { IFormFieldProps } from "@/shared/types";
import { Icon } from "@/shared/ui/icons";
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
        maxLength,
        minLength,
        ...restProps
    } = props;
    
    const inputRef = useRef<HTMLInputElement>(null);
    const [isFilled, setIsFilled] = useState(() => {
        if (typeof value === "string") {
            return !!value && value.trim().length > 0;
        }
        return !!value;
    });
    
    useEffect(() => {
        const checkFilled = () => {
            if (inputRef.current) {
                const fieldValue = inputRef.current.value;
                setIsFilled(!!fieldValue && fieldValue.trim().length > 0);
            }
        };
        
        const currentInput = inputRef.current;
        if (currentInput) {
            checkFilled();
            currentInput.addEventListener("input", checkFilled);
            return () => {
                currentInput.removeEventListener("input", checkFilled);
            };
        } else {
            checkFilled();
        }
    }, [value]);
    
    const handleChange = (e: React.ChangeEvent<HTMLInputElement>) => {
        setIsFilled(!!e.target.value && e.target.value.trim().length > 0);
        onChange?.(e);
    };

    const handleInput = (e: React.ChangeEvent<HTMLInputElement>) => {
        let value = e.target.value;
        
        if (type === "text" && props.inputMode === "numeric") {
            value = value.replace(/\D/g, "");
        }
        
        if (maxLength && value.length > maxLength) {
            value = value.slice(0, maxLength);
        }
        
        if (value !== e.target.value) {
            e.target.value = value;
        }
    };

    const handleKeyPress = (e: React.KeyboardEvent<HTMLInputElement>) => {
        if (type === "text" && props.inputMode === "numeric") {
            if (!/^\d$/.test(e.key) && e.key !== "Backspace" && e.key !== "Delete" && e.key !== "ArrowLeft" && e.key !== "ArrowRight" && e.key !== "Tab") {
                e.preventDefault();
            }
        }
    };

    const handlePaste = (e: React.ClipboardEvent<HTMLInputElement>) => {
        if (type === "text" && props.inputMode === "numeric") {
            e.preventDefault();
            const paste = e.clipboardData.getData("text");
            const numericOnly = paste.replace(/\D/g, "");
            const maxValue = maxLength ? numericOnly.slice(0, maxLength) : numericOnly;
            
            if (inputRef.current) {
                const start = inputRef.current.selectionStart || 0;
                const end = inputRef.current.selectionEnd || 0;
                const currentValue = inputRef.current.value;
                const newValue = currentValue.slice(0, start) + maxValue + currentValue.slice(end);
                const limitedValue = maxLength ? newValue.slice(0, maxLength) : newValue;
                
                inputRef.current.value = limitedValue;
                const newCursorPos = start + maxValue.length;
                inputRef.current.setSelectionRange(newCursorPos, newCursorPos);
                
                const syntheticEvent = {
                    target: inputRef.current,
                    currentTarget: inputRef.current,
                    bubbles: true,
                    cancelable: false,
                } as React.ChangeEvent<HTMLInputElement>;
                
                if (registration) {
                    registration.onChange?.(syntheticEvent);
                }
                handleChange(syntheticEvent);
            }
        }
    };
    
    const registration = register
        ? register(name as unknown as Path<TFieldValues>, rules)
        : undefined;
    
    const handleClear = () => {
        if (inputRef.current) {
            const inputElement = inputRef.current;
            inputElement.value = "";
            setIsFilled(false);
            
            const syntheticEvent = {
                target: inputElement,
                currentTarget: inputElement,
                bubbles: true,
                cancelable: false,
            } as React.ChangeEvent<HTMLInputElement>;
            
            if (registration) {
                registration.onChange?.(syntheticEvent);
            }
            
            onChange?.(syntheticEvent);
            inputElement.focus();
        }
    };
    
    const assignRef = React.useCallback((node: HTMLInputElement | null) => {
        inputRef.current = node;
        if (registration?.ref) {
            if (typeof registration.ref === "function") {
                registration.ref(node);
            }
        }
    }, [registration]);
    
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
            <div className={css.form_field_input_wrapper}>
                <input
                    id={id}
                    className={cn(css.form_field_input, {
                        [css.error]: error,
                        [css.filled]: isFilled,
                        [css.form_field_input_with_icon]: isFilled,
                    })}
                    type={type || "text"}
                    placeholder={placeholder}
                    aria-invalid={!!error}
                    maxLength={maxLength}
                    minLength={minLength}
                    onInput={handleInput}
                    onKeyPress={handleKeyPress}
                    onPaste={handlePaste}
                    {...restProps}
                    {...(registration
                        ? {
                              ...registration,
                              ref: assignRef,
                              onChange: (e: React.ChangeEvent<HTMLInputElement>) => {
                                  registration.onChange?.(e);
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
