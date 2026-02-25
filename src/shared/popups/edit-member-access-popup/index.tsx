"use client";

import React, { useState, useEffect } from "react";
import css from "../styles.module.scss";
import { Icon } from "@/shared/ui/icons";
import { usePopup } from "@/shared/contexts/popup-context";
import { setClubMemberRole, removeClubMember } from "@/shared/supabase/data";
import type { IClub } from "@/shared/types";
import type { IClubMember } from "@/shared/supabase/data";
import { useRouter } from "next/navigation";
import cn from "classnames";

interface EditMemberAccessPopupData {
    club: IClub;
    member: IClubMember;
    adminCount?: number;
    onRemoved?: () => void;
}

function getCountryFlagSrc(country: string | null): string {
    if (!country) return "/images/usa.png";
    const c = (country || "").toLowerCase();
    if (c.includes("usa") || c.includes("united states")) return "/images/usa.png";
    if (c.includes("uk") || c.includes("united kingdom")) return "https://flagcdn.com/w80/gb.png";
    if (c.includes("new zealand")) return "https://flagcdn.com/w80/nz.png";
    return "/images/usa.png";
}

export const EditMemberAccessPopup: React.FC = () => {
    const { closePopup, getPopupData } = usePopup();
    const router = useRouter();
    const data = getPopupData("edit-member-access") as EditMemberAccessPopupData | undefined;
    const [role, setRole] = useState<"admin" | "member">(
        data?.member?.isAdmin ? "admin" : "member"
    );
    const [isSubmitting, setIsSubmitting] = useState(false);
    const [isRemoving, setIsRemoving] = useState(false);
    const [error, setError] = useState<string | null>(null);

    useEffect(() => {
        setRole(data?.member?.isAdmin ? "admin" : "member");
    }, [data?.member?.userId, data?.member?.isAdmin]);

    if (!data?.club || !data?.member?.userId) {
        return null;
    }

    const handleClose = () => closePopup("edit-member-access");

    const handleSave = async () => {
        setError(null);
        if (data.member.isAdmin && role === "member" && (data.adminCount ?? 0) <= 1) {
            setError("Cannot demote the last admin.");
            return;
        }
        setIsSubmitting(true);
        try {
            const ok = await setClubMemberRole(data.club.id, data.member.userId!, role);
            if (ok) {
                router.refresh();
                handleClose();
            } else {
                setError("Failed to update role");
            }
        } catch (err) {
            setError(err instanceof Error ? err.message : "Failed to update");
        } finally {
            setIsSubmitting(false);
        }
    };

    const handleRemove = async () => {
        if (data.member.isAdmin && (data.adminCount ?? 0) <= 1) {
            setError("Cannot remove the last admin.");
            return;
        }
        if (!confirm("Remove this member from the club? This cannot be undone.")) return;
        setError(null);
        setIsRemoving(true);
        try {
            const ok = await removeClubMember(data.club.id, data.member.userId!, data.club.title);
            if (ok) {
                data.onRemoved?.();
                handleClose();
            } else {
                setError("Failed to remove member");
            }
        } catch (err) {
            setError(err instanceof Error ? err.message : "Failed to remove");
        } finally {
            setIsRemoving(false);
        }
    };

    return (
        <div className={css.popup}>
            <div className={css.popup_close}>
                <Icon
                    name="x"
                    className={css.popup_close_icon}
                    onClick={() => !isSubmitting && !isRemoving && handleClose()}
                />
            </div>
            <div className={css.popup_content}>
                <h2 className={css.edit_member_title}>Edit Member Access</h2>
                <p className={css.edit_member_description}>
                    Update the role and permissions for this member.
                </p>
                <div className={css.edit_member_card}>
                    <img
                        src={getCountryFlagSrc(null)}
                        alt=""
                        width={40}
                        height={40}
                        className={css.edit_member_card_flag}
                    />
                    <div className={css.edit_member_card_info}>
                        <span className={css.edit_member_card_name}>{data.member.name}</span>
                        <span className={css.edit_member_card_email}>—</span>
                    </div>
                </div>
                <div className={css.edit_member_role_section}>
                    <span className={css.edit_member_role_label}>Role</span>
                    <label className={css.edit_member_radio}>
                        <span className={css.edit_member_radio_row}>
                            <input
                                type="radio"
                                name="role"
                                checked={role === "admin"}
                                onChange={() => setRole("admin")}
                                disabled={isSubmitting || isRemoving}
                            />
                            <span className={css.edit_member_radio_text}>Admin</span>
                        </span>
                        <span className={css.edit_member_radio_desc}>
                            Can manage club settings, invite/remove members, and generate discount codes.
                        </span>
                    </label>
                    <label className={css.edit_member_radio}>
                        <span className={css.edit_member_radio_row}>
                            <input
                                type="radio"
                                name="role"
                                checked={role === "member"}
                                onChange={() => setRole("member")}
                                disabled={isSubmitting || isRemoving}
                            />
                            <span className={css.edit_member_radio_text}>Member</span>
                        </span>
                        <span className={css.edit_member_radio_desc}>
                            Can view members, leaderboard, and use club discounts.
                        </span>
                    </label>
                </div>
                {error && <div className={css.popup_error}>{error}</div>}
                <div className={css.edit_member_actions}>
                    <button
                        type="button"
                        className={cn(css.popup_button, css.popup_button_secondary)}
                        onClick={handleClose}
                        disabled={isSubmitting || isRemoving}
                    >
                        Cancel
                    </button>
                    <button
                        type="button"
                        className={cn(css.popup_button, css.popup_button_primary)}
                        onClick={handleSave}
                        disabled={isSubmitting || isRemoving}
                    >
                        {isSubmitting ? "Saving…" : "Save Changes"}
                    </button>
                </div>
                <button
                    type="button"
                    className={css.edit_member_remove}
                    onClick={handleRemove}
                    disabled={isSubmitting || isRemoving}
                >
                    {isRemoving ? "Removing…" : "Remove Member"}
                </button>
            </div>
        </div>
    );
};
