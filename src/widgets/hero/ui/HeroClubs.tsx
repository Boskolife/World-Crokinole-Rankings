"use client";

import css from "./styles.module.scss";
import React from "react";
import cn from "classnames";
import { CustomButton } from "@/shared/ui/buttons";
import Image from "next/image";

export const HeroClubs: React.FC = () => {
    return (
        <section className={css.hero}>
            <div className={css.hero_figure}>
                <Image
                    src="/images/Group 81.svg"
                    alt=""
                    width={1019}
                    height={1017}
                    className={css.hero_figure_bg}
                    priority
                />
                <Image
                    src="/images/shield.png"
                    alt=""
                    width={820}
                    height={820}
                    className={css.hero_figure_shield}
                    priority
                />
            </div>
            <div className={cn(css.hero_container, "container")}>
                <div className={css.hero_content}>
                    <h1 className={css.hero_title}>GAMING CLUBS</h1>
                    <p className={css.hero_description}>
                        Join a club to unlock exclusive bonuses and compete with
                        fellow gamers
                    </p>
                    <CustomButton inverted href="#clubs-list">
                        View clubs
                    </CustomButton>
                </div>
            </div>
        </section>
    );
};
