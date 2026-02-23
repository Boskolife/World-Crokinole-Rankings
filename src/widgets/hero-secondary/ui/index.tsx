"use client";

import css from "./styles.module.scss";
import React from "react";

import cn from "classnames";
import Image from "next/image";
import { CustomButton } from "@/shared/ui/buttons";

interface HeroSecondaryProps {
    title: string;
    description: string;
    variant?: "default" | "clubs";
    ctaText?: string;
    ctaHref?: string;
}

export const HeroSecondary: React.FC<HeroSecondaryProps> = ({
    title,
    description,
    variant = "default",
    ctaText,
    ctaHref,
}) => {
    const isClubs = variant === "clubs";

    return (
        <section
            className={cn(css.hero_secondary, {
                [css.hero_secondary_clubs]: isClubs,
            })}
        >
            {isClubs && (
                <div className={css.hero_secondary_arcs} aria-hidden />
            )}
            {!isClubs && (
                <Image
                    src="/images/hero-logo.png"
                    alt=""
                    width={250}
                    height={250}
                    className={css.hero_secondary_logo}
                    priority
                />
            )}
            <div className={cn(css.hero_secondary_container, "container")}>
                <div
                    className={cn(css.hero_secondary_content, {
                        [css.hero_secondary_content_clubs]: isClubs,
                    })}
                >
                    <h2
                        className={cn(css.hero_secondary_title, {
                            [css.hero_secondary_title_clubs]: isClubs,
                        })}
                    >
                        {isClubs ? title.toUpperCase() : title}
                    </h2>
                    <p
                        className={cn(css.hero_secondary_description, {
                            [css.hero_secondary_description_clubs]: isClubs,
                        })}
                    >
                        {description}
                    </p>
                    {isClubs && ctaText && ctaHref && (
                        <CustomButton
                            className={css.hero_secondary_cta}
                            inverted
                            href={ctaHref}
                        >
                            {ctaText}
                        </CustomButton>
                    )}
                </div>
                {isClubs && (
                    <div className={css.hero_secondary_figure}>
                        <Image
                            src="/images/Group 81.svg"
                            alt=""
                            width={1019}
                            height={1017}
                            className={css.hero_secondary_figure_bg}
                            priority
                        />
                        <Image
                            src="/images/shield.png"
                            alt=""
                            width={820}
                            height={820}
                            className={css.hero_secondary_logo}
                            priority
                        />
                    </div>
                )}
            </div>
        </section>
    );
};
