import React from "react";
import { ISVGProps } from "../props";

export const ArrowRight: React.FC<ISVGProps> = ({
    className,
    ...props
}) => (
    <svg
        className={className}
        width="18"
        height="12"
        viewBox="0 0 18 12"
        fill="none"
        xmlns="http://www.w3.org/2000/svg"
        {...props}
    >
        <path
            d="M0 5.81885H17M17 5.81885L9.86713 0.818848M17 5.81885L9.86713 10.8188"
            stroke="currentColor"
            strokeWidth="2"
            strokeLinejoin="bevel"
        />
    </svg>
);
