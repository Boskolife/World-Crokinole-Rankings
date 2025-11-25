"use client";

import css from "./styles.module.scss";
import React from "react";

import cn from "classnames";
import Image from "next/image";

interface HeroSecondaryProps {
    title: string;
    description: string;
}

export const HeroSecondary: React.FC<HeroSecondaryProps> = ({ title, description }) => {
    return (
        <section className={css.hero_secondary}>
            <Image
                src="/images/hero-logo.png"
                alt="Hero Logo"
                width={250}
                height={250}
                className={css.hero_secondary_logo}
                priority
            />
            <div className={cn(css.hero_secondary_container, "container")}>
                <div className={css.hero_secondary_content}>
                    <h2 className={css.hero_secondary_title}>
                        {title}
                    </h2>
                    <p className={css.hero_secondary_description}>
                        {description}
                    </p>
                </div>
            </div>
        </section>
    );
};
