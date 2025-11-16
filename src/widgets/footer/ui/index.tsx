"use client";

import React from "react";
import { useTranslations } from "next-intl";
import css from "./styles.module.scss";
import { Logo } from "@/shared/components/logo";
import { NavMenu } from "@/widgets/header/components/nav-menu/NavMenu";
import Image from "next/image";

export const Footer: React.FC = () => {
    const tNavigation = useTranslations("navigation");

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
    ];

    return (
        <footer className={css.footer}>
            <Image
                className={css.footer_logo_bg}
                src="/images/big-logo-black.png"
                alt="big-logo-black"
                width={190}
                height={380}
            />
            <div className="container">
                <div className={css.footer_content}>
                    <div className={css.footer_content_top}>
                        <div className={css.footer_content_left}>
                            <Logo colorInverted={true}  className={css.footer_content_left_logo}/>
                            <p className={css.footer_content_left_text}>
                                We`re a family company and we love to hear from
                                you. Reach us at
                            </p>
                            <a
                                href="mailto:support@worldcrokinolerankings.com"
                                className={css.footer_content_left_email}
                            >
                                support@worldcrokinolerankings.com
                            </a>
                        </div>
                        <div className={css.footer_content_right}>
                            <NavMenu items={navMenuItems} />
                        </div>
                    </div>
                </div>
            </div>
        </footer>
    );
};
