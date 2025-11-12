import React from "react"
import { ISVGProps } from "../props"

export const BoxGroup: React.FC<ISVGProps> = ({ className, ...props }) => (
  <svg
    className={className}
    width="20"
    height="21"
    viewBox="0 0 20 21"
    fill="none"
    xmlns="http://www.w3.org/2000/svg"
    {...props}
  >
    <rect
      x="1"
      y="1.5"
      width="6.88793"
      height="6.88889"
      rx="1"
      stroke="currentcolor"
      strokeWidth="2"
    />
    <rect
      x="1"
      y="12.6111"
      width="6.88793"
      height="6.88889"
      rx="1"
      stroke="currentcolor"
      strokeWidth="2"
    />
    <rect
      x="12.1113"
      y="1.5"
      width="6.88793"
      height="6.88889"
      rx="1"
      stroke="currentcolor"
      strokeWidth="2"
    />
    <rect
      x="12.1113"
      y="12.6108"
      width="6.88793"
      height="6.88889"
      rx="1"
      stroke="currentcolor"
      strokeWidth="2"
    />
  </svg>
)
