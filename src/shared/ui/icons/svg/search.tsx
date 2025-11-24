import React from "react";
import { ISVGProps } from "../props";

export const Search: React.FC<ISVGProps> = ({ className, ...props }) => (
    <svg
        className={className}
        width="24"
        height="24"
        viewBox="0 0 24 24"
        fill="none"
        xmlns="http://www.w3.org/2000/svg"
        {...props}
    >
        <g clipPath="url(#clip0_1051_17414)">
            <mask
                id="mask0_1051_17414"
                style={{ maskType: "luminance" }}
                maskUnits="userSpaceOnUse"
                x="0"
                y="0"
                width="24"
                height="24"
            >
                <path
                    d="M23.5 23.5V0.5H0.5V23.5H23.5Z"
                    fill="white"
                    stroke="white"
                />
            </mask>
            <g mask="url(#mask0_1051_17414)">
                <path
                    d="M9.68572 14.3143L7.53585 16.4642M1.48668 21.4775L2.52252 22.5133C3.25475 23.2456 4.44196 23.2456 5.17419 22.5133L8.05377 19.6337C8.786 18.9015 8.786 17.7143 8.05377 16.9821L7.01793 15.9462C6.28569 15.214 5.09854 15.214 4.3663 15.9462L1.48668 18.8258C0.754441 19.558 0.754441 20.7452 1.48668 21.4775ZM15.2265 0.93751C19.5542 0.93751 23.0625 4.44578 23.0625 8.77346C23.0625 13.1011 19.5542 16.6094 15.2265 16.6094C10.8989 16.6094 7.39063 13.1011 7.39063 8.77346C7.39063 4.44578 10.8989 0.93751 15.2265 0.93751Z"
                    stroke="currentColor"
                    strokeMiterlimit="10"
                    strokeLinecap="round"
                    strokeLinejoin="round"
                />
            </g>
        </g>
        <defs>
            <clipPath id="clip0_1051_17414">
                <rect width="24" height="24" fill="white" />
            </clipPath>
        </defs>
    </svg>
);
