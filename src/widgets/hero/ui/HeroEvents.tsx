"use client";

import css from "./styles.module.scss";
import React from "react";
import cn from "classnames";
import { CustomButton } from "@/shared/ui/buttons";
import { Button } from "@/shared/ui/buttons";
import Image from "next/image";
import { useUserProfile } from "@/shared/hooks/use-user-profile";

export const HeroEvents: React.FC = () => {
    const { profile } = useUserProfile();
    const isCommunityAdmin =
        profile?.subscription_plan === "administrator";
    const canCreateEvent =
        profile?.subscription_plan === "premium" || isCommunityAdmin;

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
                    src="/images/globe.png"
                    alt=""
                    width={820}
                    height={820}
                    className={cn(css.hero_figure_shield, css.hero_figure_globe)}
                    priority
                />
            </div>
            <div className={cn(css.hero_container, "container")}>
                <div className={css.hero_content}>
                    <h1 className={css.hero_title}>
                        Explore local and global events
                    </h1>
                    <p className={css.hero_description}>
                        Connect with clubs, compete in tournaments, and test
                        your skill against the best.
                    </p>
                    <div className={css.hero_buttons}>
                        {!isCommunityAdmin && (
                            <CustomButton inverted href="#events-list">
                                View events
                            </CustomButton>
                        )}
                        {canCreateEvent && (
                            <Button
                                buttonType="secondary"
                                icon="plus"
                                className={css.hero_create_club_btn}
                                onClick={() => {}}
                            >
                                Create new event
                            </Button>
                        )}
                        {isCommunityAdmin && (
                            <Button
                                buttonType="secondary"
                                icon="plus"
                                className={css.hero_create_club_btn}
                                onClick={() => {}}
                            >
                                Create Ranked Tournament
                            </Button>
                        )}
                    </div>
                </div>
            </div>
        </section>
    );
};
