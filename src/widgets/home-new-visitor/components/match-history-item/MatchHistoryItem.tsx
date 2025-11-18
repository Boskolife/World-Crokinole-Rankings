import React from "react";
import css from "./styles.module.scss";
import { CustomCheckbox } from "@/shared/ui";

interface IMatchHistoryItemProps {
    rank: number;
    name: string;
    tournament: string;
    date: string;
    kingdom: string;
    club: string;
    myMatches: string;
    checked?: boolean;
    onChange?: (checked: boolean) => void;
}

export const MatchHistoryItem: React.FC<IMatchHistoryItemProps> = ({
    rank,
    name,
    tournament,
    date,
    kingdom,
    club,
    myMatches,
    checked = false,
    onChange,
}) => {
    const handleChange = (e: React.ChangeEvent<HTMLInputElement>) => {
        onChange?.(e.target.checked);
    };

    return (
        <tr className={css.match_history_item}>
            <td className={css.match_history_item_value}>{rank}</td>
            <td className={css.match_history_item_value}>{name}</td>
            <td className={css.match_history_item_value}>{tournament}</td>
            <td className={css.match_history_item_value}>{date}</td>
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
