import React from "react";
import css from "../ui/styles.module.scss";
import { Button } from "@/shared/ui/buttons";
import { RootLink } from "@/shared/ui/links/root-link";
import { CustomLangSwitcher } from "../components/custom-lang-switcher/CustomLang";
import { clientRoutes } from "@/shared/routes/client";
import { useRouter, useParams } from "next/navigation";

export const Step1: React.FC = () => {
    const router = useRouter();
    const params = useParams();
    const locale = (params?.locale as string) || "en";

    return (
        <div className={css.home_new_visitor_content}>
            <div className={css.home_new_visitor_steps}>
                <span>Step</span>
                <div className={css.home_new_visitor_steps_number}>
                    <span>1</span>
                    <span>/</span>
                    <span>5</span>
                </div>
            </div>
            <h2 className={css.home_new_visitor_title}>
                World Crokinole Rankings
            </h2>
            <p className={css.home_new_visitor_description}>
                One world. One board. United by play.
            </p>
            <CustomLangSwitcher />
            <Button
                buttonType="white"
                className={css.home_new_visitor_continue_button}
                onClick={() =>
                    router.push(`/${locale}${clientRoutes.steps(2)}`)
                }
            >
                Continue
            </Button>
            <p className={css.home_new_visitor_sign_in}>
                Already have an account?{" "}
                <RootLink
                    href="#"
                    className={css.home_new_visitor_sign_in_link}
                >
                    Sign in
                </RootLink>
            </p>
        </div>
    );
};
