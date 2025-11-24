"use client";

import css from "./styles.module.scss";
import React from "react";

import cn from "classnames";
import { CustomButton } from "@/shared/ui/buttons";
import Image from "next/image";

export const Hero: React.FC = () => {
    return (
        <section className={css.hero}>
            <Image
                src="/images/hero/hero-bg.png"
                alt="Hero Background"
                width={1020}
                height={590}
                className={css.hero_background}
                priority
            />
            <Image
                src="/images/hero/crown.png"
                alt="Crown"
                width={820}
                height={650}
                className={css.hero_crown}
                priority
                fetchPriority="high"
            />
            <div className={cn(css.hero_container, "container")}>
                <div className={css.hero_content}>
                    <h1 className={css.hero_title}>
                        Your kingdom needs a champion — is it you?
                    </h1>
                    <p className={css.hero_description}>
                        Earn laurels. Climb the rankings. Claim the crown.
                    </p>
                    <CustomButton inverted>View Upcoming Events</CustomButton>
                </div>
            </div>
        </section>
    );
};
