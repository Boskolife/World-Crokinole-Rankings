"use client";
import React from "react";
import css from "./styles.module.scss";
import Image from "next/image";
import { Button, CustomButton } from "@/shared/ui/buttons";
import { RootLink } from "@/shared/ui";
import { useRouter } from "next/navigation";
import { clientRoutes } from "@/shared/routes/client";

export const SaveContinue: React.FC = () => {
    const router = useRouter();
    return (
        <div className={css.save_continue}>
            <div className="container">
                <div className={css.save_continue_content}>
                    <div className={css.save_continue_left}>
                        <div className={css.save_continue_left_profile}>
                            <Image
                                src="/images/profile-placeholder.png"
                                alt="Profile"
                                width={164}
                                height={164}
                                className={css.save_continue_left_profile_image}
                            />
                            <div
                                className={css.save_continue_left_profile_info}
                            >
                                <h4
                                    className={
                                        css.save_continue_left_profile_name
                                    }
                                >
                                    John Smith
                                </h4>
                                <span
                                    className={
                                        css.save_continue_left_profile_role
                                    }
                                >
                                    👑 King of Pennsylvania
                                </span>
                            </div>
                        </div>
                        <div className={css.save_continue_left_buttons}>
                            <Button
                                buttonType="primary"
                                className={css.save_continue_left_button}
                            >
                                Edit profile
                            </Button>
                            <Button
                                buttonType="primary"
                                className={css.save_continue_left_button}
                            >
                                Claim history
                            </Button>
                        </div>
                    </div>
                    <div className={css.save_continue_right}>
                        <div className={css.save_continue_right_header}>
                            <p className={css.save_continue_right_header_email}>
                                <b>Email:</b>
                                <span>johnsmith.business@gmail.com</span>
                            </p>
                            <RootLink
                                href="#"
                                className={css.save_continue_right_header_link}
                            >
                                Change email or password
                            </RootLink>
                        </div>
                        <div className={css.save_continue_right_info}>
                            <div className={css.save_continue_right_info_item}>
                                <span
                                    className={
                                        css.save_continue_right_info_item_label
                                    }
                                >
                                    Singles Rating
                                </span>
                                <p
                                    className={
                                        css.save_continue_right_info_item_value
                                    }
                                >
                                    1420
                                </p>
                            </div>
                            <div className={css.save_continue_right_info_item}>
                                <span
                                    className={
                                        css.save_continue_right_info_item_label
                                    }
                                >
                                    Laurels (24 mo)
                                </span>
                                <p
                                    className={
                                        css.save_continue_right_info_item_value
                                    }
                                >
                                    1280
                                </p>
                            </div>
                            <div className={css.save_continue_right_info_item}>
                                <span
                                    className={
                                        css.save_continue_right_info_item_label
                                    }
                                >
                                    Doubles Rating
                                </span>
                                <p
                                    className={
                                        css.save_continue_right_info_item_value
                                    }
                                >
                                    1240
                                </p>
                            </div>
                            <div className={css.save_continue_right_info_item}>
                                <span
                                    className={
                                        css.save_continue_right_info_item_label
                                    }
                                >
                                    Club
                                </span>
                                <p
                                    className={
                                        css.save_continue_right_info_item_value
                                    }
                                >
                                    Pittsburgh Crokinole Club
                                </p>
                            </div>
                            <div className={css.save_continue_right_info_item}>
                                <span
                                    className={
                                        css.save_continue_right_info_item_label
                                    }
                                >
                                    Kingdom
                                </span>
                                <p
                                    className={
                                        css.save_continue_right_info_item_value
                                    }
                                >
                                    Pennsylvania
                                </p>
                            </div>
                        </div>
                    </div>
                </div>
                <CustomButton
                    className={css.save_continue_button}
                    onClick={() => router.push(clientRoutes.home)}
                >
                    Go to Dashboard
                </CustomButton>
            </div>
        </div>
    );
};
