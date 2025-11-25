import { RootLink } from "@/shared/ui/links/root-link";
import React from "react";
import css from "./styles.module.scss";
import cn from "classnames";

interface INavMenuProps {
    linkClassName?: string;
    items: {
        href: string;
        label: string;
        onClick?: () => void;
    }[];
}

export const NavMenu: React.FC<INavMenuProps> = ({ items, linkClassName }) => {
    return (
        <nav className={css.nav_menu}>
            {items.map((item, index: number) => (
                <RootLink
                    href={item.href}
                    className={cn(css.nav_menu_link, linkClassName)}
                    key={index}
                    onClick={(e) => {
                        if (item.onClick) {
                            e.preventDefault();
                            item.onClick();
                        }
                    }}
                >
                    {item.label}
                </RootLink>
            ))}
        </nav>
    );
};
