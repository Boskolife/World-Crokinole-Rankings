import React, { useState } from "react";
import css from "../ui/styles.module.scss";
import { AuthSwitcher } from "../components/auth-switcher/AuthSwitcher";
import { SignUpForm } from "../components/forms/signUpForm";
import { SignInForm } from "../components/forms/signInForm";

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
            <AuthSwitcher value={mode} onChange={setMode} />
            <div className={css.home_new_visitor_form}>
                {mode === "signUp" ? <SignUpForm /> : <SignInForm />}
            </div>
        </div>
    );
};
