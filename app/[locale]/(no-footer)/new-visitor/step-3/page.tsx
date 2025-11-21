"use client";

import { HomeNewVisitor } from "@/widgets/home-new-visitor";
import { Step3 } from "@/widgets/home-new-visitor/Step-3";
import { SubscribePlans } from "@/widgets/home-new-visitor/subscribe-plans/SubscribePlans";
import css from "./styles.module.scss";
export default function Page() {
    return (
        <>
            <HomeNewVisitor className={css.height_auto}>
                <Step3 />
            </HomeNewVisitor>
            <SubscribePlans />
        </>
    );
}
