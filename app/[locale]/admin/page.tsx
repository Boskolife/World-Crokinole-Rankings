"use client";

import { useState, useEffect, useCallback, useMemo, useRef } from "react";
import { useAuth, useUserProfile } from "@/shared/hooks";
import { useRouter, useParams } from "next/navigation";
import { Pagination } from "@/shared/modules/pagination";
import { Icon } from "@/shared/ui/icons";
import { usePopup } from "@/shared/contexts/popup-context";
import { localeConfig } from "@/app/localization/config";
import css from "./styles.module.scss";

const LOADING_TIMEOUT_MS = 15000;

type TableSchema = {
    name: string;
    columns: Array<{ name: string; dataType: string }>;
    primaryKeys: string[];
};

function toSectionLabel(tableName: string) {
    return tableName
        .split("_")
        .map((part) => part.charAt(0).toUpperCase() + part.slice(1))
        .join(" ");
}

export default function AdminPage() {
    const { isAuth, user, isMounted, logout } = useAuth();
    const { profile, isLoading: profileLoading } = useUserProfile();
    const router = useRouter();
    const params = useParams() as { locale?: string };
    const locale = params?.locale ?? localeConfig.defaultLocale;
    const [tables, setTables] = useState<TableSchema[]>([]);
    const [schemaLoading, setSchemaLoading] = useState(true);
    const [schemaError, setSchemaError] = useState<string | null>(null);
    const [activeSection, setActiveSection] = useState<string>("events");
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

    useEffect(() => {
        const loadSchema = async () => {
            setSchemaLoading(true);
            setSchemaError(null);
            try {
                const response = await fetch("/api/admin/schema");
                const json = await response.json();
                if (!response.ok) {
                    setSchemaError(json?.error || "Failed to load schema");
                    setTables([]);
                    return;
                }
                const nextTables = Array.isArray(json?.tables) ? json.tables : [];
                setTables(nextTables);

                const requestedSection = new URLSearchParams(window.location.search).get("section");
                const hasRequested = requestedSection && nextTables.some((t: TableSchema) => t.name === requestedSection);
                if (hasRequested) {
                    setActiveSection(requestedSection as string);
                    return;
                }
                if (nextTables.length > 0 && !nextTables.some((t: TableSchema) => t.name === activeSection)) {
                    setActiveSection(nextTables[0].name);
                }
            } catch (err) {
                setSchemaError(err instanceof Error ? err.message : "Failed to load schema");
                setTables([]);
            } finally {
                setSchemaLoading(false);
            }
        };
        if (isAuth) {
            loadSchema();
        }
    }, [isAuth]);

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

    if (schemaLoading) {
        return (
            <div className={css.container}>
                <div className={css.loading}>Loading schema...</div>
            </div>
        );
    }

    if (schemaError) {
        return (
            <div className={css.container}>
                <div className={css.error}>{schemaError}</div>
            </div>
        );
    }

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
                    {tables.map((table) => (
                        <button
                            key={table.name}
                            className={`${css.navItem} ${
                                activeSection === table.name ? css.active : ""
                            }`}
                            onClick={() => setActiveSection(table.name)}
                        >
                            {toSectionLabel(table.name)}
                        </button>
                    ))}
                </nav>

                <div className={css.mainContent}>
                    {tables
                        .filter((table) => table.name === activeSection)
                        .map((table) => (
                            <TableManager key={table.name} tableName={table.name} schema={table} />
                        ))}
                </div>
            </div>
        </div>
    );
}

const TABLE_COLUMNS: Record<string, string[]> = {
    news: [
        "id",
        "image",
        "title",
        "description",
        "link_text",
        "sort_order",
        "created_at",
    ],
};

const TABLE_SAMPLE_ITEM: Record<string, Record<string, any>> = {
    news: {
        image: "",
        title: "",
        description: "",
        link_text: "",
        sort_order: 0,
    },
};

