import React from "react"
import { ISVGProps } from "../props"

export const IconMinus: React.FC<ISVGProps> = ({ className, ...props }) => (
  <svg
    className={className}
    width="16"
    height="17"
    viewBox="0 0 16 17"
    fill="none"
    xmlns="http://www.w3.org/2000/svg"
    {...props}
  >
    <path
      d="M12.0026 9.16536H4.0026C3.82579 9.16536 3.65622 9.09513 3.5312 8.9701C3.40618 8.84508 3.33594 8.67551 3.33594 8.4987C3.33594 8.32189 3.40618 8.15232 3.5312 8.02729C3.65622 7.90227 3.82579 7.83203 4.0026 7.83203H12.0026C12.1794 7.83203 12.349 7.90227 12.474 8.02729C12.599 8.15232 12.6693 8.32189 12.6693 8.4987C12.6693 8.67551 12.599 8.84508 12.474 8.9701C12.349 9.09513 12.1794 9.16536 12.0026 9.16536Z"
      fill="currentcolor"
    />
  </svg>
)
