import React from "react"
import { ISVGProps } from "../props"

export const IconTiktok: React.FC<ISVGProps> = ({ className, ...props }) => (
  <svg
    className={className}
    width="24"
    height="24"
    viewBox="0 0 24 24"
    fill="none"
    xmlns="http://www.w3.org/2000/svg"
    {...props}
  >
    <rect
      x="0.75"
      y="0.75"
      width="22.5"
      height="22.5"
      rx="3.25"
      stroke="currentcolor"
      strokeWidth="1.5"
    />
    <path
      d="M13.5 4V15C13.5 15.6922 13.2947 16.3689 12.9101 16.9445C12.5256 17.5201 11.9789 17.9687 11.3394 18.2336C10.6999 18.4985 9.99612 18.5678 9.31719 18.4327C8.63825 18.2977 8.01461 17.9644 7.52513 17.4749C7.03564 16.9854 6.7023 16.3618 6.56725 15.6828C6.4322 15.0039 6.50152 14.3001 6.76642 13.6606C7.03133 13.0211 7.47993 12.4744 8.05551 12.0899C8.63108 11.7053 9.30777 11.5 10 11.5M18 9.5C16.8065 9.5 15.6619 9.02589 14.818 8.18198C13.9741 7.33807 13.5 6.19347 13.5 5"
      stroke="currentcolor"
      strokeWidth="1.5"
    />
  </svg>
)
