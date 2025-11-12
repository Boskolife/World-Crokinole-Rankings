import React from "react"
import { ISVGProps } from "../props"

export const IconFacebook: React.FC<ISVGProps> = ({ className, ...props }) => (
  <svg
    className={className}
    width="12"
    height="20"
    viewBox="0 0 12 20"
    fill="none"
    xmlns="http://www.w3.org/2000/svg"
    {...props}
  >
    <path
      d="M3.19678 19.5H7.19678V11.49H10.8008L11.1968 7.51H7.19678V5.5C7.19678 5.23478 7.30214 4.98043 7.48967 4.79289C7.67721 4.60536 7.93156 4.5 8.19678 4.5H11.1968V0.5H8.19678C6.8707 0.5 5.59893 1.02678 4.66125 1.96447C3.72357 2.90215 3.19678 4.17392 3.19678 5.5V7.51H1.19678L0.800781 11.49H3.19678V19.5Z"
      fill="currentcolor"
    />
  </svg>
)
