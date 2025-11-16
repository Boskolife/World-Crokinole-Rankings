import React, { useState, useEffect } from "react";
import css from "./styles.module.scss";
import { ICheckboxProps } from "@/shared/types/form.interface";
import cn from "classnames";

export const CustomCheckbox: React.FC<ICheckboxProps> = ({
    label,
    isNeedToClean,
    checked = false,
    onChange,
}) => {
    const inputId = React.useId();

    const [isChecked, setIsChecked] = useState(checked);

    useEffect(() => {
        if (isNeedToClean) {
            setTimeout(() => {
                setIsChecked(false);
            }, 0);
        }
    }, [isNeedToClean]);

    return (
        <label
            className={cn(css.checkbox, { [css.checkbox_checked]: isChecked })}
            htmlFor={inputId}
        >
            <input
                id={inputId}
                className={css.checkbox_input}
                type="checkbox"
                checked={isChecked}
                onChange={(e) => {
                    setIsChecked(e.target.checked);
                    onChange?.(e);
                }}
            />
            <span
                className={cn(css.checkbox_box, {
                    [css.checkbox_box_checked]: isChecked,
                })}
                aria-hidden="true"
            />
            <span className={css.checkbox_label}>{label}</span>
        </label>
    );
};
