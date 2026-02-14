"use client";

import { useState, useEffect, useCallback, useMemo, useRef } from "react";
import { useAuth, useUserProfile } from "@/shared/hooks";
import { useRouter, useParams } from "next/navigation";
import { supabase } from "@/shared/supabase/client";
import { Pagination } from "@/shared/modules/pagination";
import { Icon } from "@/shared/ui/icons";
import { usePopup } from "@/shared/contexts/popup-context";
import { localeConfig } from "@/app/localization/config";
import css from "./styles.module.scss";

const LOADING_TIMEOUT_MS = 15000;

type AdminSection = 
    | "events" 
    | "players" 
    | "clubs" 
    | "tournaments" 
    | "rankings" 
    | "match-history" 
    | "profiles" 
    | "subscriptions";

export default function AdminPage() {
    const { isAuth, user, isMounted, logout } = useAuth();
    const { profile, isLoading: profileLoading } = useUserProfile();
    const router = useRouter();
    const params = useParams() as { locale?: string };
    const locale = params?.locale ?? localeConfig.defaultLocale;
    const [activeSection, setActiveSection] = useState<AdminSection>("events");
    const [loadingTimedOut, setLoadingTimedOut] = useState(false);
    const timeoutRef = useRef<ReturnType<typeof setTimeout> | null>(null);

    useEffect(() => {
        if (!isMounted || !isAuth || !profileLoading) {
            if (timeoutRef.current) {
                clearTimeout(timeoutRef.current);
                timeoutRef.current = null;
            }
            setLoadingTimedOut(false);
            return;
        }
        timeoutRef.current = setTimeout(() => {
            setLoadingTimedOut(true);
        }, LOADING_TIMEOUT_MS);
        return () => {
            if (timeoutRef.current) clearTimeout(timeoutRef.current);
        };
    }, [isMounted, isAuth, profileLoading]);

    useEffect(() => {
        if (isMounted && !isAuth) {
            router.push(`/${locale}/admin/sign-in`);
        }
    }, [isAuth, isMounted, locale, router]);

    if (!isMounted) {
        return (
            <div className={css.container}>
                <div className={css.loading}>Loading...</div>
            </div>
        );
    }

    if (profileLoading && isAuth) {
        return (
            <div className={css.container}>
                <div className={css.loading}>
                    {loadingTimedOut ? (
                        <div className={css.loadingTimeout}>
                            <p>Taking too long. Check your connection.</p>
                            <button
                                type="button"
                                className={css.retryButton}
                                onClick={() => window.location.reload()}
                            >
                                Refresh page
                            </button>
                        </div>
                    ) : (
                        "Loading profile..."
                    )}
                </div>
            </div>
        );
    }

    if (!isAuth) {
        return (
            <div className={css.container}>
                <div className={css.loading}>Redirecting to sign in...</div>
            </div>
        );
    }

    if (!profile?.is_admin) {
        return (
            <div className={css.container}>
                <div className={css.error}>You don't have access to the admin panel</div>
            </div>
        );
    }

    const sections: Array<{ id: AdminSection; label: string }> = [
        { id: "events", label: "Events" },
        { id: "players", label: "Players" },
        { id: "clubs", label: "Clubs" },
        { id: "tournaments", label: "Tournaments" },
        { id: "rankings", label: "Rankings" },
        { id: "match-history", label: "Match History" },
        { id: "profiles", label: "Profiles" },
        { id: "subscriptions", label: "Subscriptions" },
    ];

    return (
        <div className={css.container}>
            <div className={css.header}>
                <h1 className={css.title}>Admin Panel</h1>
                <div className={css.headerRight}>
                    <span className={css.userInfo}>{user?.email}</span>
                    <button
                        type="button"
                        className={css.logoutButton}
                        onClick={async () => {
                            await logout();
                            router.push(`/${locale}/admin/sign-in`);
                        }}
                    >
                        Logout
                    </button>
                </div>
            </div>
            
            <div className={css.content}>
                <nav className={css.sidebar}>
                    {sections.map((section) => (
                        <button
                            key={section.id}
                            className={`${css.navItem} ${
                                activeSection === section.id ? css.active : ""
                            }`}
                            onClick={() => setActiveSection(section.id)}
                        >
                            {section.label}
                        </button>
                    ))}
                </nav>

                <div className={css.mainContent}>
                    {activeSection === "events" && <EventsManager />}
                    {activeSection === "players" && <PlayersManager />}
                    {activeSection === "clubs" && <ClubsManager />}
                    {activeSection === "tournaments" && <TournamentsManager />}
                    {activeSection === "rankings" && <RankingsManager />}
                    {activeSection === "match-history" && <MatchHistoryManager />}
                    {activeSection === "profiles" && <ProfilesManager />}
                    {activeSection === "subscriptions" && <SubscriptionsManager />}
                </div>
            </div>
        </div>
    );
}

