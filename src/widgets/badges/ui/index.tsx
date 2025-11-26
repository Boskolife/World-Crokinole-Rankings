import React from "react";
import css from "./styles.module.scss";
import badgesList from "@/data/badges.json";
import cn from "classnames";

const badges = badgesList.badges;

export const Badges: React.FC = () => {
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
