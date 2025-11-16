import { DetailedHTMLProps, ButtonHTMLAttributes } from "react";

export interface IButtonProps
    extends DetailedHTMLProps<
        ButtonHTMLAttributes<HTMLButtonElement>,
        HTMLButtonElement
    > {
    className?: string;
    buttonType?: "primary" | "secondary" | "white" | "transparent";
    icon?: string;
}
