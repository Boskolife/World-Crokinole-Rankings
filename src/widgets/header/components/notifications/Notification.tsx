import React from "react";
import css from "./styles.module.scss";
import { Icon } from "@/shared/ui/icons";
import cn from "classnames";
import { useNotificationDropdown } from "@/shared/hooks";

const notifications = [
    {
        id: 1,
        text: "🥇 New record! You beat your previous result by +15 points!",
        date: "Oct 3",
        isUnread: true,
    },
    {
        id: 2,
        text: "👋 Ava joined the game!",
        date: "Oct 1",
        isUnread: true,
    },
    {
        id: 3,
        text: "🏆 Congratulations, Joe won with a score of 115:80!",
        date: "Sep 28",
        isUnread: false,
    },
    {
        id: 4,
        text: "🔁 New match created. Waiting for opponent...",
        date: "Sep 28",
        isUnread: false,
    },
];

export const Notification: React.FC = () => {
    const {
        isDropdownOpen,
        isClosing,
        dropdownRef,
        handleDropdownOpen,
    } = useNotificationDropdown();

    return (
        <div className={css.notification} ref={dropdownRef}>
            <button
                type="button"
                className={css.notification_button}
                onClick={handleDropdownOpen}
                aria-expanded={isDropdownOpen}
            >
                <Icon
                    name="bell_ring"
                    className={css.notification_button_icon}
                />
                <span className={css.notification_button_count}>2</span>
            </button>
            {isDropdownOpen && (
                <div
                    className={cn(css.notification_dropdown, {
                        [css.notification_dropdown_closing]: isClosing,
                    })}
                >
                <div className={css.notification_dropdown_header}>
                    <span>All notification</span>
                </div>
                <div className={css.notification_dropdown_buttons}>
                    <button
                        type="button"
                        className={css.notification_dropdown_button}
                    >
                        All
                    </button>
                    <button
                        type="button"
                        className={css.notification_dropdown_button}
                    >
                        <span className={css.notification_dropdown_button_text}>
                            Unread
                        </span>
                        <span
                            className={css.notification_dropdown_button_count}
                        >
                            (2)
                        </span>
                    </button>
                    <button
                        type="button"
                        className={css.notification_dropdown_button_unread}
                    >
                        <span>Mark all unread</span>
                    </button>
                </div>
                <div className={css.notification_dropdown_content}>
                    {notifications.map((notification) => (
                        <button
                            type="button"
                            className={cn(
                                css.notification_dropdown_content_item
                            )}
                            key={notification.id}
                        >
                            <p
                                className={
                                    css.notification_dropdown_content_text
                                }
                            >
                                {notification.text}
                            </p>
                            <div
                                className={
                                    css.notification_dropdown_content_date
                                }
                            >
                                <span>{notification.date}</span>
                                {notification.isUnread === true && (
                                    <div
                                        className={
                                            css.notification_dropdown_content_marker
                                        }
                                    ></div>
                                )}
                            </div>
                        </button>
                    ))}
                </div>
                </div>
            )}
        </div>
    );
};
