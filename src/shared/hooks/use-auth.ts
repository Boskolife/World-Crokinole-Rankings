import { useState, useEffect } from "react";

export const useAuth = () => {
    const [isAuth, setIsAuth] = useState(false);
    const [isMounted, setIsMounted] = useState(false);

    useEffect(() => {
        if (typeof window !== "undefined") {
            const authStatus = localStorage.getItem("isAuth") === "true";
            // Синхронизация с localStorage после монтирования компонента
            setTimeout(() => {
                setIsMounted(true);
                setIsAuth(authStatus);
            }, 0);
        }
    }, []);

    const login = () => {
        setIsAuth(true);
        if (typeof window !== "undefined") {
            localStorage.setItem("isAuth", "true");
        }
    };

    const logout = () => {
        setIsAuth(false);
        if (typeof window !== "undefined") {
            localStorage.removeItem("isAuth");
        }
    };

    // На сервере всегда возвращаем false, на клиенте после монтирования - реальное значение
    return {
        isAuth: isMounted ? isAuth : false,
        login,
        logout,
    };
};
