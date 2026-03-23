import Image from "next/image";
import { notFound } from "next/navigation";
import { getNewsById } from "@/shared/supabase/data";
import { RootLink } from "@/shared/ui";
import css from "./styles.module.scss";

type Props = {
    params: Promise<{ id: string }>;
};

export default async function NewsDetailPage({ params }: Props) {
    const { id } = await params;
    const newsId = Number(id);
    if (!Number.isFinite(newsId)) notFound();

    const news = await getNewsById(newsId);
    if (!news) notFound();

    const createdAt = news.createdAt
        ? new Date(news.createdAt).toLocaleDateString()
        : "";

    return (
        <section className={css.page}>
            <div className={css.container}>
                <RootLink href="/" className={css.backLink}>
                    Back
                </RootLink>
                <h1 className={css.title}>{news.title}</h1>
                {createdAt ? <div className={css.meta}>{createdAt}</div> : null}
                {news.image ? (
                    <div className={css.imageWrap}>
                        <Image
                            src={news.image}
                            alt={news.title}
                            width={1200}
                            height={700}
                            className={css.image}
                        />
                    </div>
                ) : null}
                <div
                    className={css.description}
                    dangerouslySetInnerHTML={{ __html: news.description }}
                />
            </div>
        </section>
    );
}
