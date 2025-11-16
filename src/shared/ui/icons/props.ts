import { icons } from "@/shared/ui/icons/icons"
import { SVGProps } from "react"

export interface IIconsProps extends SVGProps<SVGSVGElement> {
  name: keyof typeof icons
}

export interface ISVGProps extends Omit<IIconsProps, "name"> {
  className?: string;
}
