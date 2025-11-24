import React, { useState } from "react";
import css from "../ui/styles.module.scss";
import { SwitcherModule } from "@/shared/modules";
import { SignUpForm } from "../components/forms/signUpForm";
import { SignInForm } from "../components/forms/signInForm";

const switcherOptions = [
    { value: "signUp", label: "Sign Up" },
    { value: "signIn", label: "Sign In" },
];

export const Step2: React.FC = () => {
    const [mode, setMode] = useState<"signUp" | "signIn">("signUp");
    return (
        <div className={css.home_new_visitor_content}>
            <div className={css.home_new_visitor_steps}>
                <span>Step</span>
                <div className={css.home_new_visitor_steps_number}>
                    <span>2</span>
                    <span>/</span>
                    <span>5</span>
                </div>
            </div>
            <h2 className={css.home_new_visitor_title}>Sign Up / Login</h2>
            <SwitcherModule
                className={css.home_new_visitor_switcher}
                options={switcherOptions}
                value={mode}
                onChange={(value) => setMode(value as "signUp" | "signIn")}
            />
            <div className={css.home_new_visitor_form}>
                {mode === "signUp" ? <SignUpForm /> : <SignInForm />}
            </div>
        </div>
    );
};
