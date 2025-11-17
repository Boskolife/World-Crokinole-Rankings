"use client";

import React, { useState, useRef, useEffect } from "react";
import { useParams } from "next/navigation";
import { usePathname, useRouter } from "@/app/localization/routing";
import { localeConfig } from "@/app/localization/config";
import css from "./styles.module.scss";
import { Icon } from "@/shared/ui/icons";
import cn from "classnames";

interface LanguageSwitcherProps {
    className?: string;
}

export const LanguageSwitcher: React.FC<LanguageSwitcherProps> = ({
    className,
}) => {
    const params = useParams();
    const router = useRouter();
    const pathname = usePathname();
    const [isOpen, setIsOpen] = useState(false);
    const [isClosing, setIsClosing] = useState(false);
    const dropdownRef = useRef<HTMLDivElement>(null);
    const timeoutRef = useRef<NodeJS.Timeout | null>(null);

    // Получаем локаль из URL параметров
    const locale = (params?.locale as string) || (localeConfig.defaultLocale as string);

    const handleClose = () => {
        setIsClosing(true);
        if (timeoutRef.current) {
            clearTimeout(timeoutRef.current);
        }
        timeoutRef.current = setTimeout(() => {
            setIsOpen(false);
            setIsClosing(false);
        }, 300); // Длительность анимации закрытия
    };

    const handleToggle = () => {
        if (isOpen) {
            handleClose();
        } else {
            if (timeoutRef.current) {
                clearTimeout(timeoutRef.current);
            }
            setIsClosing(false);
            setIsOpen(true);
        }
    };

    const handleLocaleChange = (newLocale: string) => {
        // Получаем путь без локали
        const pathWithoutLocale = pathname.replace(`/${locale}`, "") || "/";
        router.replace(pathWithoutLocale, { locale: newLocale });
        handleClose();
    };

    useEffect(() => {
        const handleClickOutside = (event: MouseEvent) => {
            if (
                dropdownRef.current &&
                !dropdownRef.current.contains(event.target as Node)
            ) {
                if (isOpen) {
                    handleClose();
                }
            }
        };

        if (isOpen) {
            document.addEventListener("mousedown", handleClickOutside);
        }

        return () => {
            document.removeEventListener("mousedown", handleClickOutside);
            if (timeoutRef.current) {
                clearTimeout(timeoutRef.current);
            }
        };
    }, [isOpen]);

    const currentLocale = locale || "en";

    return (
        <div className={cn(css.dropdown, className)} ref={dropdownRef}>
            <button
                className={css.dropdown_button}
                onClick={handleToggle}
                aria-expanded={isOpen}
                aria-haspopup="true"
                type="button"
            >
                <span className={css.dropdown_button_text}>
                    {currentLocale.toUpperCase()}
                </span>
                <Icon name="chevron_down" className={css.dropdown_arrow} />
            </button>
            {isOpen && (
                <ul
                    className={`${css.dropdown_list} ${
                        isClosing ? css.dropdown_list_closing : ""
                    }`}
                >
                    {localeConfig.locales.map((loc) => (
                        <li key={loc}>
                            <button
                                className={`${css.dropdown_item} ${
                                    locale === loc
                                        ? css.dropdown_item_active
                                        : ""
                                }`}
                                onClick={() => handleLocaleChange(loc)}
                            >
                                {loc.toUpperCase()}
                            </button>
                        </li>
                    ))}
                </ul>
            )}
        </div>
    );
};
