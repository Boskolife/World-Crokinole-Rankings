import React from "react"
import { ISVGProps } from "../props"

export const Map: React.FC<ISVGProps> = ({ className, ...props }) => (
  <svg
    className={className}
    width="20"
    height="20"
    viewBox="0 0 20 20"
    fill="none"
    xmlns="http://www.w3.org/2000/svg"
    {...props}
  >
    <g clipPath="url(#clip0_590_36812)">
      <mask
        id="mask0_590_36812"
        style={{ maskType: "luminance" }}
        maskUnits="userSpaceOnUse"
        x="0"
        y="0"
        width="20"
        height="20"
      >
        <path d="M0 1.90735e-06H20V20H0V1.90735e-06Z" fill="white" />
      </mask>
      <g mask="url(#mask0_590_36812)">
        <path
          d="M10 6.44531C9.0307 6.44531 8.24219 5.6568 8.24219 4.6875C8.24219 3.7182 9.0307 2.92969 10 2.92969C10.9693 2.92969 11.7578 3.7182 11.7578 4.6875C11.7578 5.6568 10.9693 6.44531 10 6.44531Z"
          stroke="currentColor"
          strokeWidth="1.2"
          strokeMiterlimit="10"
          strokeLinecap="round"
          strokeLinejoin="round"
        />
        <path
          d="M10 12.8906C10 12.8906 14.1016 7.61719 14.1016 4.6875C14.1016 2.42227 12.2652 0.585938 10 0.585938C7.73477 0.585938 5.89844 2.42227 5.89844 4.6875C5.89844 7.61719 10 12.8906 10 12.8906Z"
          stroke="currentColor"
          strokeWidth="1.2"
          strokeMiterlimit="10"
          strokeLinecap="round"
          strokeLinejoin="round"
        />
        <path
          d="M4.14062 8.78911L7.72016 9.505"
          stroke="currentColor"
          strokeWidth="1.2"
          strokeMiterlimit="10"
          strokeLinecap="round"
          strokeLinejoin="round"
        />
        <path
          d="M11.7842 10.3178L15.8593 11.1328"
          stroke="currentColor"
          strokeWidth="1.2"
          strokeMiterlimit="10"
          strokeLinecap="round"
          strokeLinejoin="round"
        />
        <path
          d="M15.8594 19.4141L4.14062 17.0703"
          stroke="currentColor"
          strokeWidth="1.2"
          strokeMiterlimit="10"
          strokeLinecap="round"
          strokeLinejoin="round"
        />
        <path
          d="M15.8594 19.4141L19.4141 17.0703V8.78906L15.8594 11.1328V19.4141Z"
          stroke="currentColor"
          strokeWidth="1.2"
          strokeMiterlimit="10"
          strokeLinecap="round"
          strokeLinejoin="round"
        />
        <path
          d="M0.585938 19.4141L4.14062 17.0703V8.78906L0.585938 11.1328V19.4141Z"
          stroke="currentColor"
          strokeWidth="1.2"
          strokeMiterlimit="10"
          strokeLinecap="round"
          strokeLinejoin="round"
        />
      </g>
    </g>
    <defs>
      <clipPath id="clip0_590_36812">
        <rect width="20" height="20" fill="white" />
      </clipPath>
    </defs>
  </svg>
)
