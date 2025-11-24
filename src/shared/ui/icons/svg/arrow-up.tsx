import React from "react";
import { ISVGProps } from "../props";

export const ArrowUp: React.FC<ISVGProps> = ({ className, ...props }) => (
    <svg
        className={className}
        width="16"
        height="16"
        viewBox="0 0 16 16"
        fill="none"
        xmlns="http://www.w3.org/2000/svg"
        {...props}
    >
        <path
            d="M8.00004 12.666V3.33268M8.00004 3.33268L12.6667 7.99935M8.00004 3.33268L3.33337 7.99935"
            stroke="currentColor"
            strokeLinecap="round"
            strokeLinejoin="round"
        />
    </svg>
);
