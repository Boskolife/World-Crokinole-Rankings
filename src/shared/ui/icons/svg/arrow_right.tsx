import React from "react"
import { ISVGProps } from "../props"

export const ArrowRight: React.FC<ISVGProps> = ({ className, ...props }) => (
  <svg
    className={className}
    width="16"
    height="14"
    viewBox="0 0 16 14"
    fill="none"
    xmlns="http://www.w3.org/2000/svg"
    {...props}
  >
    <path
      d="M15 7L9 13M15 7L9 1M15 7L1 7"
      stroke="currentcolor"
      strokeWidth="2"
      strokeLinecap="round"
      strokeLinejoin="round"
    />
  </svg>
)
