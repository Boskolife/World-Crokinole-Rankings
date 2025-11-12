import React from "react"
import { ISVGProps } from "../props"

export const IconCategory: React.FC<ISVGProps> = ({ className, ...props }) => (
  <svg
    className={className}
    width="28"
    height="28"
    viewBox="0 0 28 28"
    fill="none"
    xmlns="http://www.w3.org/2000/svg"
    {...props}
  >
    <path
      d="M16.3385 19.8327H23.3385M19.8385 16.3327V23.3327M4.67188 4.66602H11.6719V11.666H4.67188V4.66602ZM16.3385 4.66602H23.3385V11.666H16.3385V4.66602ZM4.67188 16.3327H11.6719V23.3327H4.67188V16.3327Z"
      stroke="currentcolor"
      strokeWidth="3"
      strokeLinecap="round"
      strokeLinejoin="round"
    />
  </svg>
)
