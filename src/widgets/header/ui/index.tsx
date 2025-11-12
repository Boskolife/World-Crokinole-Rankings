"use client";

import React from "react";
import css from "./styles.module.scss";
import Image from "next/image";
import { useTranslations } from "next-intl";
import { Link } from "@/app/localization/routing";
import { LanguageSwitcher } from "@/shared/components/language-switcher";
import { Button } from "@/shared/ui/buttons/button";
import { RootLink } from "@/shared/ui/links/root-link";

export const Header: React.FC = () => {
    const t = useTranslations("navigation");

    return (
        <header className={css.header}>
            <div className="container">
                <div className={css.header_content}>
                <Link href="/" className={css.header_logo}>
                    <Image
                        src="/images/logo-white.png"
                        alt="Logo"
                        width={127}
                        height={50}
                        className={css.header_logo_image}
                        priority
                    />
                </Link>
                <div className={css.header_inner}>
                        <nav className={css.header_nav}>
                            <RootLink href="#" className={css.header_nav_link}>
                                {t("rankings")}
                            </RootLink>
                            <RootLink href="#" className={css.header_nav_link}>
                                {t("events")}
                            </RootLink>
                            <RootLink href="#" className={css.header_nav_link}>
                                {t("clubs")}
                            </RootLink>
                            <RootLink href="#" className={css.header_nav_link}>
                                {t("players")}
                            </RootLink>
                            <RootLink href="#" className={css.header_nav_link}>
                                {t("membershipPlans")}
                            </RootLink>
                    </nav>
                    <div className={css.header_actions}>
                        <LanguageSwitcher />
                        <div className={css.header_buttons}>
                                <Button>{t("signIn")}</Button>
                                <Button buttonType="secondary">{t("signUp")}</Button>
                        </div>
                    </div>
                </div>
                </div>
            </div>
        </header>
    );
};
