import React from "react"
import { ISVGProps } from "../props"

export const LogIn: React.FC<ISVGProps> = ({ className, ...props }) => (
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
      d="M5 14.1667C5 14.9416 5 15.3291 5.08519 15.647C5.31635 16.5098 5.99022 17.1836 6.85295 17.4148C7.17087 17.5 7.55836 17.5 8.33333 17.5H13.5C14.9001 17.5 15.6002 17.5 16.135 17.2275C16.6054 16.9878 16.9878 16.6054 17.2275 16.135C17.5 15.6002 17.5 14.9001 17.5 13.5V6.5C17.5 5.09987 17.5 4.3998 17.2275 3.86502C16.9878 3.39462 16.6054 3.01217 16.135 2.77248C15.6002 2.5 14.9001 2.5 13.5 2.5H8.33333C7.55836 2.5 7.17087 2.5 6.85295 2.58519C5.99022 2.81635 5.31635 3.49022 5.08518 4.35295C5 4.67087 5 5.05836 5 5.83333M10 6.66667L13.3333 10M13.3333 10L10 13.3333M13.3333 10H2.5"
      stroke="currentColor"
      strokeWidth="1.2"
      strokeLinecap="round"
      strokeLinejoin="round"
    />
  </svg>
)
