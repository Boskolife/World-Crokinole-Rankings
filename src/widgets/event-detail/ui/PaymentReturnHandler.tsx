"use client";

import { useEffect, useRef } from "react";
import { useSearchParams, usePathname, useRouter } from "next/navigation";

export function PaymentReturnHandler() {
    const searchParams = useSearchParams();
    const pathname = usePathname();
    const router = useRouter();
    const done = useRef(false);

    useEffect(() => {
        if (done.current) return;
        const payment = searchParams.get("payment");
        const paymentIntent = searchParams.get("payment_intent");
        const redirectStatus = searchParams.get("redirect_status");
        if (payment !== "success" || !paymentIntent || redirectStatus !== "succeeded") return;

        done.current = true;
        fetch("/api/stripe/confirm-event-registration", {
            method: "POST",
            headers: { "Content-Type": "application/json" },
            body: JSON.stringify({ paymentIntentId: paymentIntent }),
        })
            .then((res) => {
                if (!res.ok) return res.json().then((j) => Promise.reject(new Error(j?.error ?? "Failed")));
                return res.json();
            })
            .then(() => {
                if (typeof window !== "undefined") {
                    const cleanPath = pathname || window.location.pathname;
                    window.history.replaceState({}, "", cleanPath);
                    window.dispatchEvent(new CustomEvent("event-registration-updated"));
                }
                router.refresh();
            })
            .catch(() => {});
    }, [searchParams, pathname, router]);

    return null;
}
