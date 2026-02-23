"use client";

import css from "./styles.module.scss";
import buttonCss from "@/shared/ui/buttons/button/styles.module.scss";
import React, { useState, useEffect } from "react";
import cn from "classnames";
import { CustomButton } from "@/shared/ui/buttons";
import { Button } from "@/shared/ui/buttons";
import Image from "next/image";
import { useUserProfile } from "@/shared/hooks/use-user-profile";
import { usePopup } from "@/shared/contexts/popup-context";
import { useAuth } from "@/shared/hooks/use-auth";
import { getClubsWhereUserIsAdmin } from "@/shared/supabase/data";
import { RootLink } from "@/shared/ui/links/root-link";
import { clientRoutes } from "@/shared/routes/client";

export const HeroClubs: React.FC = () => {
    const { profile } = useUserProfile();
    const { openPopup } = usePopup();
    const { user } = useAuth();
    const isCommunityAdmin = profile?.subscription_plan === "administrator";
    const [myClubId, setMyClubId] = useState<number | null>(null);

    useEffect(() => {
        if (!isCommunityAdmin || !user?.id) {
            setMyClubId(null);
            return;
        }
        getClubsWhereUserIsAdmin(user.id).then((clubs) => {
            setMyClubId(clubs.length > 0 ? clubs[0].id : null);
        });
    }, [isCommunityAdmin, user?.id]);

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
                    <div className={css.hero_buttons}>
                        <CustomButton inverted href="#clubs-list">
                            View clubs
                        </CustomButton>
                        {isCommunityAdmin &&
                            (myClubId != null ? (
                                <RootLink
                                    href={clientRoutes.clubDetail(myClubId)}
                                    className={cn(
                                        buttonCss.button,
                                        buttonCss.button_secondary,
                                        css.hero_create_club_btn
                                    )}
                                >
                                    <span>Go to my club</span>
                                </RootLink>
                            ) : (
                                <Button
                                    buttonType="secondary"
                                    icon="plus"
                                    className={css.hero_create_club_btn}
                                    onClick={() => openPopup("create-club")}
                                >
                                    Create Club
                                </Button>
                            ))}
                    </div>
                </div>
            </div>
        </section>
    );
};
