import { useState, useEffect, useRef, useCallback } from "react";
import { useTranslations } from "next-intl";
import { clientRoutes } from "../routes/client";
import { useRouter, usePathname } from "next/navigation";

export const useProfileDropdown = () => {
    const [isDropdownOpen, setIsDropdownOpen] = useState(false);
    const [isClosing, setIsClosing] = useState(false);
    const dropdownRef = useRef<HTMLDivElement>(null);
    const closeTimeoutRef = useRef<NodeJS.Timeout | null>(null);

    const handleDropdownClose = useCallback(() => {
        setIsClosing(true);
        if (closeTimeoutRef.current) clearTimeout(closeTimeoutRef.current);
        closeTimeoutRef.current = setTimeout(() => {
            setIsDropdownOpen(false);
            setIsClosing(false);
        }, 250);
    }, []);

    const handleDropdownOpen = useCallback(() => {
        if (isDropdownOpen) {
            handleDropdownClose();
        } else {
            if (closeTimeoutRef.current) clearTimeout(closeTimeoutRef.current);
            setIsClosing(false);
            setIsDropdownOpen(true);
        }
    }, [isDropdownOpen, handleDropdownClose]);

    useEffect(() => {
        const handleClickOutside = (event: MouseEvent) => {
            if (
                dropdownRef.current &&
                !dropdownRef.current.contains(event.target as Node)
            ) {
                if (isDropdownOpen) {
                    handleDropdownClose();
                }
            }
        };

        if (isDropdownOpen) {
            document.addEventListener("mousedown", handleClickOutside);
        }

        return () => {
            document.removeEventListener("mousedown", handleClickOutside);
            if (closeTimeoutRef.current) {
                clearTimeout(closeTimeoutRef.current);
            }
        };
    }, [isDropdownOpen, handleDropdownClose]);

    return {
        isDropdownOpen,
        isClosing,
        dropdownRef,
        handleDropdownOpen,
        handleDropdownClose,
    };
};

export const useNotificationDropdown = () => {
    const [isDropdownOpen, setIsDropdownOpen] = useState(false);
    const [isClosing, setIsClosing] = useState(false);
    const dropdownRef = useRef<HTMLDivElement>(null);
    const closeTimeoutRef = useRef<NodeJS.Timeout | null>(null);

    const handleDropdownClose = useCallback(() => {
        setIsClosing(true);
        if (closeTimeoutRef.current) clearTimeout(closeTimeoutRef.current);
        closeTimeoutRef.current = setTimeout(() => {
            setIsDropdownOpen(false);
            setIsClosing(false);
        }, 250);
    }, []);

    const handleDropdownOpen = useCallback(() => {
        if (isDropdownOpen) {
            handleDropdownClose();
        } else {
            if (closeTimeoutRef.current) clearTimeout(closeTimeoutRef.current);
            setIsClosing(false);
            setIsDropdownOpen(true);
        }
    }, [isDropdownOpen, handleDropdownClose]);

    useEffect(() => {
        const handleClickOutside = (event: MouseEvent) => {
            if (
                dropdownRef.current &&
                !dropdownRef.current.contains(event.target as Node)
            ) {
                if (isDropdownOpen) {
                    handleDropdownClose();
                }
            }
        };

        if (isDropdownOpen) {
            document.addEventListener("mousedown", handleClickOutside);
        }

        return () => {
            document.removeEventListener("mousedown", handleClickOutside);
            if (closeTimeoutRef.current) {
                clearTimeout(closeTimeoutRef.current);
            }
        };
    }, [isDropdownOpen, handleDropdownClose]);

    return {
        isDropdownOpen,
        isClosing,
        dropdownRef,
        handleDropdownOpen,
        handleDropdownClose,
    };
};

export const useHeader = () => {
    const router = useRouter();
    const pathname = usePathname();
    const tNavigation = useTranslations("navigation");
    const tAuth = useTranslations("auth");
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

    const scrollToRankings = () => {
        const rankingsElement = document.getElementById("rankings");
        if (rankingsElement) {
            const scrollTarget =
                rankingsElement.getBoundingClientRect().top + window.scrollY;
            window.scrollTo({
                top: scrollTarget,
                behavior: "smooth",
            });
            return true;
        }
        return false;
    };

    const handleRankingsClick = () => {
        // Убираем локаль из pathname для сравнения (формат: /en/, /ru/, /fr/ и т.д.)
        const pathWithoutLocale = pathname.replace(/^\/[a-z]{2}(\/|$)/, "/") || "/";
        const isOnHomePage = pathWithoutLocale === "/" || pathWithoutLocale === clientRoutes.home;

        if (isOnHomePage) {
            // Если уже на главной странице, просто прокручиваем
            scrollToRankings();
        } else {
            // Если не на главной, переходим на главную
            router.push(clientRoutes.home);
            // Ждем загрузки страницы и наличия элемента перед прокруткой
            let attempts = 0;
            const maxAttempts = 20; // Максимум 20 попыток (1 секунда)
            const checkAndScroll = () => {
                if (scrollToRankings() || attempts >= maxAttempts) {
                    return;
                }
                attempts++;
                // Если элемент еще не загружен, проверяем снова через небольшой интервал
                setTimeout(checkAndScroll, 50);
            };
            // Начинаем проверку после небольшой задержки для начала рендера
            setTimeout(checkAndScroll, 100);
        }
    };

    const navMenuItems = [
        {
            href: clientRoutes.home,
            onClick: handleRankingsClick,
            label: tNavigation("rankings"),
        },
        {
            href: clientRoutes.events,
            onClick: () => router.push(clientRoutes.events),
            label: tNavigation("events"),
        },
        {
            href: clientRoutes.clubs,
            onClick: () => router.push(clientRoutes.clubs),
            label: tNavigation("clubs"),
        },
        {
            href: clientRoutes.players,
            onClick: () => router.push(clientRoutes.players),
            label: tNavigation("players"),
        },
        {
            onClick: () => router.push(clientRoutes.membershipPlans),
            href: clientRoutes.membershipPlans,
            label: tNavigation("membershipPlans"),
        },
    ];

    return {
        isMenuOpen,
        handleToggleMenu,
        headerHeight,
        navMenuItems,
        tAuth,
    };
};
