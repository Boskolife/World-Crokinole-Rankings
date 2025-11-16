"use client";

import { Icon } from "@/shared/ui/icons";
import css from "./styles.module.scss";
import React from "react";
import { Button } from "@/shared/ui/buttons/button";
import { RootLink } from "@/shared/ui/links/root-link";
import Image from "next/image";
import cn from "classnames";
import { useHeader } from "@/shared/hooks/use-header";
import { useLanguageSwitcher } from "./hook/useLanguageSwitcher";

export const HomeNewVisitor: React.FC = () => {
    const { headerHeight } = useHeader();
    const {
        isOpen,
        isClosing,
        selectedLabel,
        currentLocale,
        dropdownRef,
        toggleOpen,
        handleSelect,
        locales,
        localeNames,
    } = useLanguageSwitcher();

    return (
        <section
            className={css.home_new_visitor}
            style={{ height: `calc(100dvh - ${headerHeight}px)` }}
        >
            <Image
                src="/images/hero-logo.png"
                alt="Background"
                width={380}
                height={380}
                className={css.home_new_visitor_logo}
            />
            <div className={cn(css.home_new_visitor_container, "container")}>
                <div className={css.home_new_visitor_content}>
                    <div className={css.home_new_visitor_steps}>
                        <span>Step</span>
                        <div className={css.home_new_visitor_steps_number}>
                            <span>1</span>
                            <span>/</span>
                            <span>5</span>
                        </div>
                    </div>
                    <h2 className={css.home_new_visitor_title}>
                        World Crokinole Rankings
                    </h2>
                    <p className={css.home_new_visitor_description}>
                        One world. One board. United by play.
                    </p>
                    <div
                        className={css.home_new_visitor_language_switcher}
                        ref={dropdownRef}
                    >
                        <button
                            className={
                                css.home_new_visitor_language_switcher_button
                            }
                            onClick={toggleOpen}
                            aria-haspopup="listbox"
                            aria-expanded={isOpen}
                            type="button"
                        >
                            <span>
                                {selectedLabel || "Choose Your Language"}
                            </span>
                            <Icon name="chevron_down" />
                        </button>
                        {isOpen && (
                            <ul
                                className={
                                    `${css.home_new_visitor_language_switcher_list} ${isClosing ? css.home_new_visitor_language_switcher_list_closing : ""}`
                                }
                                role="listbox"
                                aria-label="Select language"
                            >
                                {locales.map((loc) => (
                                    <li key={loc}>
                                        <button
                                            className={
                                                css.home_new_visitor_language_switcher_item
                                            }
                                            onClick={() => handleSelect(loc)}
                                            role="option"
                                            aria-selected={
                                                currentLocale === loc
                                            }
                                            type="button"
                                        >
                                            {localeNames[loc] ||
                                                loc.toUpperCase()}
                                        </button>
                                    </li>
                                ))}
                            </ul>
                        )}
                    </div>
                    <Button
                        buttonType="white"
                        className={css.home_new_visitor_continue_button}
                    >
                        Continue
                    </Button>
                    <p className={css.home_new_visitor_sign_in}>
                        Already have an account?{" "}
                        <RootLink
                            href="#"
                            className={css.home_new_visitor_sign_in_link}
                        >
                            Sign in
                        </RootLink>
                    </p>
                </div>
            </div>
        </section>
    );
};
