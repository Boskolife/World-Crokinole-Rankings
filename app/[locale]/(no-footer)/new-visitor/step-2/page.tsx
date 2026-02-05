"use client";

import { Suspense } from "react";
import { HomeNewVisitor } from "@/widgets/home-new-visitor";
import { Step2 } from "@/widgets/home-new-visitor/Step-2";

export default function Page() {
    return (
        <HomeNewVisitor>
            <Suspense fallback={<div>Loading...</div>}>
                <Step2 />
            </Suspense>
        </HomeNewVisitor>
    );
}
