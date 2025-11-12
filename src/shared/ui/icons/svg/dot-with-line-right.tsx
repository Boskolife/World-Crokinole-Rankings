import React from "react"
import { ISVGProps } from "../props"

export const DotLineRight: React.FC<ISVGProps> = ({ className, ...props }) => (
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
      x="3.16016"
      y="2"
      width="60"
      height="2"
      fill="url(#paint0_linear_223_9220)"
    />
    <rect
      x="0.160156"
      width="6"
      height="6"
      rx="3"
      fill="currentcolor"
    />
    <defs>
      <linearGradient
        id="paint0_linear_223_9220"
        x1="63.1602"
        y1="3"
        x2="3.16016"
        y2="3"
        gradientUnits="userSpaceOnUse"
      >
        <stop stopColor="white" />
        <stop
          offset="1"
          stopColor="currentcolor"
        />
      </linearGradient>
    </defs>
  </svg>
)
