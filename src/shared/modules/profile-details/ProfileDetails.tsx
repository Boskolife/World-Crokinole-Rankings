"use client";
import React from "react";
import css from "./styles.module.scss";
import Image from "next/image";
import { Button } from "@/shared/ui/buttons";
import { RootLink } from "@/shared/ui";

export const ProfileDetails: React.FC = () => {
    return (
        <div className={css.profile_details_content}>
            <div className={css.profile_details_left}>
                <div className={css.profile_details_left_profile}>
                    <Image
                        src="/images/profile-placeholder.png"
                        alt="Profile"
                        width={164}
                        height={164}
                        className={css.profile_details_left_profile_image}
                    />
                    <div className={css.profile_details_left_profile_info}>
                        <h4 className={css.profile_details_left_profile_name}>
                            John Smith
                        </h4>
                        <span className={css.profile_details_left_profile_role}>
                            👑 King of Pennsylvania
                        </span>
                    </div>
                </div>
                <div className={css.profile_details_left_buttons}>
                    <Button
                        buttonType="primary"
                        className={css.profile_details_left_button}
                    >
                        Edit profile
                    </Button>
                    <Button
                        buttonType="primary"
                        className={css.profile_details_left_button}
                    >
                        Claim history
                    </Button>
                </div>
            </div>
            <div className={css.profile_details_right}>
                <div className={css.profile_details_right_header}>
                    <p className={css.profile_details_right_header_email}>
                        <b>Email:</b>
                        <span>johnsmith.business@gmail.com</span>
                    </p>
                    <RootLink
                        href="#"
                        className={css.profile_details_right_header_link}
                    >
                        Change email or password
                    </RootLink>
                </div>
                <div className={css.profile_details_right_info}>
                    <div className={css.profile_details_right_info_item}>
                        <span className={css.profile_details_right_info_item_label}>
                            Singles Rating
                        </span>
                        <p className={css.profile_details_right_info_item_value}>
                            1420
                        </p>
                    </div>
                    <div className={css.profile_details_right_info_item}>
                        <span className={css.profile_details_right_info_item_label}>
                            Laurels (24 mo)
                        </span>
                        <p className={css.profile_details_right_info_item_value}>
                            1280
                        </p>
                    </div>
                    <div className={css.profile_details_right_info_item}>
                        <span className={css.profile_details_right_info_item_label}>
                            Doubles Rating
                        </span>
                        <p className={css.profile_details_right_info_item_value}>
                            1240
                        </p>
                    </div>
                    <div className={css.profile_details_right_info_item}>
                        <span className={css.profile_details_right_info_item_label}>
                            Club
                        </span>
                        <p className={css.profile_details_right_info_item_value}>
                            Pittsburgh Crokinole Club
                        </p>
                    </div>
                    <div className={css.profile_details_right_info_item}>
                        <span className={css.profile_details_right_info_item_label}>
                            Kingdom
                        </span>
                        <p className={css.profile_details_right_info_item_value}>
                            Pennsylvania
                        </p>
                    </div>
                </div>
            </div>
        </div>
    );
};

