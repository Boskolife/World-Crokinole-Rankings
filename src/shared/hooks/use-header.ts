import { useState, useEffect, useRef, useCallback } from "react";
import { useTranslations } from "next-intl";
import { clientRoutes } from "../routes/client";
import { useRouter } from "next/navigation";

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

    const navMenuItems = [
        {
            href: "#",
            label: tNavigation("rankings"),
        },
        {
            href: clientRoutes.events,
            onClick: () => router.push(clientRoutes.events),
            label: tNavigation("events"),
        },
        {
            href: "#",
            label: tNavigation("clubs"),
        },
        {
            href: "#",
            label: tNavigation("players"),
        },
        {
            href: "#",
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
