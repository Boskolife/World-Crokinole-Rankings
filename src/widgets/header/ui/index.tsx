"use client";

import React from "react";
import css from "./styles.module.scss";
import { useTranslations } from "next-intl";
import { Link } from "@/app/localization/routing";
import { LanguageSwitcher } from "@/shared/components/language-switcher";
import { Button } from "@/shared/ui/buttons/button";
import { Logo } from "@/shared/components/logo";
import { NavMenu } from "../components/nav-menu/NavMenu";
import { BurgerMenu } from "../components/burger-menu/Burger";
import { useHeader } from "@/shared/hooks/use-header";
import cn from "classnames";

export const Header: React.FC = () => {
    const tNavigation = useTranslations("navigation");
    const tAuth = useTranslations("auth");

    const { isMenuOpen, handleToggleMenu } = useHeader();

    const navMenuItems = [
        {
            href: "#",
            label: tNavigation("rankings"),
        },
        {
            href: "#",
            label: tNavigation("events"),
        },
        {
            href: "#",
            label: tNavigation("clubs"),
        },
        {
            href: "#",
            label: tNavigation("players"),
        },
        {
            href: "#",
            label: tNavigation("membershipPlans"),
        },
    ];

    return (
        <header className={css.header}>
            <div className="container">
                <div className={css.header_content}>
                    <Link href="/" className={css.header_logo}>
                        <Logo colorInverted={false} />
                    </Link>
                    <div
                        className={cn(css.header_inner, {
                            [css.open]: isMenuOpen,
                        })}
                    >
                        <NavMenu items={navMenuItems} />
                        <div className={css.header_actions}>
                            <LanguageSwitcher
                                className={css.header_language_switcher_desktop}
                            />
                            <div className={css.header_buttons}>
                                <Button
                                    buttonType="primary"
                                    className={css.header_button}
                                >
                                    {tAuth("signIn")}
                                </Button>
                                <Button
                                    buttonType="secondary"
                                    className={css.header_button}
                                >
                                    {tAuth("signUp")}
                                </Button>
                            </div>
                        </div>
                    </div>
                    <div className={css.header_actions_mobile}>
                        <LanguageSwitcher
                            className={css.header_language_switcher_mobile}
                        />
                        <BurgerMenu
                            isOpen={isMenuOpen}
                            handleToggleMenu={handleToggleMenu}
                        />
                    </div>
                </div>
            </div>
        </header>
    );
};
