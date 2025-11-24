import React from "react";
import css from "./styles.module.scss";
import Image from "next/image";
import { Icon } from "@/shared/ui/icons";
import { Button } from "@/shared/ui/buttons";
import { IClub } from "@/shared/types/clubs.interface";
import cn from "classnames";

export const ClubCard: React.FC<IClub> = ({
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
}) => {
    return (
        <div className={css.club_card}>
            <div
                className={cn(css.club_card_image, {
                    [css.club_card_image_locked]: isLocked,
                })}
            >
                {isLocked ? (
                    <>
                        <div
                            className={css.club_card_image_locked_icon_wrapper}
                        >
                            <Icon
                                name="lock"
                                className={css.club_card_image_locked_icon}
                            />
                        </div>
                        <p className={css.club_card_image_locked_text}>
                            Club Logo / image
                        </p>
                    </>
                ) : (
                    <Image
                        src={image || "/images/news-placeholder.png"}
                        alt={title}
                        width={100}
                        height={100}
                    />
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
                        src={country}
                        width={20}
                        height={20}
                        alt={country || "Country"}
                        className={css.club_card_info_location_icon}
                    />
                    <span className={css.club_card_info_location_value}>
                        {location}
                    </span>
                </div>
            </div>
            <div className={css.club_card_labels}>
                <span className={css.club_card_label}>{labelItem1}</span>
                <span className={css.club_card_label}>{labelItem2}</span>
                <span className={css.club_card_label}>
                    Events hosted: {hosted}
                </span>
                <span className={css.club_card_label}>
                    Veteran players: {veteranPlayers}
                </span>
            </div>
            <div className={css.club_card_buttons}>
                <Button buttonType="primary" className={css.club_card_button}>
                    View Details
                </Button>
                <Button
                    buttonType="secondary"
                    disabled={isLocked}
                    className={css.club_card_button}
                >
                    {isLocked ? "Invite Only" : "Join Club"}
                </Button>
            </div>
        </div>
    );
};
