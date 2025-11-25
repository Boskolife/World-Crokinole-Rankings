"use client";

import React from "react";
import css from "./styles.module.scss";
import { Link } from "@/app/localization/routing";
import { LanguageSwitcher } from "@/shared/components/language-switcher";
import { Button } from "@/shared/ui/buttons/button";
import { Logo } from "@/shared/components/logo";
import { NavMenu } from "../components/nav-menu/NavMenu";
import { BurgerMenu } from "../components/burger-menu/Burger";
import { useHeader } from "@/shared/hooks";
import cn from "classnames";
import { useAuth } from "@/shared/hooks";
import { Profile } from "../components/profile/Profile";
import { Notification } from "../components/notifications/Notification";

export const Header: React.FC = () => {
    const { isMenuOpen, handleToggleMenu, navMenuItems, tAuth } = useHeader();
    const { isAuth } = useAuth();
    return (
        <header className={cn(css.header, "header")}>
            <div className="container">
                <div className={css.header_content}>
                    <Link href="/" className={css.header_logo}>
                        <Logo colorInverted={false} />
                    </Link>
                    <div
                        className={cn(css.header_inner, {
                            [css.open]: isMenuOpen,
                            [css.isAuth]: isAuth,
                        })}
                    >
                        <NavMenu items={navMenuItems} />
                        {isAuth ? (
                            <div
                                className={css.header_profile}
                                suppressHydrationWarning
                            >
                                <LanguageSwitcher
                                    className={
                                        css.header_language_switcher_desktop
                                    }
                                />
                                <div className={css.header_profile_plan}>
                                    <span>Free Plan</span>
                                </div>
                                <Notification />
                                <Profile />
                            </div>
                        ) : (
                            <div
                                className={css.header_actions}
                                suppressHydrationWarning
                            >
                                <LanguageSwitcher
                                    className={
                                        css.header_language_switcher_desktop
                                    }
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
                        )}
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
