import React from "react";
import css from "./styles.module.scss";
import Image from "next/image";
import cn from "classnames";

interface LogoProps {
    className?: string;
    colorInverted?: boolean;
}

export const Logo: React.FC<LogoProps> = ({ className, colorInverted }) => {
    return (
        <Image
            src={
                colorInverted
                    ? "/images/logo-white.png"
                    : "/images/logo-black.png"
            }
            alt="World Crokinole Rankings"
            width={127}
            height={50}
            className={cn(css.header_logo_image, className)}
            priority
        />
    );
};
