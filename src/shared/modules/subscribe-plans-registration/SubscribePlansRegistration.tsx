"use client";

import React, { useState, useRef, useEffect } from "react";
import css from "../subscribe-plans/styles.module.scss";
import cn from "classnames";
import { SwitcherModule } from "@/shared/modules";
import { SubscribeCard } from "../../ui/subscribe-card";
import subrscribePlansData from "@/data/subrscribe-plans.json";
import { ISubscribeCardProps } from "../../ui/subscribe-card";
import { SwitcherOption } from "@/shared/modules/switcher/Switcher";
import { useRouter } from "next/navigation";
import { useLocale } from "next-intl";
import { clientRoutes } from "@/shared/routes/client";
import { useAuth } from "@/shared/hooks/use-auth";
import { supabase, isSupabaseConfigured } from "@/shared/supabase/client";

const switcherOptions = [
    { value: "monthly", label: "Monthly" },
    { value: "annual", label: "Annual" },
];

export const SubscribePlansRegistration: React.FC = () => {
    const { user } = useAuth();
    const router = useRouter();
    const locale = useLocale();
    const [planMode, setPlanMode] = useState<"monthly" | "annual">("annual");
    const [isFadingOut, setIsFadingOut] = useState(false);
    const [isFadingIn, setIsFadingIn] = useState(false);
    const [displayMode, setDisplayMode] = useState<"monthly" | "annual">(
        "annual"
    );
    const [selectedPlanId, setSelectedPlanId] = useState<number | null>(null);
    const [isSaving, setIsSaving] = useState(false);
    const [hasActiveSubscription, setHasActiveSubscription] = useState(false);
    const timeoutRef = useRef<NodeJS.Timeout | null>(null);

    useEffect(() => {
        const checkSubscription = async () => {
            if (!user) {
                setHasActiveSubscription(false);
                return;
            }

            try {
                const response = await fetch(`/api/stripe/subscription?userId=${user.id}`);
                const data = await response.json();
                setHasActiveSubscription(data.subscription !== null && data.subscription.status === "active");
            } catch (error) {
                console.error("Failed to check subscription:", error);
                setHasActiveSubscription(false);
            }
        };

        checkSubscription();
    }, [user]);

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

    const handlePlanSelect = async (planId: number) => {
        if (!user || !isSupabaseConfigured) {
            return;
        }

        setSelectedPlanId(planId);
        setIsSaving(true);

        try {
            const planMap: Record<number, string> = {
                1: "standard",
                2: "premium",
                3: "administrator",
            };

            const planName = planMap[planId] || "standard";

            await supabase.rpc("ensure_profile", { p_id: user.id });
            await fetch("/api/ensure-player", { method: "POST" });
            const { error } = await supabase
                .from("profiles")
                .update({ subscription_plan: planName })
                .eq("id", user.id);

            if (error) {
                console.error("Failed to save plan:", error);
                setSelectedPlanId(null);
                return;
            }

            if (planId === 1) {
                router.push(`/${locale}/new-visitor/save-continue`);
            } else {
                const response = await fetch("/api/stripe/checkout", {
                    method: "POST",
                    headers: {
                        "Content-Type": "application/json",
                    },
                    body: JSON.stringify({
                        planId: planId.toString(),
                        userId: user.id,
                        billingPeriod: displayMode,
                    }),
                });

                const data = await response.json();

                if (data.url) {
                    window.location.href = data.url;
                } else {
                    console.error("Failed to create checkout session");
                    setSelectedPlanId(null);
                }
            }
        } catch (error) {
            console.error("Error selecting plan:", error);
            setSelectedPlanId(null);
        } finally {
            setIsSaving(false);
        }
    };

    const currentPlans =
        displayMode === "monthly"
            ? subrscribePlansData.plansMonthly
            : subrscribePlansData.plansAnnual;

    return (
        <section className={cn(css.subscribe_plans)}>
            <div className="container">
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
                {displayMode === "monthly" && (
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
                        const shouldShowCancel = plan.id === 1 && hasActiveSubscription;
                        return (
                            <SubscribeCard
                                key={plan.id}
                                {...(plan as ISubscribeCardProps)}
                                currentPlan={false}
                                billingPeriod={displayMode}
                                onSelect={shouldShowCancel ? () => handlePlanSelect(plan.id) : () => handlePlanSelect(plan.id)}
                                isSelected={selectedPlanId === plan.id}
                                isSaving={isSaving && selectedPlanId === plan.id}
                                hasActiveSubscription={hasActiveSubscription}
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

