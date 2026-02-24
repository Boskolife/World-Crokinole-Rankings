"use client";

import { HomeNewVisitor } from "@/widgets/home-new-visitor";
import { Step4 } from "@/widgets/home-new-visitor/Step-4";
import css from "./styles.module.scss";
import { CompleteProfile } from "@/widgets/home-new-visitor/complete-profile/CompleteProfile";

export default function Page() {
    return (
        <>
            <HomeNewVisitor className={css.height_auto}>
                <Step4 />
            </HomeNewVisitor>
            <CompleteProfile credentialsReadOnly />
        </>
    );
}
