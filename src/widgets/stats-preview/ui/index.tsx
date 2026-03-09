"use client";

import React, { useState, useEffect } from "react";
import css from "./styles.module.scss";
import cn from "classnames";
import Image from "next/image";
import { RootLink } from "@/shared/ui";
import { Icon } from "@/shared/ui/icons";
import { useUserProfile, useCurrentUserPlayer } from "@/shared/hooks";
import { clientRoutes } from "@/shared/routes/client";
import { getAllRankings } from "@/shared/supabase/data";
import type { IRankList } from "@/shared/types/rank-list.interface";

function findMyRanking(
    list: IRankList[],
    playerIds: (string | undefined)[]
): IRankList | null {
    const ids = playerIds.filter(Boolean) as string[];
    if (ids.length === 0) return null;
    return list.find((r) => r.playerId != null && ids.includes(r.playerId)) ?? null;
}

export const StatsPreview: React.FC = () => {
    const { fullName, profile } = useUserProfile();
    const { player } = useCurrentUserPlayer();
    const [rankings, setRankings] = useState<{
        laurels: IRankList | null;
        singles: IRankList | null;
        doubles: IRankList | null;
    }>({ laurels: null, singles: null, doubles: null });

    const kingdom = player?.kingdom || profile?.country || "-";
    const club = player?.club || profile?.club || "-";
    const displayName = fullName || player?.name || "—";
    const avatarSrc = player?.avatarUrl?.trim() || profile?.avatar_url?.trim() || "/svg/avatar-placeholder.svg";

    useEffect(() => {
        if (!player?.id) {
            setRankings({ laurels: null, singles: null, doubles: null });
            return;
        }
        const matchIds = [player.id, player.rowId].filter(Boolean);
        getAllRankings().then(({ laurels, singles, doubles }) => {
            setRankings({
                laurels: findMyRanking(laurels, matchIds) ?? null,
                singles: findMyRanking(singles, matchIds) ?? null,
                doubles: findMyRanking(doubles, matchIds) ?? null,
            });
        });
    }, [player?.id, player?.rowId]);

    const laurelsRank = rankings.laurels?.rank ?? "—";
    const laurelsScore = rankings.laurels?.laurels ?? "—";
    const singlesRank = rankings.singles?.rank ?? "—";
    const singlesRating = rankings.singles?.rating ?? player?.singlesRating ?? player?.rating ?? "—";
    const doublesRank = rankings.doubles?.rank ?? "—";
    const doublesRating = rankings.doubles?.rating ?? player?.doublesRating ?? "—";

    return (
        <section className={css.stats_preview}>
            <div className={cn(css.stats_preview_inner, "container")}>
                <h2 className={css.stats_preview_title}>My Stats Preview</h2>
                <div className={css.stats_preview_header}>
                    <div className={css.stats_preview_profile}>
                        <div className={css.stats_preview_avatar}>
                            <Image
                                className={css.stats_preview_avatar_img}
                                src={avatarSrc}
                                alt="Profile"
                                width={124}
                                height={124}
                                unoptimized={avatarSrc.includes("supabase.co")}
                            />
                        </div>
                        <div className={css.stats_preview_profile_info}>
                            <h3 className={css.stats_preview_profile_name}>
                                {displayName}
                            </h3>
                            <div className={css.stats_preview_profile_link}>
                                <RootLink
                                    href={clientRoutes.profile}
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
                            {kingdom === "-" ? "👑 King" : `👑 King of ${kingdom}`}
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
                                    <span>{String(laurelsRank)}</span>
                                </div>
                            </div>
                            <span className={css.stats_preview_rank_score}>
                                {String(laurelsScore)}
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
                                    {String(singlesRank)}
                                </span>
                            </div>
                            <div
                                className={
                                    css.stats_preview_content_item_body_value
                                }
                            >
                                <span>{String(singlesRating)}</span>
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
                                    {String(doublesRank)}
                                </span>
                            </div>
                            <div
                                className={
                                    css.stats_preview_content_item_body_value
                                }
                            >
                                <span>{String(doublesRating)}</span>
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
                                <span>{kingdom}</span>
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
                                <span>{club}</span>
                            </div>
                        </div>
                    </div>
                </div>
            </div>
        </section>
    );
};
