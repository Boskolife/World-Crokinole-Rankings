"use client";

import React from "react";
import { useTranslations } from "next-intl";
import css from "./styles.module.scss";
import { Logo } from "@/shared/components/logo";
import Image from "next/image";
import { RootLink } from "@/shared/ui/links/root-link";
import { clientRoutes } from "@/shared/routes/client";

export const Footer: React.FC = () => {
    const tNavigation = useTranslations("navigation");

    const navMenuItems = [
        {
            href: clientRoutes.rankings,
            label: tNavigation("rankings"),
        },
        {
            href: clientRoutes.events,
            label: tNavigation("events"),
        },
        {
            href: clientRoutes.clubs,
            label: tNavigation("clubs"),
        },
        {
            href: clientRoutes.players,
            label: tNavigation("players"),
        },
    ];

    const date = new Date().getFullYear();

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
                            <Logo
                                colorInverted={true}
                                className={css.footer_content_left_logo}
                            />
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
                            <nav className={css.footer_content_right_menu}>
                                <ul
                                    className={
                                        css.footer_content_right_menu_list
                                    }
                                >
                                    {navMenuItems.map((item, index: number) => (
                                        <li
                                            key={index}
                                            className={
                                                css.footer_content_right_menu_item
                                            }
                                        >
                                            <RootLink
                                                href={item.href}
                                                className={
                                                    css.footer_content_right_menu_link
                                                }
                                            >
                                                {item.label}
                                            </RootLink>
                                        </li>
                                    ))}
                                </ul>
                            </nav>
                        </div>
                    </div>
                    <div className={css.footer_content_bottom}>
                        <p className={css.footer_content_bottom_text}>
                           <span> © {date} World Crokinole Rankings.</span> 
                           <span> All rights reserved.</span>
                        </p>
                    </div>
                </div>
            </div>
        </footer>
    );
};
