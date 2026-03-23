import React from "react";
import css from "./styles.module.scss";
import Image from "next/image";
import { RootLink } from "@/shared/ui";
import type { INewsItem } from "@/shared/types";

interface NewsProps {
    items: INewsItem[];
    expectedItemsCount?: number;
}

export const News: React.FC<NewsProps> = ({ items, expectedItemsCount }) => {
    const placeholdersCount = Math.max(0, (expectedItemsCount ?? items.length) - items.length);

    return (
        <div className={css.news}>
            <div className="container">
                <h2 className={css.news_title}>What’s New</h2>
                <div className={css.news_content}>
                    {items.map((item) => (
                        <div className={css.news_content_item} key={item.id}>
                            <div className={css.news_content_item_image}>
                                <Image
                                    src={
                                        item.image ??
                                        "/images/news-placeholder.png"
                                    }
                                    alt={item.title}
                                    width={372}
                                    height={240}
                                />
                            </div>
                            <div className={css.news_content_item_text}>
                                <h3>{item.title}</h3>
                                <div
                                    className={css.news_content_item_description}
                                    dangerouslySetInnerHTML={{ __html: item.description }}
                                />
                            </div>
                            <RootLink
                                href={`/news/${item.id}`}
                                className={css.news_content_item_link}
                            >
                                {item.linkText}
                            </RootLink>
                        </div>
                    ))}
                    {Array.from({ length: placeholdersCount }).map((_, index) => (
                        <div
                            key={`placeholder-${index}`}
                            className={`${css.news_content_item} ${css.news_content_item_placeholder}`}
                            aria-hidden="true"
                        />
                    ))}
                </div>
            </div>
        </div>
    );
};
