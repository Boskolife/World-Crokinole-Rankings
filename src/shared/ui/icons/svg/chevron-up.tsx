import React from "react"
import { ISVGProps } from "../props"

export const ChevronUp: React.FC<ISVGProps> = ({ className, ...props }) => (
  <svg
    className={className}
    width="20"
    height="20"
    viewBox="0 0 20 20"
    fill="none"
    xmlns="http://www.w3.org/2000/svg"
    {...props}
  >
    <path
      d="M15 12.5L10 7.5L5 12.5"
      stroke="currentColor"
      strokeWidth="1.2"
      strokeLinecap="round"
      strokeLinejoin="round"
    />
  </svg>
)
