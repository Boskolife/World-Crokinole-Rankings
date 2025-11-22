import React from "react";
import css from "./styles.module.scss";
import Image from "next/image";
import { Icon } from "@/shared/ui/icons";
import { RootLink } from "@/shared/ui/links/root-link";
import cn from "classnames";
import { useProfileDropdown } from "@/shared/hooks";

export const Profile: React.FC = () => {
    const {
        isDropdownOpen,
        isClosing,
        dropdownRef,
        handleDropdownOpen,
    } = useProfileDropdown();

    return (
        <div className={css.profile} ref={dropdownRef}>
            <RootLink href="#" className={css.profile_info}>
                <h3 className={css.profile_info_name}>John Doe</h3>
                <p className={css.profile_info_status}>Player</p>
            </RootLink>
            <button
                type="button"
                className={css.profile_avatar}
                onClick={handleDropdownOpen}
                aria-expanded={isDropdownOpen}
            >
                <Image
                    className={css.profile_avatar_image}
                    src="/images/profile-placeholder.png"
                    alt="avatar"
                    width={44}
                    height={44}
                />
                <Icon
                    name="chevron_down"
                    className={cn(css.profile_avatar_icon, {
                        [css.profile_avatar_icon_open]: isDropdownOpen,
                    })}
                />
            </button>
            {isDropdownOpen && (
                <div
                    className={cn(css.profile_dropdown, {
                        [css.profile_dropdown_closing]: isClosing,
                    })}
                >
                <div className={css.profile_dropdown_menu}>
                    <RootLink
                        href="#"
                        className={css.profile_dropdown_menu_item}
                    >
                        <Icon
                            name="settings"
                            className={css.profile_dropdown_menu_icon}
                        />
                        <span>Account setting</span>
                    </RootLink>
                    <RootLink
                        href="#"
                        className={css.profile_dropdown_menu_item}
                    >
                        <Icon
                            name="plus"
                            className={css.profile_dropdown_menu_icon}
                        />
                        <span>Add account</span>
                    </RootLink>
                    <RootLink
                        href="#"
                        className={css.profile_dropdown_menu_item}
                    >
                        <Icon
                            name="coins"
                            className={css.profile_dropdown_menu_icon}
                        />
                        <span>Plans</span>
                    </RootLink>
                </div>
                <button
                    type="button"
                    className={css.profile_dropdown_menu_item}
                >
                    <Icon
                        name="log_in"
                        className={css.profile_dropdown_menu_icon}
                    />
                    <span>Logout</span>
                </button>
                </div>
            )}
        </div>
    );
};
