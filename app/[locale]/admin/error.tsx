"use client";

import { useEffect } from "react";
import { useRouter } from "next/navigation";
import css from "./styles.module.scss";

export default function AdminError({
    error,
    reset,
}: {
    error: Error & { digest?: string };
    reset: () => void;
}) {
    useEffect(() => {
        console.error("[Admin error]", error);
    }, [error]);

    const router = useRouter();

    return (
        <div className={css.container}>
            <div className={css.errorBoundary}>
                <h2 className={css.errorBoundaryTitle}>Something went wrong</h2>
                <p className={css.errorBoundaryMessage}>
                    The admin panel ran into an error. Try again or sign in
                    again.
                </p>
                <div className={css.errorBoundaryActions}>
                    <button
                        type="button"
                        className={css.retryButton}
                        onClick={() => reset()}
                    >
                        Try again
                    </button>
                    <button
                        type="button"
                        className={css.linkButton}
                        onClick={() => router.push("/")}
                    >
                        Go to home
                    </button>
                </div>
            </div>
        </div>
    );
}
