import React from "react";
import css from "./styles.module.scss";
import { Icon } from "@/shared/ui/icons";
import cn from "classnames";
import { useNotificationDropdown, useClubJoinRequestNotifications, type NotificationItem } from "@/shared/hooks";
import { useParams, useRouter } from "next/navigation";
import { clientRoutes } from "@/shared/routes/client";
import { localeConfig } from "@/app/localization/config";

export const Notification: React.FC = () => {
    const {
        isDropdownOpen,
        isClosing,
        dropdownRef,
        handleDropdownOpen,
        handleDropdownClose,
    } = useNotificationDropdown();
    const { items, unreadCount, isLoading, markAsRead, markAllAsRead } = useClubJoinRequestNotifications();
    const router = useRouter();
    const params = useParams() as { locale?: string };
    const locale = params?.locale ?? (localeConfig.defaultLocale as string);

    const handleNotificationClick = (clubId: number, item: NotificationItem) => {
        markAsRead(item);
        router.push(`/${locale}${clientRoutes.clubDetail(clubId)}`);
        handleDropdownClose();
    };

    return (
        <div className={css.notification} ref={dropdownRef}>
            <button
                type="button"
                className={css.notification_button}
                onClick={handleDropdownOpen}
                aria-expanded={isDropdownOpen}
                aria-label={isDropdownOpen ? "Close notifications" : "Open notifications"}
            >
                <Icon
                    name="bell_ring"
                    className={css.notification_button_icon}
                />
                {unreadCount > 0 && (
                    <span className={css.notification_button_count}>{unreadCount}</span>
                )}
            </button>
            {isDropdownOpen && (
                <div
                    className={cn(css.notification_dropdown, {
                        [css.notification_dropdown_closing]: isClosing,
                    })}
                >
                    <div className={css.notification_dropdown_header}>
                        <span>All notification</span>
                        {items.length > 0 && unreadCount > 0 && (
                            <button
                                type="button"
                                className={cn(css.notification_dropdown_button, css.notification_dropdown_button_unread)}
                                onClick={() => markAllAsRead()}
                            >
                                <span>Read all</span>
                            </button>
                        )}
                    </div>
                    <div className={css.notification_dropdown_content}>
                        {isLoading ? (
                            <div className={css.notification_dropdown_content_item}>
                                <p className={css.notification_dropdown_content_text}>Loading...</p>
                            </div>
                        ) : items.length === 0 ? (
                            <div className={css.notification_dropdown_content_item}>
                                <p className={css.notification_dropdown_content_text}>No new notifications</p>
                            </div>
                        ) : (
                            items.map((item) => (
                                <button
                                    type="button"
                                    className={css.notification_dropdown_content_item}
                                    key={item.type === "club_join_approved" ? `approved-${item.id}` : item.type === "club_invite" ? `invite-${item.id}` : `request-${item.clubId}`}
                                    onClick={() => handleNotificationClick(item.clubId, item)}
                                >
                                    <p className={css.notification_dropdown_content_text}>
                                        {item.type === "club_join_approved"
                                            ? `You were accepted to club «${item.clubTitle}»`
                                            : item.type === "club_invite"
                                              ? `You're invited to join club «${item.clubTitle}»`
                                              : item.count === 1
                                                ? `Join request for club «${item.clubTitle}»`
                                                : `${item.count} join requests for club «${item.clubTitle}»`}
                                    </p>
                                    <div className={css.notification_dropdown_content_date}>
                                        <span>{item.date}</span>
                                        {!item.isRead && (
                                            <div className={css.notification_dropdown_content_marker} />
                                        )}
                                    </div>
                                </button>
                            ))
                        )}
                    </div>
                </div>
            )}
        </div>
    );
};
