import React from "react";
import { ISVGProps } from "../props";

export const ChevronPrev: React.FC<ISVGProps> = ({ className, ...props }) => (
    <svg
        width="8"
        height="13"
        viewBox="0 0 8 13"
        fill="none"
        xmlns="http://www.w3.org/2000/svg"
        {...props}
        className={className}
    >
        <path
            d="M6.41821 0.599609L0.600032 6.41779L6.41821 12.236"
            stroke="currentColor"
            strokeWidth="1.2"
            strokeLinecap="round"
            strokeLinejoin="round"
        />
    </svg>
);
