import React from "react";
import css from "./styles.module.scss";
import Image from "next/image";
import { Icon } from "@/shared/ui/icons";
import { RootLink } from "@/shared/ui/links/root-link";
import cn from "classnames";
import { useAuth, useProfileDropdown, useUserProfile } from "@/shared/hooks";
import { clientRoutes } from "@/shared/routes/client";
import { useParams, useRouter } from "next/navigation";
import { localeConfig } from "@/app/localization/config";

export const Profile: React.FC = () => {
    const { isDropdownOpen, isClosing, dropdownRef, handleDropdownOpen } =
        useProfileDropdown();
    const { logout } = useAuth();
    const { fullName, profile } = useUserProfile();
    const avatarSrc = profile?.avatar_url?.trim() || "/svg/avatar-placeholder.svg";
    const router = useRouter();
    const params = useParams() as { locale?: string };
    const locale = params?.locale || (localeConfig.defaultLocale as string);
    const handleProfileClick = (event: React.MouseEvent<HTMLAnchorElement>) => {
        event.preventDefault();
        event.stopPropagation();
        router.push(`/${locale}${clientRoutes.profile}`);
    };
    return (
        <div className={css.profile} ref={dropdownRef}>
            <div className={css.profile_info}>
                <h3 className={css.profile_info_name}>{fullName}</h3>
                <div className={css.profile_info_status_wrapper}>
                    <p className={css.profile_info_status}>Player</p>
                </div>
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
                    src={avatarSrc}
                    alt="avatar"
                    width={44}
                    height={44}
                    unoptimized={avatarSrc.includes("supabase.co")}
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
                                src={avatarSrc}
                                alt="avatar"
                                width={44}
                                height={44}
                                unoptimized={avatarSrc.includes("supabase.co")}
                            />
                        </div>
                        <div className={css.profile_dropdown_info_name}>
                            <span
                                className={css.profile_dropdown_info_name_text}
                            >
                                {fullName}
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
                            href={`/${locale}${clientRoutes.profile}`}
                            className={css.profile_dropdown_menu_item}
                        >
                            <Icon
                                name="settings"
                                className={css.profile_dropdown_menu_icon}
                            />
                            <span>Account settings</span>
                        </RootLink>
                        <RootLink
                            href={`/${locale}${clientRoutes.membershipPlans}`}
                            className={css.profile_dropdown_menu_item}
                        >
                            <Icon
                                name="coins"
                                className={css.profile_dropdown_menu_icon}
                            />
                            <span>Manage subscription</span>
                        </RootLink>
                    </div>
                    <button
                        type="button"
                        className={css.profile_dropdown_menu_item}
                        onClick={async () => {
                            await logout();
                            router.push(`/${locale}${clientRoutes.home}`);
                        }}
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
