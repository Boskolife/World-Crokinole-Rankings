"use client";

import React from "react";
import { HomeNewVisitor } from "@/widgets/home-new-visitor";
import stepCss from "@/widgets/home-new-visitor/ui/styles.module.scss";
import { SignUpForm } from "@/widgets/home-new-visitor/components/forms/signUpForm";

export default function SignUpPage() {
    return (
        <HomeNewVisitor>
            <div className={stepCss.home_new_visitor_content}>
                <h2 className={stepCss.home_new_visitor_title}>Sign Up</h2>
                <div className={stepCss.home_new_visitor_form}>
                    <SignUpForm />
                </div>
            </div>
        </HomeNewVisitor>
    );
}




