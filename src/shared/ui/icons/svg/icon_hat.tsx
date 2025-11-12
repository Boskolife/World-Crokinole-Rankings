import React from "react"
import { ISVGProps } from "../props"

export const IconHat: React.FC<ISVGProps> = ({ className, ...props }) => (
  <svg
    className={className}
    width="26"
    height="22"
    viewBox="0 0 26 22"
    fill="none"
    xmlns="http://www.w3.org/2000/svg"
    {...props}
  >
    <path
      d="M12.9974 0.5L0.164062 7.5L12.9974 14.5L23.4974 8.77167V16.8333H25.8307V7.5M4.83073 12.3767V17.0433L12.9974 21.5L21.1641 17.0433V12.3767L12.9974 16.8333L4.83073 12.3767Z"
      fill="currentcolor"
    />
  </svg>
)
