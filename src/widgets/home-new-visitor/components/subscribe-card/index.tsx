import React from "react";
import css from "./styles.module.scss";
import cn from "classnames";
import { CustomButton } from "@/shared/ui/buttons/custom-button";
import { useRouter } from "next/navigation";
import { useLocale } from "next-intl";

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
}) => {
    const router = useRouter();
    const locale = useLocale();
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
            <CustomButton
                inverted={inverted}
                className={css.subscribe_card_button}
                onClick={() => router.push(`/${locale}/new-visitor/step-4`)}
            >
                {buttonText}
            </CustomButton>
        </div>
    );
};
