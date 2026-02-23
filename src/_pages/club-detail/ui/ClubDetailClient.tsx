"use client";

import React, { useState, useCallback, useEffect } from "react";
import Image from "next/image";
import { Icon } from "@/shared/ui/icons";
import { RootLink } from "@/shared/ui/links/root-link";
import { useTableSort } from "@/shared/hooks";
import { useAuth } from "@/shared/hooks/use-auth";
import { useUserProfile } from "@/shared/hooks/use-user-profile";
import { usePopup } from "@/shared/contexts/popup-context";
import type { IClub } from "@/shared/types";
import type {
    IClubMember,
    IClubAdmin,
    IClubDiscount,
} from "@/shared/supabase/data";
import css from "./styles.module.scss";
import cn from "classnames";

interface ClubDetailClientProps {
    club: IClub;
    members: IClubMember[];
    admins: IClubAdmin[];
    discounts: IClubDiscount[];
}

function getCountryFlagSrc(country: string | null): string {
    if (!country) return "/images/usa.png";
    const c = country.toLowerCase();
    if (c.includes("usa") || c.includes("united states")) return "/images/usa.png";
    if (c.includes("uk") || c.includes("united kingdom")) return "https://flagcdn.com/w80/gb.png";
    if (c.includes("new zealand")) return "https://flagcdn.com/w80/nz.png";
    return "/images/usa.png";
}

const DEFAULT_DISCOUNT_DESCRIPTION =
    "Share this code with your club to get 10% off at BrownCastle Games. 5% club credit + 5% instant savings";

