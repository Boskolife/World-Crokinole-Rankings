import React from "react";
import css from "./styles.module.scss";
import { locales, localeNames } from "@/app/localization/config";
import { useLanguageSwitcher } from "../../hooks/useLanguageSwitcher";
import { Icon } from "@/shared/ui/icons";

export const CustomLangSwitcher: React.FC = () => {
    const {
        isOpen,
        isClosing,
        selectedLabel,
        currentLocale,
        dropdownRef,
        toggleOpen,
        handleSelect,
    } = useLanguageSwitcher();
    return (
        <div className={css.language_switcher} ref={dropdownRef}>
            <button
                className={css.language_switcher_button}
                onClick={toggleOpen}
                aria-haspopup="listbox"
                aria-expanded={isOpen}
                type="button"
            >
                <span>{selectedLabel || "Choose Your Language"}</span>
                <Icon name="chevron_down" />
            </button>
            {isOpen && (
                <ul
                    className={`${css.language_switcher_list} ${
                        isClosing ? css.language_switcher_list_closing : ""
                    }`}
                    role="listbox"
                    aria-label="Select language"
                >
                    {locales.map((loc) => (
                        <li key={loc}>
                            <button
                                className={css.language_switcher_item}
                                onClick={() => handleSelect(loc)}
                                role="option"
                                aria-selected={currentLocale === loc}
                                type="button"
                            >
                                {localeNames[loc] || loc.toUpperCase()}
                            </button>
                        </li>
                    ))}
                </ul>
            )}
        </div>
    );
};
