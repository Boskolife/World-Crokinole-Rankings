import React from "react"
import { ISVGProps } from "../props"

export const IconBasket: React.FC<ISVGProps> = ({ className, ...props }) => (
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
      d="M5.00874 6H20.9981L19.7258 13.1747C19.6412 13.6522 19.2261 14.0001 18.7412 14.0001H5.99996C5.48714 14.0001 5.06449 13.614 5.00673 13.1167L5 12.9988L5.00874 6Z"
      stroke="currentcolor"
      strokeWidth="2"
      strokeLinecap="round"
      strokeLinejoin="round"
    />
    <path
      d="M3 3H4.98997L4.99992 7.00004"
      stroke="currentcolor"
      strokeWidth="2"
      strokeLinecap="round"
      strokeLinejoin="round"
    />
    <path
      fillRule="evenodd"
      clipRule="evenodd"
      d="M14.5 19C14.5 17.8954 15.3954 17 16.4999 17C17.6044 17 18.4998 17.8954 18.4998 19C18.4998 20.1046 17.6044 21 16.4999 21C15.4293 21 14.5527 20.0576 14.5 19Z"
      stroke="currentcolor"
      strokeWidth="2"
      strokeLinecap="round"
      strokeLinejoin="round"
    />
    <path
      fillRule="evenodd"
      clipRule="evenodd"
      d="M7.49988 21C6.39538 21 5.5 20.1046 5.5 19C5.5 17.8954 6.39538 17 7.49988 17C8.60438 17 9.49976 17.8954 9.49976 19C9.49976 20.1046 8.60438 21 7.49988 21Z"
      stroke="currentcolor"
      strokeWidth="2"
      strokeLinecap="round"
      strokeLinejoin="round"
    />
    <path
      d="M7.5 14V17"
      stroke="currentcolor"
      strokeWidth="2"
      strokeLinecap="round"
      strokeLinejoin="round"
    />
    <path
      d="M13.9998 19H10"
      stroke="currentcolor"
      strokeWidth="2"
      strokeLinecap="round"
      strokeLinejoin="round"
    />
  </svg>
)
