import React from "react";
import css from "./styles.module.scss";
import Image from "next/image";
import { RootLink } from "@/shared/ui";
import newsItems from "@/data/news.json";

export const News: React.FC = () => {
    return (
        <div className={css.news}>
            <div className="container">
                <h2 className={css.news_title}>What’s New</h2>
                <div className={css.news_content}>
                    {newsItems.news.map((item, index) => (
                        <div className={css.news_content_item} key={index}>
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
                                <p>{item.description}</p>
                            </div>
                            <RootLink
                                href={item.link}
                                className={css.news_content_item_link}
                            >
                                {item.linkText}
                            </RootLink>
                        </div>
                    ))}
                </div>
            </div>
        </div>
    );
};
