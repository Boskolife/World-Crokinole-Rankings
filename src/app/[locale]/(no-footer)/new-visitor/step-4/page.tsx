"use client";

import { HomeNewVisitor } from "@/widgets/home-new-visitor";
import { Step4 } from "@/widgets/home-new-visitor/Step-4";
import css from "./styles.module.scss";

export default function Page() {
    return (
        <>
            <HomeNewVisitor className={css.home_new_visitor_step_3}>
                <Step4 />
            </HomeNewVisitor>
        </>
    );
}
