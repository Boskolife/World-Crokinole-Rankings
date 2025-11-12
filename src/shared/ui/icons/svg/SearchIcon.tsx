import React from "react"
import { ISVGProps } from "../props"

export const SearchIcon: React.FC<ISVGProps> = ({ className, ...props }) => (
  <svg
    className={className}
    width="16"
    height="16"
    viewBox="0 0 16 16"
    fill="none"
    xmlns="http://www.w3.org/2000/svg"
    {...props}
  >
    <path
      d="M10.0353 10.0353C10.4724 9.59822 10.8191 9.07933 11.0557 8.50825C11.2922 7.93718 11.4139 7.3251 11.4139 6.70697C11.4139 6.08885 11.2922 5.47677 11.0557 4.90569C10.8191 4.33462 10.4724 3.81572 10.0353 3.37864C9.59822 2.94156 9.07933 2.59484 8.50825 2.3583C7.93718 2.12175 7.3251 2 6.70697 2C6.08885 2 5.47677 2.12175 4.90569 2.3583C4.33462 2.59484 3.81572 2.94156 3.37864 3.37864C2.49591 4.26137 2 5.45861 2 6.70697C2 7.95534 2.49591 9.15258 3.37864 10.0353C4.26137 10.918 5.45861 11.4139 6.70697 11.4139C7.95534 11.4139 9.15258 10.918 10.0353 10.0353ZM10.0353 10.0353L13 13"
      stroke="currentcolor"
      strokeWidth="1.5"
      strokeLinecap="round"
      strokeLinejoin="round"
    />
  </svg>
)
