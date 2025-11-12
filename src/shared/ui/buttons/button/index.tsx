import React from "react";
import { IButtonProps } from "./props";
import css from "./styles.module.scss";
import cn from "classnames";

export const Button: React.FC<IButtonProps> = ({
    children,
    className,
    type,
    buttonType,
    ...props
}) => {
    return (
        <button
            className={cn(css.button, className, {
                [css.button_primary]: buttonType === "primary",
                [css.button_secondary]: buttonType === "secondary",
            })}
            type={type ?? "button"}
            {...props}
        >
            <span>{children}</span>
        </button>
    );
};
