"use client";

import { HomeNewVisitor } from "@/widgets/home-new-visitor";
import { Step4 } from "@/widgets/home-new-visitor/Step-4";
import css from "./styles.module.scss";
import { MatchHistory } from "@/widgets/home-new-visitor/match-history/MatchHistory";

export default function Page() {
    return (
        <>
            <HomeNewVisitor className={css.height_auto}>
                <Step4 />
            </HomeNewVisitor>
            <MatchHistory />
        </>
    );
}
