"use client";

import css from "./styles.module.scss";
import React from "react";

import cn from "classnames";
import Image from "next/image";

export const HeroSecondary: React.FC = () => {
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
                        Discover BrownCastle Events
                    </h2>
                    <p className={css.hero_secondary_description}>
                        Discover a world of exciting tournaments and meetings.
                        Find events near you or online, register in a few clicks
                        and join competitions of various formats. Here you can
                        test your strength, meet new opponents and gain valuable
                        experience on the way to new victories.
                    </p>
                </div>
            </div>
        </section>
    );
};
