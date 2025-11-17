import { useEffect, useRef, useState } from "react";
import { localeConfig, localeNames } from "@/app/localization/config";
import type { Locale } from "@/app/localization/config";
import { usePathname, useRouter } from "@/app/localization/routing";
import { useParams } from "next/navigation";

export const useLanguageSwitcher = () => {
    const [isOpen, setIsOpen] = useState(false);
    const [isClosing, setIsClosing] = useState(false);
    const [selectedLabel, setSelectedLabel] = useState<string | null>(null);
    const dropdownRef = useRef<HTMLDivElement>(null);
    const closeTimeoutRef = useRef<NodeJS.Timeout | null>(null);
    const router = useRouter();
    const pathname = usePathname();
    const params = useParams();
    const currentLocale = (params?.locale as string) || (localeConfig.defaultLocale as string);

    const handleClose = () => {
        setIsClosing(true);
        if (closeTimeoutRef.current) clearTimeout(closeTimeoutRef.current);
        closeTimeoutRef.current = setTimeout(() => {
            setIsOpen(false);
            setIsClosing(false);
        }, 250);
    };

    const toggleOpen = () => {
        if (isOpen) {
            handleClose();
        } else {
            if (closeTimeoutRef.current) clearTimeout(closeTimeoutRef.current);
            setIsClosing(false);
            setIsOpen(true);
        }
    };

    const handleSelect = (loc: Locale) => {
        const pathWithoutLocale = pathname.replace(`/${currentLocale}`, "") || "/";
        router.replace(pathWithoutLocale, { locale: loc });
        setSelectedLabel(localeNames[loc] || loc.toUpperCase());
        handleClose();
    };

    useEffect(() => {
        const onDocClick = (e: MouseEvent) => {
            if (dropdownRef.current && !dropdownRef.current.contains(e.target as Node)) {
                if (isOpen) handleClose();
            }
        };
        if (isOpen) {
            document.addEventListener("mousedown", onDocClick);
        }
        return () => {
            document.removeEventListener("mousedown", onDocClick);
            if (closeTimeoutRef.current) clearTimeout(closeTimeoutRef.current);
        };
    }, [isOpen]);

    return {
        // state
        isOpen,
        isClosing,
        selectedLabel,
        currentLocale,
        // refs
        dropdownRef,
        // actions
        toggleOpen,
        handleClose,
        handleSelect,
        // data
        locales: localeConfig.locales,
        localeNames,
    };
};


