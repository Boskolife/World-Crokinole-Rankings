import { useState } from "react";

export const useAuth = () => {
    const [isAuth, setIsAuth] = useState(false);

    const login = () => {
        setIsAuth(true);
        localStorage.setItem("isAuth", "true");
    };

    const logout = () => {
        setIsAuth(false);
        localStorage.removeItem("isAuth");
    };

    return {
        isAuth,
        login,
        logout,
    };
};
