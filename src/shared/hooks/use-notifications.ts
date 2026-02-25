import { useState, useCallback, useEffect } from "react";
import { useAuth } from "./use-auth";
import {
    getPendingClubJoinRequestsForAdminUser,
    getReadClubJoinNotificationClubIds,
    getClubJoinApprovedNotifications,
    getClubInviteNotifications,
    markClubJoinNotificationRead,
    markAllClubJoinNotificationsRead,
    markUserNotificationRead,
    markAllUserNotificationsRead,
} from "@/shared/supabase/data";

export type NotificationItem =
    | {
          type: "club_join_request";
          clubId: number;
          clubTitle: string;
          count: number;
          date: string;
          isRead: boolean;
          sortAt: string;
      }
    | {
          type: "club_join_approved";
          id: number;
          clubId: number;
          clubTitle: string;
          date: string;
          isRead: boolean;
          sortAt: string;
      }
    | {
          type: "club_invite";
          id: number;
          clubId: number;
          clubTitle: string;
          date: string;
          isRead: boolean;
          sortAt: string;
      };

export function useClubJoinRequestNotifications() {
    const { user } = useAuth();
    const [items, setItems] = useState<NotificationItem[]>([]);
    const [isLoading, setIsLoading] = useState(true);

    const refetch = useCallback(async () => {
        if (!user?.id) {
            setItems([]);
            setIsLoading(false);
            return;
        }
        setIsLoading(true);
        const [requests, readClubIds, approvedList, inviteList] = await Promise.all([
            getPendingClubJoinRequestsForAdminUser(user.id),
            getReadClubJoinNotificationClubIds(user.id),
            getClubJoinApprovedNotifications(user.id),
            getClubInviteNotifications(user.id),
        ]);
        const readSet = new Set(readClubIds);
        const byClub = new Map<number, { clubTitle: string; count: number; latest: string }>();
        for (const r of requests) {
            const existing = byClub.get(r.clubId);
            const created = r.createdAt ?? "";
            if (!existing) {
                byClub.set(r.clubId, {
                    clubTitle: r.clubTitle ?? "",
                    count: 1,
                    latest: created,
                });
            } else {
                existing.count += 1;
                if (created > existing.latest) existing.latest = created;
            }
        }
        const requestItems: NotificationItem[] = Array.from(byClub.entries()).map(
            ([clubId, v]) => ({
                type: "club_join_request" as const,
                clubId,
                clubTitle: v.clubTitle,
                count: v.count,
                date: formatNotificationDate(v.latest),
                isRead: readSet.has(clubId),
                sortAt: v.latest,
            })
        );
        const approvedItems: NotificationItem[] = approvedList.map((a) => ({
            type: "club_join_approved" as const,
            id: a.id,
            clubId: a.clubId,
            clubTitle: a.clubTitle,
            date: formatNotificationDate(a.createdAt),
            isRead: !!a.readAt,
            sortAt: a.createdAt,
        }));
        const inviteItems: NotificationItem[] = inviteList.map((a) => ({
            type: "club_invite" as const,
            id: a.id,
            clubId: a.clubId,
            clubTitle: a.clubTitle,
            date: formatNotificationDate(a.createdAt),
            isRead: !!a.readAt,
            sortAt: a.createdAt,
        }));
        const merged = [...requestItems, ...approvedItems, ...inviteItems].sort(
            (a, b) => new Date(b.sortAt).getTime() - new Date(a.sortAt).getTime()
        );
        setItems(merged);
        setIsLoading(false);
    }, [user?.id]);

    useEffect(() => {
        refetch();
    }, [refetch]);

    const totalCount = items.reduce(
        (acc, i) => acc + (i.type === "club_join_request" ? i.count : 1),
        0
    );
    const unreadCount = items.filter((i) => !i.isRead).length;

    const markAsRead = useCallback(
        async (item: NotificationItem) => {
            if (!user?.id) return;
            if (item.type === "club_join_approved" || item.type === "club_invite") {
                await markUserNotificationRead(item.id);
            } else {
                await markClubJoinNotificationRead(user.id, item.clubId);
            }
            setItems((prev) =>
                prev.map((p) => {
                    if (p.type === "club_join_approved" && item.type === "club_join_approved" && p.id === item.id)
                        return { ...p, isRead: true };
                    if (p.type === "club_invite" && item.type === "club_invite" && p.id === item.id)
                        return { ...p, isRead: true };
                    if (p.type === "club_join_request" && item.type === "club_join_request" && p.clubId === item.clubId)
                        return { ...p, isRead: true };
                    return p;
                })
            );
        },
        [user?.id]
    );

    const markAllAsRead = useCallback(async () => {
        if (!user?.id) return;
        await Promise.all([
            markAllClubJoinNotificationsRead(user.id),
            markAllUserNotificationsRead(user.id),
        ]);
        setItems((prev) => prev.map((i) => ({ ...i, isRead: true })));
    }, [user?.id]);

    return { items, totalCount, unreadCount, isLoading, refetch, markAsRead, markAllAsRead };
}

function formatNotificationDate(iso: string): string {
    if (!iso) return "";
    const d = new Date(iso);
    const now = new Date();
    const diffDays = Math.floor((now.getTime() - d.getTime()) / (24 * 60 * 60 * 1000));
    if (diffDays === 0) return "Today";
    if (diffDays === 1) return "Yesterday";
    if (diffDays < 7) return `${diffDays}d ago`;
    return d.toLocaleDateString("en-US", { month: "short", day: "numeric" });
}
