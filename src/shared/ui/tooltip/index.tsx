"use client";
import React, { useState } from "react";
import css from "./styles.module.scss";
import cn from "classnames";

interface ITooltipProps {
    content: string;
    children: React.ReactNode;
    className?: string;
}

export const Tooltip: React.FC<ITooltipProps> = ({
    content,
    className,
    children,
}) => {
    const [isVisible, setIsVisible] = useState(false);

    const showTooltip = () => setIsVisible(true);
    const hideTooltip = () => setIsVisible(false);

    return (
        <div
            className={cn(css.tooltip, className)}
            onMouseEnter={showTooltip}
            onMouseLeave={hideTooltip}
            onFocus={showTooltip}
            onBlur={hideTooltip}
            tabIndex={0}
        >
            {children}
            <div
                className={cn(css.tooltip_content, {
                    [css.tooltip_content_visible]: isVisible,
                })}
                role="tooltip"
            >
                {content}
            </div>
        </div>
    );
};
