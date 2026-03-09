import React from "react";
import css from "./styles.module.scss";
import Image from "next/image";
import { Icon } from "@/shared/ui/icons";
import { Button } from "@/shared/ui/buttons";
import { RootLink } from "@/shared/ui/links/root-link";
import { IClub } from "@/shared/types/clubs.interface";
import { clientRoutes } from "@/shared/routes/client";
import { useClubJoinRequest } from "@/shared/hooks/use-club-join-request";
import { getCountryFlagUrl } from "@/shared/lib/country-flag";
import cn from "classnames";

export const ClubCard: React.FC<IClub & { showJoinButton?: boolean; isAuth?: boolean }> = ({
    id,
    image,
    title,
    description,
    members,
    location,
    country,
    labelItem1,
    labelItem2,
    hosted,
    veteranPlayers,
    isLocked,
    showJoinButton = true,
    isAuth = false,
}) => {
    const { status: joinStatus, createRequest, isSubmitting } = useClubJoinRequest(id);
    return (
        <div className={css.club_card}>
            <div
                className={cn(css.club_card_image, {
                    [css.club_card_image_locked]: isLocked,
                })}
            >
                <Image
                    src={image || "/images/news-placeholder.png"}
                    alt={title}
                    width={100}
                    height={100}
                />
                {isLocked && (
                    <div className={css.club_card_image_locked_overlay}>
                        <div
                            className={css.club_card_image_locked_icon_wrapper}
                        >
                            <Icon
                                name="lock"
                                className={css.club_card_image_locked_icon}
                            />
                        </div>
                        <p className={css.club_card_image_locked_text}>
                            Invite only
                        </p>
                    </div>
                )}
            </div>
            <h3 className={css.club_card_title}>{title}</h3>
            <p className={css.club_card_description}>{description}</p>
            <div className={css.club_card_info}>
                <div className={css.club_card_info_members}>
                    <Icon
                        name="members"
                        className={css.club_card_info_members_icon}
                    />
                    <span className={css.club_card_info_members_value}>
                        {members} members
                    </span>
                </div>
                <div className={css.club_card_info_location}>
                    <Image
                        src={getCountryFlagUrl(country || location)}
                        width={20}
                        height={20}
                        alt=""
                        className={css.club_card_info_location_icon}
                    />
                    <span className={css.club_card_info_location_value}>
                        {location || "—"}
                    </span>
                </div>
            </div>
            {(labelItem1 || labelItem2 || (typeof hosted === "number" && hosted > 0) || (typeof veteranPlayers === "number" && veteranPlayers > 0)) && (
                <div className={css.club_card_labels}>
                    {labelItem1 && (
                        <span className={css.club_card_label}>{labelItem1}</span>
                    )}
                    {labelItem2 && (
                        <span className={css.club_card_label}>{labelItem2}</span>
                    )}
                    {typeof hosted === "number" && hosted > 0 && (
                        <span className={css.club_card_label}>
                            Events hosted: {hosted}
                        </span>
                    )}
                    {typeof veteranPlayers === "number" && veteranPlayers > 0 && (
                        <span className={css.club_card_label}>
                            Veteran players: {veteranPlayers}
                        </span>
                    )}
                </div>
            )}
            <div
                className={cn(
                    css.club_card_buttons,
                    !showJoinButton && css.club_card_buttons_single
                )}
            >
                <RootLink
                    href={clientRoutes.clubDetail(id)}
                    className={cn(css.club_card_button, css.club_card_button_link)}
                >
                    View Details
                </RootLink>
                {showJoinButton && (
                    !isAuth ? (
                        isLocked ? (
                            <Button
                                buttonType="secondary"
                                disabled={true}
                                className={css.club_card_button}
                            >
                                Invite Only
                            </Button>
                        ) : (
                            <RootLink
                                href={clientRoutes.signUp}
                                className={cn(css.club_card_button, css.club_card_button_link)}
                            >
                                Join Club
                            </RootLink>
                        )
                    ) : isLocked ? (
                        <Button
                            buttonType="secondary"
                            disabled={true}
                            className={css.club_card_button}
                        >
                            Invite Only
                        </Button>
                    ) : joinStatus === "pending" ? (
                        <span className={cn(css.club_card_button, css.club_card_button_static)}>
                            Pending
                        </span>
                    ) : joinStatus === "invited" ? (
                        <span className={cn(css.club_card_button, css.club_card_button_static)}>
                            Invited
                        </span>
                    ) : joinStatus === "approved" ? (
                        <span className={cn(css.club_card_button, css.club_card_button_static)}>
                            Member
                        </span>
                    ) : joinStatus === "rejected" ? (
                        <span className={cn(css.club_card_button, css.club_card_button_static)}>
                            Declined
                        </span>
                    ) : (
                        <Button
                            buttonType="secondary"
                            disabled={isSubmitting}
                            className={css.club_card_button}
                            onClick={async () => {
                                await createRequest();
                            }}
                        >
                            {isSubmitting ? "Sending…" : "Join Club"}
                        </Button>
                    )
                )}
            </div>
        </div>
    );
};
