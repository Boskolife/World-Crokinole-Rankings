"use client";
import React from "react";
import css from "./styles.module.scss";
import { Icon } from "@/shared/ui/icons";
import { icons } from "@/shared/ui/icons/icons";
import { RootLink } from "@/shared/ui";
import navigationItems from "@/data/navigation.json";

export const Navigation: React.FC = () => {
    return (
        <div className={css.navigation}>
            <div className="container">
                <h2 className={css.navigation_title}>Navigation</h2>
                <div className={css.navigation_content}>
                    {navigationItems.navigation.map((item, index) => (
                        <RootLink
                            href={`/${item.href}`}
                            className={css.navigation_content_item}
                            key={index}
                        >
                            <Icon
                                name={item.icon as keyof typeof icons}
                                className={css.navigation_content_item_icon}
                            />
                            <div className={css.navigation_content_item_text}>
                                <b>{item.title}</b>
                                <span>{item.description}</span>
                            </div>
                        </RootLink>
                    ))}
                </div>
            </div>
        </div>
    );
};
