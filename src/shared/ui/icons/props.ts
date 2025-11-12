import { icons } from "@/shared/ui/icons/icons"
import { SVGProps } from "react"

export interface IIconsProps extends SVGProps<SVGSVGElement> {
  name: keyof typeof icons
  size?: "sm" | "md"
  color?: "light" | "green" | "dark" | "none"
}

export interface ISVGProps extends Omit<IIconsProps, "name" | "color" | "size"> {}
