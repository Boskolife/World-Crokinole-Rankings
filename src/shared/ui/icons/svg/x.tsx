import React from "react"
import { ISVGProps } from "../props"

export const X: React.FC<ISVGProps> = ({ className, ...props }) => (
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
      d="M14.1667 5.83337L5.83337 14.1667M5.83337 5.83337L14.1667 14.1667"
      stroke="currentColor"
      strokeWidth="1.2"
      strokeLinecap="round"
      strokeLinejoin="round"
    />
  </svg>
)
