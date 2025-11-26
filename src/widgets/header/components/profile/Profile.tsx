import React from "react";
import css from "./styles.module.scss";
import Image from "next/image";
import { Icon } from "@/shared/ui/icons";
import { RootLink } from "@/shared/ui/links/root-link";
import cn from "classnames";
import { useProfileDropdown } from "@/shared/hooks";
import { clientRoutes } from "@/shared/routes/client";
import { useRouter } from "next/navigation";

export const Profile: React.FC = () => {
    const { isDropdownOpen, isClosing, dropdownRef, handleDropdownOpen } =
        useProfileDropdown();
    const router = useRouter();
    const handleProfileClick = (event: React.MouseEvent<HTMLAnchorElement>) => {
        event.preventDefault();
        event.stopPropagation();
        router.push(clientRoutes.profile);
    };
    return (
        <div className={css.profile} ref={dropdownRef}>
            <div className={css.profile_info}>
                <h3 className={css.profile_info_name}>John Smith</h3>
                <p className={css.profile_info_status}>Player</p>
            </div>
            <button
                type="button"
                className={css.profile_avatar}
                onClick={handleDropdownOpen}
                aria-expanded={isDropdownOpen}
                aria-label={
                    isDropdownOpen ? "Close profile menu" : "Open profile menu"
                }
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
                    <div className={css.profile_dropdown_info}>
                        <div className={css.profile_dropdown_info_avatar}>
                            <Image
                                className={
                                    css.profile_dropdown_info_avatar_image
                                }
                                src="/images/profile-placeholder.png"
                                alt="avatar"
                                width={44}
                                height={44}
                            />
                        </div>
                        <div className={css.profile_dropdown_info_name}>
                            <span
                                className={css.profile_dropdown_info_name_text}
                            >
                                John Smith
                            </span>
                            <RootLink
                                href="#"
                                onClick={(event) => handleProfileClick(event)}
                                className={css.profile_dropdown_info_name_link}
                            >
                                View profile
                            </RootLink>
                        </div>
                    </div>
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
