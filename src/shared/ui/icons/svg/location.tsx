import React from "react";
import { ISVGProps } from "../props";

export const Location: React.FC<ISVGProps> = ({ className, ...props }) => (
    <svg
        className={className}
        width="15"
        height="24"
        viewBox="0 0 15 24"
        fill="none"
        xmlns="http://www.w3.org/2000/svg"
        {...props}
    >
        <path
            d="M7.66678 11.5234C6.09129 11.5234 4.80964 10.2418 4.80964 8.66629C4.80964 7.0908 6.09129 5.80915 7.66678 5.80915C9.24227 5.80915 10.5239 7.0908 10.5239 8.66629C10.5239 10.2418 9.24227 11.5234 7.66678 11.5234Z"
            stroke="currentColor"
            strokeMiterlimit="10"
            strokeLinecap="round"
            strokeLinejoin="round"
        />
        <path
            d="M7.66667 22C7.66667 22 14.3333 13.4286 14.3333 8.66667C14.3333 4.98476 11.3486 2 7.66667 2C3.98476 2 1 4.98476 1 8.66667C1 13.4286 7.66667 22 7.66667 22Z"
            stroke="currentColor"
            strokeMiterlimit="10"
            strokeLinecap="round"
            strokeLinejoin="round"
        />
    </svg>
);
