import React from "react"
import { ISVGProps } from "../props"

export const Edit: React.FC<ISVGProps> = ({ className, ...props }) => (
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
      d="M14.9999 8.33338L11.6666 5.00005M2.08325 17.9167L4.90356 17.6033C5.24813 17.5651 5.42042 17.5459 5.58146 17.4938C5.72433 17.4475 5.86029 17.3822 5.98566 17.2995C6.12696 17.2063 6.24954 17.0838 6.49469 16.8386L17.4999 5.83338C18.4204 4.91291 18.4204 3.42052 17.4999 2.50005C16.5795 1.57957 15.0871 1.57957 14.1666 2.50005L3.16136 13.5053C2.91621 13.7504 2.79363 13.873 2.70045 14.0143C2.61778 14.1397 2.55243 14.2756 2.50618 14.4185C2.45405 14.5795 2.43491 14.7518 2.39662 15.0964L2.08325 17.9167Z"
      stroke="currentColor"
      strokeWidth="1.2"
      strokeLinecap="round"
      strokeLinejoin="round"
    />
  </svg>
)
