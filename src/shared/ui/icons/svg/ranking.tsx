import React from "react";
import { ISVGProps } from "../props";

export const Ranking: React.FC<ISVGProps> = ({ className, ...props }) => (
    <svg
        className={className}
        width="36"
        height="36"
        viewBox="0 0 36 36"
        fill="none"
        xmlns="http://www.w3.org/2000/svg"
        {...props}
    >
        <g clipPath="url(#clip0_486_686)">
            <path
                d="M10.6472 20.7549H0V35.0526H10.6472V20.7549Z"
                fill="currentColor"
            />
            <path
                d="M36 17.0811H25.3528V35.0525H36V17.0811Z"
                fill="currentColor"
            />
            <path
                d="M23.3259 11.75H12.6756V35.0528H23.3259V11.75Z"
                fill="currentColor"
            />
            <path
                d="M30.7583 6.24902L32.266 9.30785L35.6431 9.79908L33.2022 12.1797L33.7769 15.5429L30.7583 13.9548L27.7396 15.5429L28.3143 12.1797L25.8734 9.79908L29.2474 9.30777L30.7583 6.24902Z"
                fill="currentColor"
            />
            <path
                d="M18.0579 0.948242L19.5673 4.00864L22.9444 4.49994L20.5035 6.88211L21.0797 10.2422L18.0595 8.6556L15.0393 10.2422L15.614 6.88211L13.1731 4.49994L16.5486 4.00864L18.0579 0.948242Z"
                fill="currentColor"
            />
            <path
                d="M5.13819 9.81543L6.64597 12.8758L10.0231 13.3686L7.58375 15.7477L8.15841 19.1094L5.13819 17.5228L2.11797 19.1109L2.69421 15.7493L0.253387 13.3701L3.62891 12.8773L5.13819 9.81543Z"
                fill="currentColor"
            />
        </g>
        <defs>
            <clipPath id="clip0_486_686">
                <rect width="36" height="36" fill="white" />
            </clipPath>
        </defs>
    </svg>
);
