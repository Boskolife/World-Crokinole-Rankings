import React from "react"
import { ISVGProps } from "../props"

export const IconEdit: React.FC<ISVGProps> = ({ className, ...props }) => (
  <svg
    className={className}
    width="24"
    height="24"
    viewBox="0 0 24 24"
    fill="none"
    xmlns="http://www.w3.org/2000/svg"
    {...props}
  >
    <path
      fillRule="evenodd"
      clipRule="evenodd"
      d="M19.4385 10.2339L7.50932 22.1631H2.00356L2 16.6538L13.9291 4.72461L19.4385 10.2339Z"
      stroke="currentcolor"
      strokeWidth="2"
      strokeLinecap="round"
      strokeLinejoin="round"
    />
    <path
      d="M13.9297 4.72373L15.9839 2.66947C16.8766 1.77684 18.3238 1.77684 19.2164 2.66947L21.4933 4.9463C22.3859 5.83892 22.3859 7.28616 21.4933 8.17879L19.439 10.233"
      stroke="currentcolor"
      strokeWidth="2"
      strokeLinecap="round"
      strokeLinejoin="round"
    />
  </svg>
)
