"use client";

import { useEffect, Suspense } from "react";
import { useSearchParams } from "next/navigation";
import { SubscribePlans } from "@/shared/modules";
import { useUserProfile } from "@/shared/hooks/use-user-profile";

function MembershipPlansContent() {
    const searchParams = useSearchParams();
    const { refetch } = useUserProfile();
    const success = searchParams.get("success");
    const canceled = searchParams.get("canceled");

    useEffect(() => {
        if (success === "true") {
            setTimeout(() => {
                refetch();
            }, 2000);
        }
    }, [success, refetch]);

    return (
        <div className="container">
            {success === "true" && (
                <div style={{
                    padding: "16px",
                    marginBottom: "24px",
                    backgroundColor: "#d4edda",
                    color: "#155724",
                    borderRadius: "8px",
                    border: "1px solid #c3e6cb"
                }}>
                    Payment successful! Your subscription has been activated.
                </div>
            )}
            {canceled === "true" && (
                <div style={{
                    padding: "16px",
                    marginBottom: "24px",
                    backgroundColor: "#f8d7da",
                    color: "#721c24",
                    borderRadius: "8px",
                    border: "1px solid #f5c6cb"
                }}>
                    Payment was canceled. You can try again anytime.
                </div>
            )}
            <SubscribePlans title="Upgrade to Premium to create ranked events and unlock more features" />
        </div>
    );
}

export function MembershipPlansPage() {
    return (
        <Suspense fallback={<div className="container">Loading...</div>}>
            <MembershipPlansContent />
        </Suspense>
    );
}
