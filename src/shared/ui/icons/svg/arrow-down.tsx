import React from "react";
import { ISVGProps } from "../props";

export const ArrowDown: React.FC<ISVGProps> = ({ className, ...props }) => (
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
            d="M8.00004 3.33398V12.6673M8.00004 12.6673L12.6667 8.00065M8.00004 12.6673L3.33337 8.00065"
            stroke="currentColor"
            strokeLinecap="round"
            strokeLinejoin="round"
        />
    </svg>
);
