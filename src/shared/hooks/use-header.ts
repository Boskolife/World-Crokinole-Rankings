import { useState } from "react";
import { useEffect } from "react";

export const useHeader = () => {
    const [isMenuOpen, setIsMenuOpen] = useState(false);
    const [headerHeight, setHeaderHeight] = useState<number | null>(null);

    useEffect(() => {
        if (typeof document === "undefined") return;

        const updateHeaderHeight = () => {
            const header = document.querySelector(
                ".header"
            ) as HTMLElement | null;
            setHeaderHeight(header?.clientHeight ?? null);
        };

        updateHeaderHeight();
        window.addEventListener("resize", updateHeaderHeight);
        return () => window.removeEventListener("resize", updateHeaderHeight);
    }, []);

    useEffect(() => {
        if (typeof document === "undefined") return;

        const body = document.documentElement;

        if (isMenuOpen) {
            body.classList.add("no-scroll");
        } else {
            body.classList.remove("no-scroll");
        }

        return () => {
            body.classList.remove("no-scroll");
        };
    }, [isMenuOpen]);

    const handleToggleMenu = () => {
        setIsMenuOpen((prev) => !prev);
    };

    return {
        isMenuOpen,
        handleToggleMenu,
        headerHeight,
    };
};
