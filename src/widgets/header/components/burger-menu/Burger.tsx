"use client";

import React from "react";
import css from "./styles.module.scss";
import { Icon } from "@/shared/ui/icons";
import cn from "classnames";

interface BurgerMenuProps {
    isOpen: boolean;
    handleToggleMenu: () => void;
}

export const BurgerMenu: React.FC<BurgerMenuProps> = ({ isOpen, handleToggleMenu }) => {
    return (
        <button
            className={cn(css.burger_menu, {
                [css.open]: isOpen,
            })}
            onClick={handleToggleMenu}
            aria-label={isOpen ? "Close menu" : "Open menu"}
            aria-expanded={isOpen}
        >
            <div className={css.burger_menu_icon}>
                {isOpen ? (
                    <Icon name="x" className={css.burger_icon} />
                ) : (
                    <Icon name="burger" className={css.burger_icon} />
                )}
            </div>
        </button>
    );
};
