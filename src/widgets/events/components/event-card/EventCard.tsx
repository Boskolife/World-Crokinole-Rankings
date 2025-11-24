import React from "react";
import css from "./styles.module.scss";
import Image from "next/image";
import { Icon } from "@/shared/ui/icons";
import cn from "classnames";
import { IEventCardProps } from "@/shared/types";
import { RootLink } from "@/shared/ui";

export const EventCard: React.FC<IEventCardProps> = ({
    image,
    title,
    price,
    date,
    location,
    format,
    isRanked,
    isRegistrationRequired,
}) => {
    return (
        <div className={css.event_card}>
            <div className={css.event_card_image}>
                <span
                    className={cn(css.event_card_registration, {
                        [css._required]: isRegistrationRequired,
                    })}
                >
                    {isRegistrationRequired
                        ? "Registration is Required"
                        : "No registration required"}
                </span>
                <div className={css.event_card_ranking}>
                    <span className={css.event_card_ranking_icon_wrapper}>
                        <Icon
                            name="ranking"
                            className={cn(css.event_card_ranking_icon, {
                                [css._ranked]: isRanked,
                            })}
                        />
                    </span>
                    <div className={css.event_card_ranking_value_wrapper}>
                        <span>4</span>
                        <span>/</span>
                        <span>12</span>
                    </div>
                </div>
                {image ? (
                    <Image
                        className={css.event_card_image_img}
                        src={image}
                        alt={title}
                        width={420}
                        height={240}
                    />
                ) : (
                    <div className={css.event_card_image_placeholder}>
                        <Image
                            src="/images/logo.png"
                            alt={title}
                            width={132}
                            height={127}
                        />
                    </div>
                )}
            </div>
            <div className={css.event_card_content}>
                <div className={css.event_card_title_wrap}>
                    <RootLink href="#">
                        <h3 className={css.event_card_title}>{title}</h3>
                    </RootLink>
                    <span
                        className={cn(css.event_card_price, {
                            [css._free]: price === "free" || price === "Free",
                        })}
                    >
                        {price === "free" ? "Free" : price}
                    </span>
                </div>
                <div className={css.event_card_content_info}>
                    <span className={css.event_card_date}>{date}</span>
                    <span className={css.event_card_location}>
                        <Icon
                            name="location"
                            className={css.event_card_location_icon}
                        />
                        {location}
                    </span>
                    <span className={css.event_card_format}>{format}</span>
                </div>
            </div>
        </div>
    );
};
