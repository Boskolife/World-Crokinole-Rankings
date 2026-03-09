import React from "react";
import css from "./styles.module.scss";
import badgesList from "@/data/badges.json";
import cn from "classnames";
import type { IPlayer } from "@/shared/types/player.interface";

const defaultBadges = badgesList.badges as Array<{ id: number; name: string; status: string }>;

function parsePlayerTitles(player: IPlayer | null | undefined): Array<{ id: number; name: string; status: string }> {
    if (!player) return [];
    const items: string[] = [];
    for (const raw of [player.title, player.clubTitle]) {
        const s = (raw ?? "").replace(/^[\s,]+|[\s,]+$/g, "").trim();
        if (s) items.push(s);
    }
    return items.map((name, i) => ({
        id: i + 1,
        name: name.startsWith("👑") || name.startsWith("⭐") || name.startsWith("🛡") ? name : `👑 ${name}`,
        status: "Active",
    }));
}

interface BadgesProps {
    player?: IPlayer | null;
}

export const Badges: React.FC<BadgesProps> = ({ player }) => {
    const badges = player ? parsePlayerTitles(player) : defaultBadges;

    if (badges.length === 0) return null;

    return (
        <div className={css.badges}>
            <div className="container">
                <h3 className={css.badges_title}>Titles (badges)</h3>
                <div className={css.badges_list}>
                    {badges.map((badge) => (
                            <div
                                className={cn(css.badges_item, {
                                    [css.badges_item_archive]:
                                        badge.status === "archive" || badge.status === "Archive",
                                })}
                                key={badge.id}
                            >
                                <span className={css.badges_item_text}>
                                    {badge.name}
                                </span>
                                <span className={css.badges_item_status}>
                                    {badge.status}
                                </span>
                            </div>
                        ))}
                </div>
            </div>
        </div>
    );
};
