import React from "react"
import { ISVGProps } from "../props"

export const Check: React.FC<ISVGProps> = ({ className, ...props }) => (
  <svg
    className={className}
    width="20"
    height="20"
    viewBox="0 0 20 20"
    fill="none"
    xmlns="http://www.w3.org/2000/svg"
    {...props}
  >
    <rect width="20" height="20" rx="4" fill="currentColor" />
    <path
      d="M7.44912 12.6786L4.13019 9.25802L3 10.4146L7.44912 15L17 5.1566L15.8778 4L7.44912 12.6786Z"
      fill="white"
    />
  </svg>
)
