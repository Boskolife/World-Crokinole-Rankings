"use client";
import React, { useState } from "react";
import css from "./styles.module.scss";
import cn from "classnames";
import { CustomButton } from "@/shared/ui/buttons/custom-button";
import { useRouter } from "next/navigation";
import { useLocale } from "next-intl";
import { clientRoutes } from "@/shared/routes/client";
import { useAuth } from "@/shared/hooks/use-auth";

export interface ISubscribeCardProps {
    id: number;
    name: string;
    description: string;
    features: string[];
    price: number;
    currency: string;
    duration: string;
    buttonText: string;
    inverted?: boolean;
    currentPlan?: boolean;
    billingPeriod?: "monthly" | "annual";
    onSelect?: () => void;
    isSelected?: boolean;
    isSaving?: boolean;
}

export const SubscribeCard: React.FC<ISubscribeCardProps> = ({
    id,
    name,
    description,
    features,
    price,
    currency,
    duration,
    buttonText,
    inverted,
    currentPlan,
    billingPeriod = "annual",
    onSelect,
    isSelected,
    isSaving,
}) => {
    const router = useRouter();
    const locale = useLocale();
    const { user } = useAuth();
    const [isLoading, setIsLoading] = useState(false);

    const handleSubscribe = async () => {
        if (onSelect) {
            onSelect();
            return;
        }

        // Для free плана с onSelect (отмена подписки) разрешаем действие
        if (id === 1 && !onSelect) {
            return;
        }

        if (currentPlan && !onSelect) {
            return;
        }

        if (!user) {
            router.push(`/${locale}${clientRoutes.signIn}`);
            return;
        }

        setIsLoading(true);

        try {
            const response = await fetch("/api/stripe/checkout", {
                method: "POST",
                headers: {
                    "Content-Type": "application/json",
                },
                body: JSON.stringify({
                    planId: id.toString(),
                    userId: user.id,
                    billingPeriod,
                }),
            });

            const data = await response.json();

            if (data.url) {
                window.location.href = data.url;
            } else {
                console.error("Failed to create checkout session");
            }
        } catch (error) {
            console.error("Error creating checkout session:", error);
        } finally {
            setIsLoading(false);
        }
    };

    return (
        <div
            key={id}
            className={cn(css.subscribe_card, {
                [css.inverted]: inverted,
            })}
        >
            <h3 className={css.subscribe_card_title}>{name}</h3>
            <p className={css.subscribe_card_description}>
                <span
                    dangerouslySetInnerHTML={{
                        __html: description,
                    }}
                />
            </p>
            <ul className={css.subscribe_card_list}>
                {features.map((feature) => (
                    <li key={feature} className={css.subscribe_card_list_item}>
                        {feature}
                    </li>
                ))}
            </ul>
            <div className={css.subscribe_card_price}>
                <div className={css.subscribe_card_price_numbers}>
                    <span className={css.subscribe_card_price_currency}>
                        {currency}
                    </span>
                    <span className={css.subscribe_card_price_value}>
                        {price}
                    </span>
                </div>
                {duration && (
                    <span className={css.subscribe_card_price_duration}>
                        {duration}
                    </span>
                )}
            </div>
            {currentPlan && !onSelect ? (
                <div className={cn(css.subscribe_card_current_plan_button, {
                    [css.subscribe_card_current_plan_button_inverted]: inverted,
                })}>
                    Current Plan
                </div>
            ) : (
                <CustomButton
                    inverted={inverted}
                    className={css.subscribe_card_button}
                    onClick={handleSubscribe}
                    disabled={isLoading || isSaving}
                >
                    {isSaving ? "Canceling..." : isLoading ? "Loading..." : (id === 1 && onSelect) ? "Cancel Subscription" : buttonText}
                </CustomButton>
            )}
        </div>
    );
};
