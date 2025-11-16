import React from "react"
import { IIconsProps } from "./props"
import { icons } from "@/shared/ui/icons/icons"
import cn from "classnames"
import css from "./styles.module.scss"

const IconComponent: React.FC<IIconsProps> = ({ name, ...props }) => {
  const SubComponent = icons[name]

  return <SubComponent {...props} />
}

export const Icon: React.FC<IIconsProps> = ({ name, className, ...props }) => {
  return (
    <IconComponent
      name={name}
      className={cn(css.icon, className)}
      {...props}
    />
  )
}
