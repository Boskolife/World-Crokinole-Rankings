;<svg
  width="6"
  height="10"
  viewBox="0 0 6 10"
  fill="none"
  xmlns="http://www.w3.org/2000/svg"
>
  <path
    d="M1 9L5 5L1 1"
    stroke="#1F7298"
    stroke-linecap="round"
    stroke-linejoin="round"
  />
</svg>
import React from "react"
import { ISVGProps } from "../props"

export const ArrowBC: React.FC<ISVGProps> = ({ className, ...props }) => (
  <svg
    className={className}
    width="6"
    height="10"
    viewBox="0 0 6 10"
    fill="none"
    xmlns="http://www.w3.org/2000/svg"
    {...props}
  >
    <path
      d="M1 9L5 5L1 1"
      stroke="currentcolor"
      strokeLinecap="round"
      strokeLinejoin="round"
    />
  </svg>
)
