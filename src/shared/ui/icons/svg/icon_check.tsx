import React from "react"
import { ISVGProps } from "../props"

export const IconCheck: React.FC<ISVGProps> = ({ className, ...props }) => (
  <svg
    className={className}
    width="20"
    height="12"
    viewBox="0 0 20 12"
    fill="none"
    xmlns="http://www.w3.org/2000/svg"
    {...props}
  >
    <path
      d="M18.1135 1L8.42013 10.6934C8.22376 10.8897 7.95747 11 7.6798 11C7.40214 11 7.13584 10.8897 6.93947 10.6934L1.88281 5.63675"
      stroke="currentcolor"
      strokeWidth="2"
      strokeLinecap="round"
      strokeLinejoin="round"
    />
  </svg>
)
