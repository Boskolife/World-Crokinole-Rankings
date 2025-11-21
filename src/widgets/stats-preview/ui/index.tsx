"use client";

import React from "react";
import css from "./styles.module.scss";
import cn from "classnames";
import Image from "next/image";
import { RootLink } from "@/shared/ui";
import { Icon } from "@/shared/ui/icons";

export const StatsPreview: React.FC = () => {
    return (
        <section className={css.stats_preview}>
            <div className={cn(css.stats_preview_inner, "container")}>
                <h2 className={css.stats_preview_title}>My Stats Preview</h2>
                <div className={css.stats_preview_header}>
                    <div className={css.stats_preview_profile}>
                        <div className={css.stats_preview_avatar}>
                            <Image
                                className={css.stats_preview_avatar_img}
                                src="/images/profile-placeholder.png"
                                alt="Profile"
                                width={124}
                                height={124}
                            />
                        </div>
                        <div className={css.stats_preview_profile_info}>
                            <h3 className={css.stats_preview_profile_name}>
                                John Smith
                            </h3>
                            <div className={css.stats_preview_profile_link}>
                                <RootLink
                                    href="/"
                                    className={
                                        css.stats_preview_profile_link_text
                                    }
                                >
                                    View full profile
                                </RootLink>
                            </div>
                        </div>
                    </div>
                    <div className={css.stats_preview_rank}>
                        <p className={css.stats_preview_rank_label}>
                            👑 King of Pennsylvania
                        </p>
                        <div className={css.stats_preview_rank_body}>
                            <Icon
                                name="laurels"
                                className={css.stats_preview_rank_body_icon}
                            />
                            <div className={css.stats_preview_rank_text}>
                                <span
                                    className={
                                        css.stats_preview_rank_text_label
                                    }
                                >
                                    Laurels
                                </span>
                                <div
                                    className={
                                        css.stats_preview_rank_text_value
                                    }
                                >
                                    <span>Rank</span>
                                    <span>55</span>
                                </div>
                            </div>
                            <span className={css.stats_preview_rank_score}>
                                1420
                            </span>
                        </div>
                    </div>
                </div>
                <div className={css.stats_preview_content}>
                    <div className={css.stats_preview_content_item}>
                        <div className={css.stats_preview_content_item_header}>
                            <Icon
                                name="single_player"
                                className={css.stats_preview_content_item_icon}
                            />
                            <span>Singles Rating</span>
                        </div>
                        <div className={css.stats_preview_content_item_body}>
                            <div
                                className={
                                    css.stats_preview_content_item_body_rank
                                }
                            >
                                <span
                                    className={
                                        css.stats_preview_content_item_body_rank_label
                                    }
                                >
                                    Rank
                                </span>
                                <span
                                    className={
                                        css.stats_preview_content_item_body_rank_value
                                    }
                                >
                                    55
                                </span>
                            </div>
                            <div
                                className={
                                    css.stats_preview_content_item_body_value
                                }
                            >
                                <span>1420</span>
                            </div>
                        </div>
                    </div>
                    <div className={css.stats_preview_content_item}>
                        <div className={css.stats_preview_content_item_header}>
                            <Icon
                                name="doubles_players"
                                className={css.stats_preview_content_item_icon}
                            />
                            <span>Doubles Rating</span>
                        </div>
                        <div className={css.stats_preview_content_item_body}>
                            <div
                                className={
                                    css.stats_preview_content_item_body_rank
                                }
                            >
                                <span
                                    className={
                                        css.stats_preview_content_item_body_rank_label
                                    }
                                >
                                    Rank
                                </span>
                                <span
                                    className={
                                        css.stats_preview_content_item_body_rank_value
                                    }
                                >
                                    23
                                </span>
                            </div>
                            <div
                                className={
                                    css.stats_preview_content_item_body_value
                                }
                            >
                                <span>1943</span>
                            </div>
                        </div>
                    </div>
                    <div className={css.stats_preview_content_item}>
                        <div className={css.stats_preview_content_item_header}>
                            <Icon
                                name="country"
                                className={css.stats_preview_content_item_icon}
                            />
                            <span>Kingdom (Country)</span>
                        </div>
                        <div className={css.stats_preview_content_item_body}>
                            <div
                                className={
                                    css.stats_preview_content_item_body_label
                                }
                            >
                                <span>USA, Pennsylvania</span>
                            </div>
                        </div>
                    </div>
                    <div className={css.stats_preview_content_item}>
                        <div className={css.stats_preview_content_item_header}>
                            <Icon
                                name="clubs"
                                className={css.stats_preview_content_item_icon}
                            />
                            <span>Club</span>
                        </div>
                        <div className={css.stats_preview_content_item_body}>
                            <div
                                className={
                                    css.stats_preview_content_item_body_label
                                }
                            >
                                <span>Pittsburgh Crokinole Club</span>
                            </div>
                        </div>
                    </div>
                </div>
            </div>
        </section>
    );
};
