import React from "react";
import cn from "classnames";
import css from "./styles.module.scss";
import { CustomCheckbox } from "@/shared/ui";

interface IMatchHistoryItemProps {
    rank: number;
    name: string;
    rating: number;
    kingdom: string;
    club: string;
    myMatches: string;
    checked?: boolean;
    isHighlighted?: boolean;
    onChange?: (checked: boolean) => void;
}

export const MatchHistoryItem: React.FC<IMatchHistoryItemProps> = ({
    rank,
    name,
    rating,
    kingdom,
    club,
    myMatches,
    checked = false,
    isHighlighted = false,
    onChange,
}) => {
    const handleChange = (e: React.ChangeEvent<HTMLInputElement>) => {
        onChange?.(e.target.checked);
    };

    return (
        <tr className={cn(css.match_history_item, isHighlighted && css.match_history_item_highlighted)}>
            <td className={css.match_history_item_value}>{rank}</td>
            <td className={css.match_history_item_value}>{name}</td>
            <td className={css.match_history_item_value}>{rating}</td>
            <td className={css.match_history_item_value}>{kingdom}</td>
            <td className={css.match_history_item_value}>{club}</td>
            <td className={css.match_history_item_value}>
                <CustomCheckbox
                    label={myMatches}
                    name={`match-${rank}`}
                    checked={checked}
                    onChange={handleChange}
                    className={css.match_history_item_checkbox}
                    classNameLabel={css.match_history_item_checkbox_label}
                />
            </td>
        </tr>
    );
};
