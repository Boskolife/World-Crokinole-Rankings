import React from "react"
import { ISVGProps } from "../props"

export const IconUser: React.FC<ISVGProps> = ({ className, ...props }) => (
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
      d="M11.832 12.832C9.07061 12.832 6.83203 10.5935 6.83203 7.83203C6.83203 5.07061 9.07061 2.83203 11.832 2.83203C14.5935 2.83203 16.832 5.07061 16.832 7.83203C16.832 10.5935 14.5935 12.832 11.832 12.832ZM11.832 15.832C16.9749 15.832 19.9749 17.4987 20.832 20.832H2.83203C3.68917 17.4987 6.68917 15.832 11.832 15.832Z"
      stroke="currentcolor"
      strokeWidth="2"
      strokeLinecap="round"
      strokeLinejoin="round"
    />
  </svg>
)
