"use client";
import React, { useState, useRef } from "react";
import css from "./styles.module.scss";
import cn from "classnames";
import { SwitcherModule } from "@/shared/modules";
import { SubscribeCard } from "../../ui/subscribe-card";
import subrscribePlansData from "@/data/subrscribe-plans.json";
import { ISubscribeCardProps } from "../../ui/subscribe-card";
import { SwitcherOption } from "@/shared/modules/switcher/Switcher";

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
    const [planMode, setPlanMode] = useState<"monthly" | "annual">("annual");
    const [isFadingOut, setIsFadingOut] = useState(false);
    const [isFadingIn, setIsFadingIn] = useState(false);
    const [displayMode, setDisplayMode] = useState<"monthly" | "annual">(
        "annual"
    );
    const timeoutRef = useRef<NodeJS.Timeout | null>(null);

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
                <p className={css.subscribe_plans_description}>
                    Save 40% by choosing the annual subscription!
                </p>
                <div
                    className={cn(css.subscribe_plans_cards, {
                        [css.subscribe_plans_cards_fading_out]: isFadingOut,
                        [css.subscribe_plans_cards_fading_in]: isFadingIn,
                    })}
                >
                    {currentPlans.map((plan) => (
                        <SubscribeCard
                            key={plan.id}
                            {...(plan as ISubscribeCardProps)}
                        />
                    ))}
                </div>
                <p className={css.subscribe_plans_description}>
                    Prices in USD, billed annually. You can change or cancel
                    anytime.
                </p>
            </div>
        </section>
    );
};
