"use client";
import React, { useState } from "react";
import css from "./styles.module.scss";
import cn from "classnames";

type StringLike = string & {};

export interface SwitcherOption<T extends StringLike = StringLike> {
    value: T;
    label: React.ReactNode;
}

interface SwitcherModuleProps<T extends StringLike = StringLike> {
    options: Array<SwitcherOption<T>>;
    value?: T;
    defaultValue?: T;
    onChange?: (value: T) => void;
    className?: string;
    buttonClassName?: string;
}

export function SwitcherModule<T extends StringLike = StringLike>({
    options,
    value,
    defaultValue,
    onChange,
    className,
    buttonClassName,
}: SwitcherModuleProps<T>) {
    const [internalValue, setInternalValue] = useState<T | undefined>(
        defaultValue ?? options?.[0]?.value
    );
    const isControlled = typeof value !== "undefined";
    const activeValue = (isControlled ? value : internalValue) as T;

    const setActive = (next: T) => {
        if (!isControlled) setInternalValue(next);
        onChange?.(next);
    };

    return (
        <div className={cn(css.switcher_module, className)}>
            {options.map((opt) => (
                <button
                    key={String(opt.value)}
                    className={cn(
                        css.switcher_module_button,
                        { [css.active]: opt.value === activeValue },
                        buttonClassName
                    )}
                    type="button"
                    onClick={() => setActive(opt.value)}
                >
                    <span>{opt.label}</span>
                </button>
            ))}
        </div>
    );
}
