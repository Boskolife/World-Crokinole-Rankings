import React from "react"
import { ISVGProps } from "../props"

export const IconCross: React.FC<ISVGProps> = ({ className, ...props }) => (
  <svg
    className={className}
    width="24"
    height="24"
    viewBox="0 0 24 24"
    fill="none"
    xmlns="http://www.w3.org/2000/svg"
    {...props}
  >
    <path
      d="M7.05131 7.05025L16.9508 16.9497M7.05131 16.9497L16.9508 7.05025"
      stroke="currentcolor"
      strokeWidth="2"
      strokeLinecap="round"
      strokeLinejoin="round"
    />
  </svg>
)
