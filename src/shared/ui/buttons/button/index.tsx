import React from "react";
import { IButtonProps } from "./props";
import css from "./styles.module.scss";
import cn from "classnames";
import { Icon } from "../../icons";
import { icons } from "../../icons/icons";

export const Button: React.FC<IButtonProps> = ({
    children,
    className,
    type,
    buttonType,
    icon,
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
            {icon && <Icon name={icon as keyof typeof icons} />}
            <span>{children}</span>
        </button>
    );
};
