import React from "react";
import { HomeNewVisitor } from "@/widgets/home-new-visitor";
import { ResetPasswordForm } from "@/widgets/home-new-visitor/components/forms/resetPasswordForm";
import stepCss from "@/widgets/home-new-visitor/ui/styles.module.scss";

export default function ResetPasswordPage() {
    return (
        <HomeNewVisitor>
            <div className={stepCss.home_new_visitor_content}>
                <ResetPasswordForm />
            </div>
        </HomeNewVisitor>
    );
}

