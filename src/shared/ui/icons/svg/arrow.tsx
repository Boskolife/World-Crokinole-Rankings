import React from "react"
import { ISVGProps } from "../props"

export const Arrow: React.FC<ISVGProps> = ({ className, ...props }) => (
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
      d="M4.08594 6.5L8.08594 10.5L12.0859 6.5"
      stroke="currentcolor"
      strokeWidth="1.5"
      strokeLinecap="round"
      strokeLinejoin="round"
    />
  </svg>
)
