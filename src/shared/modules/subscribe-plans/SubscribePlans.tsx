"use client";
import React, { useState, useRef, useEffect } from "react";
import css from "./styles.module.scss";
import cn from "classnames";
import { SwitcherModule } from "@/shared/modules";
import { SubscribeCard } from "../../ui/subscribe-card";
import subrscribePlansData from "@/data/subrscribe-plans.json";
import { ISubscribeCardProps } from "../../ui/subscribe-card";
import { SwitcherOption } from "@/shared/modules/switcher/Switcher";
import { useUserProfile } from "@/shared/hooks/use-user-profile";
import { useAuth } from "@/shared/hooks/use-auth";

const switcherOptions = [
    { value: "monthly", label: "Monthly" },
    { value: "annual", label: "Annual" },
];

interface SubscribePlansProps {
    className?: string;
    title?: string;
}

export const SubscribePlans: React.FC<SubscribePlansProps> = ({
    className,
    title,
}) => {
    const { profile, refetch } = useUserProfile();
    const { user } = useAuth();
    const [currentSubscription, setCurrentSubscription] = useState<{
        planId: number;
        billingPeriod: "monthly" | "annual";
        subscriptionId?: string;
    } | null>(null);
    const [planMode, setPlanMode] = useState<"monthly" | "annual">("annual");
    const [isFadingOut, setIsFadingOut] = useState(false);
    const [isFadingIn, setIsFadingIn] = useState(false);
    const [displayMode, setDisplayMode] = useState<"monthly" | "annual">(
        "annual"
    );
    const [isCanceling, setIsCanceling] = useState(false);
    const timeoutRef = useRef<NodeJS.Timeout | null>(null);

    useEffect(() => {
        if (user && profile?.subscription_plan && profile.subscription_plan !== "standard") {
            fetchCurrentSubscription();
        } else {
            setCurrentSubscription(null);
        }
    }, [user, profile]);

    const fetchCurrentSubscription = async () => {
        if (!user) return;

        try {
            const response = await fetch(`/api/stripe/subscription?userId=${user.id}`);
            const data = await response.json();

            if (data.subscription) {
                const subscriptionData = {
                    planId: data.subscription.plan_id,
                    billingPeriod: data.subscription.billing_period,
                    subscriptionId: data.subscription.stripe_subscription_id,
                };
                
                console.log('Current subscription loaded:', subscriptionData);
                setCurrentSubscription(subscriptionData);
                
                // Automatically switch displayMode to current subscription period
                if (subscriptionData.billingPeriod !== displayMode) {
                    setDisplayMode(subscriptionData.billingPeriod);
                    setPlanMode(subscriptionData.billingPeriod);
                }
            } else {
                console.log('No subscription found');
            }
        } catch (error) {
            console.error("Failed to fetch subscription:", error);
        }
    };

    const handleModeChange = (newMode: "monthly" | "annual") => {
        if (newMode === displayMode) return;

        if (timeoutRef.current) {
            clearTimeout(timeoutRef.current);
        }

        setIsFadingOut(true);
        timeoutRef.current = setTimeout(() => {
            setDisplayMode(newMode);
            setIsFadingOut(false);
            setIsFadingIn(true);
            timeoutRef.current = setTimeout(() => {
                setIsFadingIn(false);
            }, 300);
        }, 300);

        setPlanMode(newMode);
    };

    const handleCancelSubscription = async () => {
        if (!user || !currentSubscription?.subscriptionId) {
            return;
        }

        if (!confirm("Are you sure you want to cancel your subscription? You will continue to have access until the end of your billing period.")) {
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
                await fetchCurrentSubscription();
                await refetch();
                setCurrentSubscription(null);
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

    const handleFreePlanSelect = async () => {
        // If there's an active subscription, cancel it
        if (currentSubscription && currentSubscription.planId !== 1) {
            await handleCancelSubscription();
        }
    };

    const currentPlans =
        displayMode === "monthly"
            ? subrscribePlansData.plansMonthly
            : subrscribePlansData.plansAnnual;

    return (
        <section className={cn(css.subscribe_plans, className)}>
            <div className="container">
                {title && (
                    <h2 className={css.subscribe_plans_title}>{title}</h2>
                )}
                <SwitcherModule
                    className={css.subscribe_plans_switcher}
                    options={
                        switcherOptions as SwitcherOption<
                            "monthly" | "annual"
                        >[]
                    }
                    value={planMode}
                    onChange={handleModeChange}
                />
                {displayMode === "annual" && (
                    <p className={css.subscribe_plans_description}>
                        Save 20% by choosing the annual subscription!
                    </p>
                )}
                <div
                    className={cn(css.subscribe_plans_cards, {
                        [css.subscribe_plans_cards_fading_out]: isFadingOut,
                        [css.subscribe_plans_cards_fading_in]: isFadingIn,
                    })}
                >
                    {currentPlans.map((plan) => {
                        let isCurrentPlan = false;

                        // Determine current plan
                        if (currentSubscription) {
                            // If there's an active subscription, check planId match
                            // Show as current if it's the same plan, regardless of displayMode
                            isCurrentPlan = plan.id === currentSubscription.planId;
                            
                            if (plan.id === currentSubscription.planId) {
                                console.log('Current plan found:', {
                                    planId: plan.id,
                                    planName: plan.name,
                                    subscriptionPlanId: currentSubscription.planId,
                                    isCurrentPlan,
                                });
                            }
                        } else if (
                            plan.id === 1 &&
                            (!profile?.subscription_plan || profile.subscription_plan === "standard")
                        ) {
                            // If there's no subscription and this is the free plan, it's current
                            isCurrentPlan = true;
                        }

                        // For free plan (id=1) with active subscription, add cancellation handler
                        const shouldShowCancel = plan.id === 1 && currentSubscription && currentSubscription.planId !== 1;

                        return (
                            <SubscribeCard
                                key={plan.id}
                                {...(plan as ISubscribeCardProps)}
                                currentPlan={isCurrentPlan}
                                billingPeriod={displayMode}
                                onSelect={shouldShowCancel ? handleFreePlanSelect : undefined}
                                isSaving={shouldShowCancel ? isCanceling : false}
                            />
                        );
                    })}
                </div>
                <p className={css.subscribe_plans_description}>
                    Prices in USD, billed {displayMode === "annual" ? "annually" : "monthly"}. You can change or cancel
                    anytime.
                </p>
            </div>
        </section>
    );
};
