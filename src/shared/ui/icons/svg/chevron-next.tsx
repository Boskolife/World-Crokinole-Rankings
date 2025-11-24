import React from "react";
import { ISVGProps } from "../props";

export const ChevronNext: React.FC<ISVGProps> = ({ className, ...props }) => (
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
            d="M0.600098 0.599609L6.41828 6.41779L0.600098 12.236"
            stroke="currentColor"
            strokeWidth="1.2"
            strokeLinecap="round"
            strokeLinejoin="round"
        />
    </svg>
);
