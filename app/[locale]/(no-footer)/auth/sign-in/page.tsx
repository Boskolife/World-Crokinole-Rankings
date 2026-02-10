"use client";

import React from "react";
import { HomeNewVisitor } from "@/widgets/home-new-visitor";
import stepCss from "@/widgets/home-new-visitor/ui/styles.module.scss";
import { SignInForm } from "@/widgets/home-new-visitor/components/forms/signInForm";

export default function SignInPage() {
    return (
        <HomeNewVisitor>
            <div className={stepCss.home_new_visitor_content}>
                <h2 className={stepCss.home_new_visitor_title}>Sign In</h2>
                <div className={stepCss.home_new_visitor_form}>
                    <SignInForm />
                </div>
            </div>
        </HomeNewVisitor>
    );
}




