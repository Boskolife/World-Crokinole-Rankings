"use client";

import { useState, useEffect, useCallback, useMemo } from "react";
import { useAuth, useUserProfile } from "@/shared/hooks";
import { useRouter } from "next/navigation";
import { supabase } from "@/shared/supabase/client";
import { Pagination } from "@/shared/modules/pagination";
import { Icon } from "@/shared/ui/icons";
import { usePopup } from "@/shared/contexts/popup-context";
import css from "./styles.module.scss";

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
    const { isAuth, user, isMounted } = useAuth();
    const { profile, isLoading: profileLoading } = useUserProfile();
    const router = useRouter();
    const [activeSection, setActiveSection] = useState<AdminSection>("events");

    useEffect(() => {
        if (isMounted && !isAuth) {
            router.push("/");
        }
    }, [isAuth, isMounted, router]);

    if (!isMounted || profileLoading) {
        return (
            <div className={css.container}>
                <div className={css.loading}>Loading...</div>
            </div>
        );
    }

    if (!isAuth) {
        return null;
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
                <div className={css.userInfo}>
                    <span>{user?.email}</span>
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

function TableManager({ tableName }: { tableName: string }) {
    const [data, setData] = useState<any[]>([]);
    const [loading, setLoading] = useState(true);
    const [currentPage, setCurrentPage] = useState(1);
    const [pageSize, setPageSize] = useState(20);
    const { openPopup } = usePopup();

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

    const loadData = useCallback(async () => {
        setLoading(true);
        try {
            const { data: tableData, error } = await supabase
                .from(tableName)
                .select("*")
                .order("id", { ascending: false });

            if (error) {
                console.error("Error loading data:", error);
                return;
            }

            setData(tableData || []);
        } catch (error) {
            console.error("Error:", error);
        } finally {
            setLoading(false);
        }
    }, [tableName]);

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

    const handleDelete = async (id: string | number) => {
        if (!confirm("Are you sure you want to delete this record?")) {
            return;
        }

        try {
            const { error } = await supabase
                .from(tableName)
                .delete()
                .eq("id", id);

            if (error) {
                console.error("Error deleting:", error);
                alert("Error deleting record");
                return;
            }

            const currentDataLength = data.length;
            await loadData();
            
            setTimeout(() => {
                const newTotalPages = Math.ceil((currentDataLength - 1) / pageSize);
                if (currentPage > newTotalPages && newTotalPages > 0) {
                    setCurrentPage(newTotalPages);
                }
            }, 100);
        } catch (error) {
            console.error("Error:", error);
            alert("Error deleting record");
        }
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

    const columns = Object.keys(data[0] || {});

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
                                {columns.map((col) => (
                                    <td key={col}>{formatValue(item[col])}</td>
                                ))}
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

