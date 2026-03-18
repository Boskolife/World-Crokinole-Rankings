import React from "react";
import { HomeNewVisitor } from "@/widgets/home-new-visitor";
import stepCss from "@/widgets/home-new-visitor/ui/styles.module.scss";
import { ForgotPasswordForm } from "@/widgets/home-new-visitor/components/forms/forgotPasswordForm";
import { Icon } from "@/shared/ui/icons";
import { RootLink } from "@/shared/ui";
import { clientRoutes } from "@/shared/routes/client";

export default function ForgotPasswordPage() {
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
                <ForgotPasswordForm />
            </div>
        </HomeNewVisitor>
    );
}

