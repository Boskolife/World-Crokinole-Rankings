import React, { useState } from "react";
import css from "./styles.module.scss";
import cn from "classnames";

type AuthMode = "signUp" | "signIn";

interface AuthSwitcherProps {
    value?: AuthMode;
    onChange?: (value: AuthMode) => void;
}

export const AuthSwitcher: React.FC<AuthSwitcherProps> = ({ value, onChange }) => {
    const [signUpActive, setSignUpActive] = useState(true);
    const isControlled = typeof value !== "undefined";
    const activeIsSignUp = isControlled ? value === "signUp" : signUpActive;

    const setMode = (mode: AuthMode) => {
        if (isControlled) {
            onChange?.(mode);
        } else {
            setSignUpActive(mode === "signUp");
        }
    };

    return (
        <div className={css.auth_switcher}>
            <button
                className={cn(css.auth_switcher_button, {
                    [css.active]: activeIsSignUp,
                })}
                type="button"
                onClick={() => setMode("signUp")}
            >
                <span>Sign up</span>
            </button>
            <button
                className={cn(css.auth_switcher_button, {
                    [css.active]: !activeIsSignUp,
                })}
                type="button"
                onClick={() => setMode("signIn")}
            >
                <span>Sign in</span>
            </button>
        </div>
    );
};
