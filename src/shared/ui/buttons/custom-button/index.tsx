"use client";
import React from "react";
import { ICustomButtonProps } from "./props";
import css from "./styles.module.scss";
import cn from "classnames";
import { Icon } from "../../icons";
import { RootLink } from "../../links/root-link";

export const CustomButton: React.FC<ICustomButtonProps> = ({
    children,
    className,
    type,
    inverted,
    href,
    ...props
}) => {
    const buttonContent = (
        <>
            <span>{children}</span>
            <div className={css.button_icon_wrapper}>
                <Icon name="arrow_right" className={css.button_icon} />
            </div>
        </>
    );

    if (href) {
        return (
            <RootLink
                href={href}
                className={cn(css.button, className, {
                    [css.inverted]: inverted,
                })}
            >
                {buttonContent}
            </RootLink>
        );
    }

    return (
        <button
            className={cn(css.button, className, {
                [css.inverted]: inverted,
            })}
            type={type ?? "button"}
            {...props}
        >
            {buttonContent}
        </button>
    );
};
