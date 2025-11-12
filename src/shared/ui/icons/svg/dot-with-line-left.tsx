import React from "react"
import { ISVGProps } from "../props"

export const DotLineLeft: React.FC<ISVGProps> = ({ className, ...props }) => (
  <svg
    className={className}
    width="64"
    height="6"
    viewBox="0 0 64 6"
    fill="none"
    xmlns="http://www.w3.org/2000/svg"
    {...props}
  >
    <rect
      x="0.160156"
      y="2"
      width="60"
      height="2"
      fill="url(#paint0_linear_223_9217)"
    />
    <rect
      x="57.1602"
      width="6"
      height="6"
      rx="3"
      fill="currentcolor"
    />
    <defs>
      <linearGradient
        id="paint0_linear_223_9217"
        x1="60.1602"
        y1="3"
        x2="0.160156"
        y2="3"
        gradientUnits="userSpaceOnUse"
      >
        <stop stopColor="currentcolor" />
        <stop
          offset="1"
          stopColor="white"
        />
      </linearGradient>
    </defs>
  </svg>
)
