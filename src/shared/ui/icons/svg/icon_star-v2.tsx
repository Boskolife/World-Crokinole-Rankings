import React from "react"
import { ISVGProps } from "../props"

export const IconStarV2: React.FC<ISVGProps> = ({ className, ...props }) => (
  <svg
    className={className}
    width="20"
    height="19"
    viewBox="0 0 20 19"
    fill="none"
    xmlns="http://www.w3.org/2000/svg"
    {...props}
  >
    <path
      d="M11.8789 6.92773L11.9932 7.25684L12.3408 7.26367L18.0615 7.37988L13.502 10.8379L13.2246 11.0479L13.3252 11.3809L14.9824 16.8584L10.2852 13.5898L10 13.3906L9.71484 13.5898L5.0166 16.8584L6.6748 11.3809L6.77539 11.0479L6.49805 10.8379L1.9375 7.37988L7.65918 7.26367L8.00684 7.25684L8.12109 6.92773L10 1.52344L11.8789 6.92773Z"
      fill="currentcolor"
      stroke="#1F7298"
    />
  </svg>
)
