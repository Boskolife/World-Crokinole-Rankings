"use client";

import css from "./styles.module.scss";
import React from "react";
import Image from "next/image";
import cn from "classnames";
import { useHeader } from "@/shared/hooks/use-header";

interface HomeNewVisitorProps {
    children: React.ReactNode;
}

export const HomeNewVisitor: React.FC<HomeNewVisitorProps> = ({ children }) => {
    const { headerHeight } = useHeader();

    return (
        <section
            className={css.home_new_visitor}
            style={{ height: `calc(100dvh - ${headerHeight}px)` }}
        >
            <Image
                src="/images/hero-logo.png"
                alt="Background"
                width={380}
                height={380}
                className={css.home_new_visitor_logo}
            />
            <div className={cn(css.home_new_visitor_container, "container")}>
                {children}
            </div>
        </section>
    );
};
