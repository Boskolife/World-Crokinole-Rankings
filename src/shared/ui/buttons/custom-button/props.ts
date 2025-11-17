import { DetailedHTMLProps, ButtonHTMLAttributes } from "react";

export interface ICustomButtonProps
    extends DetailedHTMLProps<
        ButtonHTMLAttributes<HTMLButtonElement>,
        HTMLButtonElement
    > {
    className?: string;
    inverted?: boolean;
}
