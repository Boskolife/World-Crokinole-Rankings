"use client";

import React, { useState, useEffect } from "react";
import css from "./styles.module.scss";
import { useAuth } from "@/shared/hooks/use-auth";
import { useUserProfile } from "@/shared/hooks/use-user-profile";
import { Button } from "@/shared/ui/buttons";
import cn from "classnames";

interface SubscriptionData {
    id: string;
    plan_name: string;
    billing_period: string;
    status: string;
    current_period_end: string;
    cancel_at_period_end: boolean;
}

export const SubscriptionManagement: React.FC = () => {
    const { user } = useAuth();
    const { profile, refetch } = useUserProfile();
    const [subscription, setSubscription] = useState<SubscriptionData | null>(null);
    const [isLoading, setIsLoading] = useState(true);
    const [isCanceling, setIsCanceling] = useState(false);

    useEffect(() => {
        if (user && profile?.subscription_plan && profile.subscription_plan !== "standard") {
            fetchSubscription();
        } else {
            setIsLoading(false);
        }
    }, [user, profile]);

    const fetchSubscription = async () => {
        if (!user) return;

        try {
            const response = await fetch(`/api/stripe/subscription?userId=${user.id}`);
            const data = await response.json();

            if (data.subscription) {
                setSubscription(data.subscription);
            }
        } catch (error) {
            console.error("Failed to fetch subscription:", error);
        } finally {
            setIsLoading(false);
        }
    };

    const handleCancelSubscription = async () => {
        if (!user || !confirm("Are you sure you want to cancel your subscription? You will continue to have access until the end of your billing period.")) {
            return;
        }

        setIsCanceling(true);

        try {
            const response = await fetch("/api/stripe/subscription", {
                method: "DELETE",
                headers: {
                    "Content-Type": "application/json",
                },
                body: JSON.stringify({ userId: user.id }),
            });

            const data = await response.json();

            if (data.success) {
                await fetchSubscription();
                await refetch();
            } else {
                alert(data.error || "Failed to cancel subscription");
            }
        } catch (error) {
            console.error("Failed to cancel subscription:", error);
            alert("Failed to cancel subscription. Please try again.");
        } finally {
            setIsCanceling(false);
        }
    };

    if (isLoading) {
        return <div className={css.subscription_management}>Loading subscription...</div>;
    }

    if (!subscription || profile?.subscription_plan === "standard") {
        return null;
    }

    const formatDate = (dateString: string) => {
        try {
            const date = new Date(dateString);
            if (isNaN(date.getTime())) {
                return "Invalid date";
            }
            return date.toLocaleDateString("en-US", {
                year: "numeric",
                month: "long",
                day: "numeric",
            });
        } catch (error) {
            console.error("Error formatting date:", error);
            return "Invalid date";
        }
    };

    const getBillingPeriodLabel = (period: string) => {
        return period === "annual" ? "Yearly" : "Monthly";
    };

    return (
        <div className={css.subscription_management}>
            <h3 className={css.subscription_management_title}>Subscription</h3>
            <div className={css.subscription_management_info}>
                <div className={css.subscription_management_info_item}>
                    <span className={css.subscription_management_info_label}>Plan:</span>
                    <span className={css.subscription_management_info_value}>
                        {subscription.plan_name.charAt(0).toUpperCase() + subscription.plan_name.slice(1)} ({getBillingPeriodLabel(subscription.billing_period)})
                    </span>
                </div>
                <div className={css.subscription_management_info_item}>
                    <span className={css.subscription_management_info_label}>Status:</span>
                    <span className={cn(css.subscription_management_info_value, {
                        [css.subscription_management_info_value_active]: subscription.status === "active",
                        [css.subscription_management_info_value_canceled]: subscription.cancel_at_period_end,
                    })}>
                        {subscription.cancel_at_period_end ? "Canceling at period end" : subscription.status}
                    </span>
                </div>
                <div className={css.subscription_management_info_item}>
                    <span className={css.subscription_management_info_label}>Next billing date:</span>
                    <span className={css.subscription_management_info_value}>
                        {subscription.cancel_at_period_end 
                            ? "N/A (canceling)" 
                            : subscription.current_period_end 
                                ? formatDate(subscription.current_period_end)
                                : "N/A"}
                    </span>
                </div>
            </div>
            {!subscription.cancel_at_period_end && (
                <Button
                    buttonType="transparent"
                    onClick={handleCancelSubscription}
                    disabled={isCanceling}
                    className={css.subscription_management_cancel_button}
                >
                    {isCanceling ? "Canceling..." : "Cancel Subscription"}
                </Button>
            )}
            {subscription.cancel_at_period_end && (
                <p className={css.subscription_management_canceled_message}>
                    Your subscription will be canceled on {formatDate(subscription.current_period_end)}. You will continue to have access until then.
                </p>
            )}
        </div>
    );
};