function TableManager({ tableName, schema }: { tableName: string; schema: TableSchema }) {
    const [data, setData] = useState<any[]>([]);
    const [loading, setLoading] = useState(true);
    const [loadError, setLoadError] = useState<string | null>(null);
    const [currentPage, setCurrentPage] = useState(1);
    const [pageSize, setPageSize] = useState(20);
    const { openPopup } = usePopup();
    const router = useRouter();
    const params = useParams() as { locale?: string };
    const locale = params?.locale ?? localeConfig.defaultLocale;
    const isMountedRef = useRef(true);

    useEffect(() => {
        isMountedRef.current = true;
        return () => {
            isMountedRef.current = false;
        };
    }, []);

    const formatValue = (value: any, columnName?: string): string => {
        if (value === null || value === undefined) return "";
        if (typeof value === "boolean") return value ? "Yes" : "No";
        if (typeof value === "object") return JSON.stringify(value);
        if (typeof value === "string") {
            const isDateColumn =
                Boolean(columnName) &&
                (columnName?.includes("date") || columnName?.endsWith("_at"));
            const looksLikeIsoDate =
                value.includes("T") ||
                /^\d{4}-\d{2}-\d{2}/.test(value);

            if (isDateColumn || looksLikeIsoDate) {
                const date = new Date(value);
                if (!Number.isNaN(date.getTime())) {
                    return date.toLocaleString();
                }
            }
        }
        return String(value);
    };

    const stripHtml = (value: unknown): string => {
        if (typeof value !== "string") return "";
        return value.replace(/<[^>]*>/g, " ").replace(/\s+/g, " ").trim();
    };

    const renderStructureValue = (value: unknown) => {
        let parsed: unknown = value;
        if (typeof value === "string") {
            try {
                parsed = JSON.parse(value);
            } catch {
                return <div className={css.structureCell}>{value}</div>;
            }
        }

        if (!parsed || typeof parsed !== "object") {
            return <div className={css.structureCell}>{formatValue(parsed)}</div>;
        }

        if (Array.isArray(parsed)) {
            return (
                <div className={css.structureCell}>
                    {parsed.map((item, index) => (
                        <div key={index} className={css.structureLine}>
                            {formatValue(item)}
                        </div>
                    ))}
                </div>
            );
        }

        return (
            <div className={css.structureCell}>
                {Object.entries(parsed as Record<string, unknown>).map(([key, val]) => (
                    <div key={key} className={css.structureLine}>
                        <strong>{key}:</strong> {formatValue(val)}
                    </div>
                ))}
            </div>
        );
    };

    const primaryKeys = useMemo(
        () => (schema.primaryKeys.length > 0 ? schema.primaryKeys : ["id"]),
        [schema.primaryKeys]
    );
    const getRecordMatch = useCallback(
        (item: Record<string, unknown>) => {
            const pairs = primaryKeys
                .map((key) => [key, item[key]] as const)
                .filter(([, value]) => value !== undefined && value !== null);
            return Object.fromEntries(pairs);
        },
        [primaryKeys]
    );

    const loadData = useCallback(async () => {
        setLoading(true);
        setLoadError(null);
        try {
            if (!isMountedRef.current) return;
            const response = await fetch(`/api/admin/table?table=${encodeURIComponent(tableName)}`, {
                method: "GET",
            });
            const json = await response.json();

            if (!response.ok) {
                setLoadError(json?.error || "Failed to load data");
                setData([]);
                setLoading(false);
                return;
            }
            setData(Array.isArray(json?.data) ? json.data : []);
        } catch (err) {
            if (!isMountedRef.current) return;
            console.error("Error:", err);
            setLoadError(err instanceof Error ? err.message : "Failed to load");
            setData([]);
        } finally {
            if (isMountedRef.current) setLoading(false);
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

    const handleDelete = (item: Record<string, unknown>) => {
        const match = getRecordMatch(item);
        if (Object.keys(match).length === 0) {
            return;
        }
        openPopup("admin-delete-confirm", {
            tableName,
            match,
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

    const handleEdit = (item: Record<string, unknown>) => {
        if (tableName === "news") {
            router.push(`/${locale}/admin/news/${String(item.id)}/edit`);
            return;
        }
        const match = getRecordMatch(item);
        if (Object.keys(match).length === 0) {
            return;
        }
        const popupColumns =
            TABLE_COLUMNS[tableName] ??
            (schema.columns.length > 0 ? schema.columns.map((c) => c.name) : Object.keys(item));
        const columnTypes = Object.fromEntries(schema.columns.map((c) => [c.name, c.dataType]));
        openPopup("admin-edit", {
            tableName,
            match,
            item,
            columns: popupColumns,
            columnTypes,
            onSave: loadData,
        });
    };

    const handleAdd = () => {
        if (tableName === "news") {
            router.push(`/${locale}/admin/news/new`);
            return;
        }
        const popupColumns =
            TABLE_COLUMNS[tableName] ??
            (schema.columns.length > 0 ? schema.columns.map((c) => c.name) : Object.keys(data[0] || {}));
        const sampleItem = data[0] || TABLE_SAMPLE_ITEM[tableName] || {};
        const columnTypes = Object.fromEntries(schema.columns.map((c) => [c.name, c.dataType]));
        openPopup("admin-add", {
            tableName,
            columns: popupColumns,
            columnTypes,
            sampleItem,
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

    const rawColumns =
        TABLE_COLUMNS[tableName] ??
        (schema.columns.length > 0 ? schema.columns.map((c) => c.name) : Object.keys(data[0] || {}));
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
        if (tableName === "news" && col === "image") {
            const url = item.image?.trim();
            if (!url) return <td key={col} className={css.avatarCell} />;
            return (
                <td key={col} className={css.avatarCell}>
                    <img
                        src={url}
                        alt=""
                        className={css.newsThumb}
                        width={56}
                        height={40}
                    />
                </td>
            );
        }
        if (tableName === "events" && col === "image") {
            const url = item.image?.trim();
            if (!url) return <td key={col} className={css.avatarCell} />;
            return (
                <td key={col} className={css.avatarCell}>
                    <img
                        src={url}
                        alt=""
                        className={css.newsThumb}
                        width={56}
                        height={40}
                    />
                </td>
            );
        }
        if (tableName === "clubs" && col === "image") {
            const url = item.image?.trim();
            if (!url) return <td key={col} className={css.avatarCell} />;
            return (
                <td key={col} className={css.avatarCell}>
                    <img
                        src={url}
                        alt=""
                        className={css.newsThumb}
                        width={56}
                        height={40}
                    />
                </td>
            );
        }
        if (tableName === "news" && col === "title") {
            return (
                <td key={col}>
                    <div className={css.newsTitleCell}>{formatValue(item[col], col)}</div>
                </td>
            );
        }
        if (tableName === "news" && col === "description") {
            return (
                <td key={col}>
                    <div className={css.newsDescriptionCell}>{stripHtml(item[col])}</div>
                </td>
            );
        }
        if (tableName === "news" && col === "link_text") {
            return (
                <td key={col}>
                    <span className={css.newsBadge}>{formatValue(item[col], col)}</span>
                </td>
            );
        }
        if (
            col === "structure" ||
            col === "qualifying_heats" ||
            col === "tournament_bracket_results"
        ) {
            return <td key={col} className={css.jsonCell}>{renderStructureValue(item[col])}</td>;
        }
        return (
            <td key={col}>{formatValue(item[col], col)}</td>
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
                        {paginatedData.map((item, idx) => (
                            <tr key={`${JSON.stringify(getRecordMatch(item as Record<string, unknown>))}-${idx}`}>
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
                                            onClick={() => handleDelete(item)}
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