export function ClubDetailClient({
    club,
    members,
    admins,
    discounts: initialDiscounts,
}: ClubDetailClientProps) {
    const { user } = useAuth();
    const { fullName } = useUserProfile();
    const { openPopup } = usePopup();
    const isAdmin = Boolean(user?.id && admins.some((a) => a.userId === user.id));
    const isMember = Boolean(fullName && members.some((m) => m.name === fullName));

    const {
        sortColumn,
        sortDirection,
        sortedData: sortedMembers,
        handleSort,
    } = useTableSort<IClubMember>({
        data: members,
        sortFn: (row, column) => {
            switch (column) {
                case "name":
                    return row.name.toLowerCase();
                case "laurels":
                    return row.laurels;
                case "singlesRating":
                    return row.singlesRating;
                case "doublesRating":
                    return row.doublesRating;
                default:
                    return "";
            }
        },
    });

    const getSortIcon = (column: string) => {
        if (sortColumn !== column) return "chevron_down";
        return sortDirection === "asc" ? "chevron_up" : "chevron_down";
    };

    const [discounts, setDiscounts] = useState<IClubDiscount[]>(
        initialDiscounts
    );

    useEffect(() => {
        setDiscounts(initialDiscounts);
    }, [initialDiscounts]);

    const handleOpenAddDiscount = useCallback(() => {
        openPopup("edit-club-discount", { club, discount: null });
    }, [openPopup, club]);

    const handleOpenEditDiscount = useCallback(
        (discount: IClubDiscount) => {
            openPopup("edit-club-discount", { club, discount });
        },
        [openPopup, club]
    );

    const handleOpenDeleteDiscount = useCallback(
        (discount: IClubDiscount) => {
            openPopup("club-discount-delete-confirm", { club, discount });
        },
        [openPopup, club]
    );

    const handleCopyCode = useCallback((code: string) => {
        if (!code) return;
        navigator.clipboard.writeText(code);
    }, []);

    return (
        <section className={css.club_detail}>
            <div className="container">
                <header className={css.club_detail_header}>
                    <div className={css.club_detail_header_avatar}>
                        <Image
                            src={club.image || "/images/news-placeholder.png"}
                            alt=""
                            width={200}
                            height={200}
                            className={css.club_detail_header_avatar_img}
                        />
                    </div>
                    <div className={css.club_detail_header_info}>
                        <h1 className={css.club_detail_title}>{club.title}</h1>
                        <p className={css.club_detail_description}>
                            {club.description}
                        </p>
                        {isAdmin ? (
                            <button
                                type="button"
                                className={css.club_detail_edit_btn}
                                onClick={() => openPopup("edit-club", { club })}
                            >
                                <Icon name="edit_2" />
                                Edit Club
                            </button>
                        ) : (
                            <button type="button" className={css.club_detail_join_btn}>
                                Join Club
                            </button>
                        )}
                    </div>
                    <div className={css.club_detail_header_meta}>
                        <div className={css.club_detail_meta_item}>
                            <Icon name="members" className={css.club_detail_meta_icon} />
                            <span>{club.members}</span>
                        </div>
                        <div className={css.club_detail_meta_item}>
                            <Image
                                src={club.country || "/images/usa.png"}
                                alt=""
                                width={24}
                                height={24}
                                className={css.club_detail_meta_flag}
                            />
                            <span>{club.location || "USA"}</span>
                        </div>
                    </div>
                </header>

                <div className={css.club_detail_layout}>
                    <div className={css.club_detail_members_card}>
                        <h2 className={css.club_detail_card_title}>
                            <Icon name="members" className={css.club_detail_card_title_icon} />
                            Members
                        </h2>
                        <div className={css.club_detail_table_wrapper}>
                            <table className={css.club_detail_table}>
                                <thead>
                                    <tr>
                                        <th className={css.club_detail_th}>
                                            <button
                                                type="button"
                                                className={css.club_detail_th_btn}
                                                onClick={() => handleSort("name")}
                                            >
                                                Player
                                                <Icon
                                                    name={getSortIcon("name")}
                                                    className={cn(css.club_detail_th_icon, {
                                                        [css.club_detail_th_icon_active]: sortColumn === "name",
                                                    })}
                                                />
                                            </button>
                                        </th>
                                        <th className={css.club_detail_th}>
                                            <button
                                                type="button"
                                                className={css.club_detail_th_btn}
                                                onClick={() => handleSort("laurels")}
                                            >
                                                Laurels
                                                <Icon
                                                    name={getSortIcon("laurels")}
                                                    className={cn(css.club_detail_th_icon, {
                                                        [css.club_detail_th_icon_active]: sortColumn === "laurels",
                                                    })}
                                                />
                                            </button>
                                        </th>
                                        <th className={css.club_detail_th}>
                                            <button
                                                type="button"
                                                className={css.club_detail_th_btn}
                                                onClick={() => handleSort("singlesRating")}
                                            >
                                                Singles Rating
                                                <Icon
                                                    name={getSortIcon("singlesRating")}
                                                    className={cn(css.club_detail_th_icon, {
                                                        [css.club_detail_th_icon_active]: sortColumn === "singlesRating",
                                                    })}
                                                />
                                            </button>
                                        </th>
                                        <th className={css.club_detail_th}>
                                            <button
                                                type="button"
                                                className={css.club_detail_th_btn}
                                                onClick={() => handleSort("doublesRating")}
                                            >
                                                Doubles Rating
                                                <Icon
                                                    name={getSortIcon("doublesRating")}
                                                    className={cn(css.club_detail_th_icon, {
                                                        [css.club_detail_th_icon_active]: sortColumn === "doublesRating",
                                                    })}
                                                />
                                            </button>
                                        </th>
                                    </tr>
                                </thead>
                                <tbody>
                                    {sortedMembers.map((member, index) => {
                                        const isCurrentUser =
                                            (isAdmin || isMember) &&
                                            Boolean(fullName && member.name === fullName);
                                        return (
                                            <tr
                                                key={`${member.name}-${index}`}
                                                className={cn(css.club_detail_row, {
                                                    [css.club_detail_row_even]:
                                                        index % 2 === 1 && !isCurrentUser,
                                                    [css.club_detail_row_you]: isCurrentUser,
                                                })}
                                            >
                                                <td className={css.club_detail_cell}>
                                                    <span className={css.club_detail_player_rank}>
                                                        #{index + 1}
                                                    </span>{" "}
                                                    <RootLink
                                                        href={`/players?search=${encodeURIComponent(member.name)}`}
                                                        className={css.club_detail_player_link}
                                                    >
                                                        {member.name}
                                                        {isCurrentUser ? " (you)" : ""}
                                                    </RootLink>
                                                </td>
                                                <td className={css.club_detail_cell}>
                                                    {member.laurels}
                                                </td>
                                                <td className={css.club_detail_cell}>
                                                    {member.singlesRating}
                                                </td>
                                                <td className={css.club_detail_cell}>
                                                    {member.doublesRating}
                                                </td>
                                            </tr>
                                        );
                                    })}
                                </tbody>
                            </table>
                        </div>
                    </div>

                    <div className={css.club_detail_sidebar}>
                        <aside className={css.club_detail_admins_card}>
                            <h2 className={css.club_detail_card_title}>
                                <Icon name="members" className={css.club_detail_card_title_icon} />
                                Admins
                            </h2>
                            <ul className={css.club_detail_admins_list}>
                                {admins.map((admin) => (
                                    <li key={admin.id} className={css.club_detail_admin_item}>
                                        <Image
                                            src={getCountryFlagSrc(admin.country)}
                                            alt=""
                                            width={24}
                                            height={24}
                                            className={css.club_detail_admin_flag}
                                        />
                                        <span className={css.club_detail_admin_name}>{admin.fullName}</span>
                                        <button type="button" className={css.club_detail_chat_btn}>
                                            <Icon name="share" className={css.club_detail_chat_icon} />
                                            Chat
                                        </button>
                                    </li>
                                ))}
                            </ul>
                        </aside>

                        {isAdmin && (
                            <>
                                {discounts.length > 0 && (
                                    <ul className={css.club_detail_discount_list}>
                                        {discounts.map((d) => (
                                            <li
                                                key={d.id}
                                                className={css.club_detail_discount_card}
                                            >
                                                <div className={css.club_detail_discount_header}>
                                                    <h2 className={css.club_detail_discount_card_heading}>
                                                        <Icon
                                                            name="coins"
                                                            className={css.club_detail_discount_card_heading_icon}
                                                        />
                                                        Club Discount
                                                    </h2>
                                                    <div className={css.club_detail_discount_actions}>
                                                        <button
                                                            type="button"
                                                            className={css.club_detail_discount_action_btn}
                                                            onClick={() => handleOpenEditDiscount(d)}
                                                            aria-label="Edit discount"
                                                        >
                                                            <Icon name="edit_2" />
                                                        </button>
                                                        <button
                                                            type="button"
                                                            className={css.club_detail_discount_action_btn}
                                                            onClick={() => handleOpenDeleteDiscount(d)}
                                                            aria-label="Delete discount"
                                                        >
                                                            <Icon name="trash" />
                                                        </button>
                                                    </div>
                                                </div>
                                                <p className={css.club_detail_discount_description}>
                                                    {d.description || DEFAULT_DISCOUNT_DESCRIPTION}
                                                </p>
                                                <div className={css.club_detail_discount_code_wrapper}>
                                                    <span className={css.club_detail_discount_code}>
                                                        {d.code}
                                                    </span>
                                                    <button
                                                        type="button"
                                                        className={css.club_detail_discount_copy_btn}
                                                        onClick={() => handleCopyCode(d.code)}
                                                    >
                                                        <Icon
                                                            name="copy"
                                                            className={css.club_detail_discount_copy_icon}
                                                        />
                                                        Copy
                                                    </button>
                                                </div>
                                            </li>
                                        ))}
                                    </ul>
                                )}
                                <button
                                    type="button"
                                    className={css.club_detail_discount_create_btn}
                                    onClick={handleOpenAddDiscount}
                                >
                                    Create New Club Discount
                                </button>
                            </>
                        )}
                    </div>
                </div>
            </div>
        </section>
    );
}