function EventsManager() {
    return <TableManager tableName="events" />;
}

function PlayersManager() {
    return <TableManager tableName="players" />;
}

function ClubsManager() {
    return <TableManager tableName="clubs" />;
}

function TournamentsManager() {
    return <TableManager tableName="tournaments" />;
}

function RankingsManager() {
    return <TableManager tableName="rankings" />;
}

function MatchHistoryManager() {
    return <TableManager tableName="match_history" />;
}

function ProfilesManager() {
    return <TableManager tableName="profiles" />;
}

function SubscriptionsManager() {
    return <TableManager tableName="subscriptions" />;
}

const TABLE_ORDER_COLUMN: Record<string, string> = {
    events: "id",
    players: "created_at",
    clubs: "id",
    tournaments: "created_at",
    rankings: "id",
    match_history: "created_at",
    profiles: "created_at",
    subscriptions: "created_at",
};

function TableManager({ tableName }: { tableName: string }) {
    const [data, setData] = useState<any[]>([]);
    const [loading, setLoading] = useState(true);
    const [loadError, setLoadError] = useState<string | null>(null);
    const [currentPage, setCurrentPage] = useState(1);
    const [pageSize, setPageSize] = useState(20);
    const { openPopup } = usePopup();
    const isMountedRef = useRef(true);

    useEffect(() => {
        isMountedRef.current = true;
        return () => {
            isMountedRef.current = false;
        };
    }, []);

    const formatValue = (value: any): string => {
        if (value === null || value === undefined) return "";
        if (typeof value === "boolean") return value ? "Yes" : "No";
        if (typeof value === "object") return JSON.stringify(value);
        if (typeof value === "string" && value.includes("T") && value.includes("Z")) {
            const date = new Date(value);
            return date.toLocaleString("en-US");
        }
        return String(value);
    };

    const orderCol = TABLE_ORDER_COLUMN[tableName] ?? "id";

    const loadData = useCallback(async () => {
        setLoading(true);
        setLoadError(null);
        try {
            const { data: tableData, error } = await supabase
                .from(tableName)
                .select("*")
                .order(orderCol, { ascending: false });

            if (!isMountedRef.current) return;
            if (error) {
                console.error("Error loading data:", error);
                setLoadError(error.message);
                setData([]);
                setLoading(false);
                return;
            }
            setData(tableData || []);
        } catch (err) {
            if (!isMountedRef.current) return;
            console.error("Error:", err);
            setLoadError(err instanceof Error ? err.message : "Failed to load");
            setData([]);
        } finally {
            if (isMountedRef.current) setLoading(false);
        }
    }, [tableName, orderCol]);

    useEffect(() => {
        loadData();
    }, [loadData]);

    const paginatedData = useMemo(() => {
        const start = (currentPage - 1) * pageSize;
        const end = start + pageSize;
        return data.slice(start, end);
    }, [data, currentPage, pageSize]);

    const totalPages = Math.ceil(data.length / pageSize);

    useEffect(() => {
        if (currentPage > totalPages && totalPages > 0) {
            setCurrentPage(1);
        }
    }, [totalPages, currentPage]);

    const handleDelete = (id: string | number) => {
        openPopup("admin-delete-confirm", {
            tableName,
            id,
            onConfirm: async () => {
                const currentDataLength = data.length;
                await loadData();
                
                setTimeout(() => {
                    const newTotalPages = Math.ceil((currentDataLength - 1) / pageSize);
                    if (currentPage > newTotalPages && newTotalPages > 0) {
                        setCurrentPage(newTotalPages);
                    }
                }, 100);
            },
        });
    };

    const handleEdit = (item: any) => {
        openPopup("admin-edit", {
            tableName,
            item,
            columns: Object.keys(data[0] || {}),
            onSave: loadData,
        });
    };

    const handleAdd = () => {
        openPopup("admin-add", {
            tableName,
            columns: Object.keys(data[0] || {}),
            sampleItem: data[0] || {},
            onSave: loadData,
        });
    };

    if (loading) {
        return <div className={css.loading}>Loading...</div>;
    }

    if (loadError) {
        return (
            <div className={css.empty}>
                <p className={css.loadError}>{loadError}</p>
                <button
                    type="button"
                    className={css.retryButton}
                    onClick={() => loadData()}
                >
                    Retry
                </button>
            </div>
        );
    }

    if (data.length === 0) {
        return (
            <div className={css.empty}>
                <p>No data</p>
                <button
                    className={css.addButton}
                    onClick={handleAdd}
                >
                    Add Record
                </button>
            </div>
        );
    }

    const rawColumns = Object.keys(data[0] || {});
    const columns =
        tableName === "profiles"
            ? ["avatar", ...rawColumns.filter((c) => c !== "avatar_url")]
            : rawColumns;

    const renderCell = (item: any, col: string) => {
        if (tableName === "profiles" && col === "avatar") {
            const url = item.avatar_url?.trim();
            if (!url) return <td key={col} className={css.avatarCell} />;
            return (
                <td key={col} className={css.avatarCell}>
                    <img
                        src={url}
                        alt=""
                        className={css.avatarThumb}
                        width={36}
                        height={36}
                    />
                </td>
            );
        }
        return (
            <td key={col}>{formatValue(item[col])}</td>
        );
    };

    return (
        <div className={css.tableManager}>
            <div className={css.tableHeader}>
                <div className={css.tableHeaderLeft}>
                    <h2>{tableName}</h2>
                    <span className={css.tableCount}>
                        Total: {data.length} records
                    </span>
                </div>
                <div className={css.headerActions}>
                    <select
                        className={css.pageSizeSelect}
                        value={pageSize}
                        onChange={(e) => {
                            setPageSize(Number(e.target.value));
                            setCurrentPage(1);
                        }}
                    >
                        <option value={10}>10 per page</option>
                        <option value={20}>20 per page</option>
                        <option value={50}>50 per page</option>
                        <option value={100}>100 per page</option>
                    </select>
                    <button
                        className={css.refreshButton}
                        onClick={loadData}
                        title="Refresh data"
                    >
                        Refresh
                    </button>
                    <button
                        className={css.addButton}
                        onClick={handleAdd}
                    >
                        Add Record
                    </button>
                </div>
            </div>

            <div className={css.tableWrapper}>
                <table 
                    className={css.table}
                    style={{ minWidth: `${columns.length * 150}px` }}
                >
                    <thead>
                        <tr>
                            {columns.map((col) => (
                                <th key={col}>{col}</th>
                            ))}
                            <th>Actions</th>
                        </tr>
                    </thead>
                    <tbody>
                        {paginatedData.map((item) => (
                            <tr key={item.id}>
                                {columns.map((col) => renderCell(item, col))}
                                <td className={css.actionsCell}>
                                    <div className={css.actionButtons}>
                                        <button
                                            className={`${css.iconButton} ${css.editIconButton}`}
                                            onClick={() => handleEdit(item)}
                                            title="Edit"
                                        >
                                            <Icon name="edit" className={css.iconButtonIcon} />
                                        </button>
                                        <button
                                            className={`${css.iconButton} ${css.deleteIconButton}`}
                                            onClick={() => handleDelete(item.id)}
                                            title="Delete"
                                        >
                                            <Icon name="trash" className={css.iconButtonIcon} />
                                        </button>
                                    </div>
                                </td>
                            </tr>
                        ))}
                    </tbody>
                </table>
            </div>
            
            {totalPages > 1 && (
                <div className={css.paginationWrapper}>
                    <Pagination
                        totalItems={data.length}
                        pageSize={pageSize}
                        currentPage={currentPage}
                        onPageChange={setCurrentPage}
                    />
                </div>
            )}
        </div>
    );
}

