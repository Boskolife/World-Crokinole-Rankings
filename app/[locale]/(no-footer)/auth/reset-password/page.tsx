import React from "react";
import { HomeNewVisitor } from "@/widgets/home-new-visitor";
import stepCss from "@/widgets/home-new-visitor/ui/styles.module.scss";
import { ResetPasswordForm } from "@/widgets/home-new-visitor/components/forms/resetPasswordForm";
import { RootLink } from "@/shared/ui";
import { Icon } from "@/shared/ui/icons";
import { clientRoutes } from "@/shared/routes/client";

export default function ResetPasswordPage() {
    return (
        <HomeNewVisitor>
            <RootLink href={clientRoutes.signIn} className={stepCss.home_new_visitor_back_button}>
                <Icon
                    name="chevron_prev"
                    width={20}
                    height={20}
                    className={stepCss.home_new_visitor_back_button_icon}
                />
            </RootLink>
            <div className={stepCss.home_new_visitor_content}>
                <h2 className={stepCss.home_new_visitor_title}>Reset Password</h2>
                <p className={stepCss.home_new_visitor_description}>
                    Enter your new password below.
                </p>
                <div className={stepCss.home_new_visitor_form}>
                    <ResetPasswordForm />
                </div>
            </div>
        </HomeNewVisitor>
    );
}

