"use client";

import React, { useState, useRef, useEffect } from "react";
import Image from "next/image";
import popupCss from "../styles.module.scss";
import css from "../create-club-popup/styles.module.scss";
import { Icon } from "@/shared/ui/icons";
import { usePopup } from "@/shared/contexts/popup-context";
import { useAuth } from "@/shared/hooks/use-auth";
import { CustomCheckbox, Button, CustomRoundedDropdown } from "@/shared/ui";
import { locationCountryOptions } from "@/shared/constants/dropdown-options";
import inputCss from "@/shared/ui/input/styles.module.scss";
import { updateClub } from "@/shared/supabase/data";
import { useRouter } from "next/navigation";
import cn from "classnames";
import type { IClub } from "@/shared/types";

interface EditClubPopupData {
    club: IClub;
}

export const EditClubPopup: React.FC = () => {
    const { closePopup, isPopupOpen, getPopupData } = usePopup();
    const { user } = useAuth();
    const router = useRouter();
    const data = getPopupData("edit-club") as EditClubPopupData | undefined;

    const [clubName, setClubName] = useState(data?.club?.title ?? "");
    const [description, setDescription] = useState(data?.club?.description ?? "");
    const [location, setLocation] = useState(data?.club?.location ?? "");
    const [inviteOnly, setInviteOnly] = useState(data?.club?.isLocked ?? false);
    const [logoFile, setLogoFile] = useState<File | null>(null);
    const [newLogoPreview, setNewLogoPreview] = useState<string | null>(null);
    const [isSubmitting, setIsSubmitting] = useState(false);
    const [error, setError] = useState<string | null>(null);
    const fileInputRef = useRef<HTMLInputElement>(null);

    useEffect(() => {
        if (logoFile) {
            const url = URL.createObjectURL(logoFile);
            setNewLogoPreview(url);
            return () => URL.revokeObjectURL(url);
        }
        setNewLogoPreview(null);
    }, [logoFile]);

    useEffect(() => {
        if (data?.club) {
            setClubName(data.club.title ?? "");
            setDescription(data.club.description ?? "");
            setLocation(data.club.location ?? "");
            setInviteOnly(data.club.isLocked ?? false);
        }
    }, [data?.club?.id]);

    if (!isPopupOpen("edit-club") || !data?.club) {
        return null;
    }

    const handleClose = () => closePopup("edit-club");

    const handleFileChange = (e: React.ChangeEvent<HTMLInputElement>) => {
        const file = e.target.files?.[0];
        if (file) {
            if (file.size > 5 * 1024 * 1024) {
                setError("File size must be up to 5 MB");
                return;
            }
            const ext = file.name.split(".").pop()?.toLowerCase();
            if (ext && !["png", "jpeg", "jpg"].includes(ext)) {
                setError("Only png, jpeg are allowed");
                return;
            }
            setError(null);
            setLogoFile(file);
        }
    };

    const handleDrop = (e: React.DragEvent) => {
        e.preventDefault();
        const file = e.dataTransfer.files?.[0];
        if (file) {
            if (file.size > 5 * 1024 * 1024) {
                setError("File size must be up to 5 MB");
                return;
            }
            const ext = file.name.split(".").pop()?.toLowerCase();
            if (ext && !["png", "jpeg", "jpg"].includes(ext)) {
                setError("Only png, jpeg are allowed");
                return;
            }
            setError(null);
            setLogoFile(file);
        }
    };

    const handleDragOver = (e: React.DragEvent) => e.preventDefault();

    const handleSubmit = async () => {
        setError(null);
        if (!clubName.trim()) {
            setError("Club name is required");
            return;
        }
        if (!user?.id) {
            setError("You must be signed in to edit the club");
            return;
        }
        setIsSubmitting(true);
        try {
            await updateClub({
                clubId: data.club.id,
                title: clubName.trim(),
                description: description.trim(),
                location: location.trim(),
                inviteOnly,
                logoFile,
                userId: user.id,
            });
            router.refresh();
            handleClose();
        } catch (err: unknown) {
            setError(err instanceof Error ? err.message : "Failed to update club");
        } finally {
            setIsSubmitting(false);
        }
    };

    return (
        <div className={cn(popupCss.popup, css.create_club_popup)}>
            <div className={css.create_club_layout}>
                <div className={css.create_club_header}>
                    <h2 className={css.create_club_title}>Edit Club Information</h2>
                    <button
                        type="button"
                        className={css.create_club_close}
                        onClick={handleClose}
                        aria-label="Close"
                    >
                        <Icon name="x" className={popupCss.popup_close_icon} />
                    </button>
                </div>
                <div className={css.create_club_body}>
                    {error && (
                        <div className={popupCss.popup_error}>{error}</div>
                    )}

                    <div className={inputCss.form_field}>
                    <label
                        className={inputCss.form_field_label}
                        htmlFor="edit-club-name"
                    >
                        Club name
                    </label>
                    <input
                        id="edit-club-name"
                        type="text"
                        placeholder="Philadelphia Knights"
                        value={clubName}
                        onChange={(e) => setClubName(e.target.value)}
                        className={inputCss.form_field_input}
                        autoComplete="off"
                    />
                </div>

                <div className={inputCss.form_field}>
                    <label
                        className={inputCss.form_field_label}
                        htmlFor="edit-club-description"
                    >
                        Description
                    </label>
                    <textarea
                        id="edit-club-description"
                        placeholder="Tell others what makes your club unique"
                        value={description}
                        onChange={(e) => setDescription(e.target.value)}
                        className={cn(inputCss.form_field_input, css.create_club_description_input)}
                        rows={4}
                    />
                </div>

                <div className={inputCss.form_field}>
                    <label
                        className={inputCss.form_field_label}
                        htmlFor="edit-club-location"
                    >
                        Location
                    </label>
                    <CustomRoundedDropdown
                        id="edit-club-location"
                        placeholder="Select location"
                        options={locationCountryOptions}
                        value={location}
                        onChange={setLocation}
                    />
                </div>

                <CustomCheckbox
                    name="inviteOnly"
                    label="Invite only — only members who are invited can join this club"
                    checked={inviteOnly}
                    onChange={(e) => setInviteOnly(e.target.checked)}
                    className={css.create_club_invite_only}
                />

                <div className={css.create_club_upload_section}>
                    <span className={css.create_club_upload_label}>Club Logo</span>
                    <input
                        ref={fileInputRef}
                        type="file"
                        accept=".png,.jpeg,.jpg"
                        onChange={handleFileChange}
                        style={{ display: "none" }}
                    />
                    {newLogoPreview || data.club.image ? (
                        <div className={css.create_club_logo_preview_wrap}>
                            {newLogoPreview ? (
                                <img
                                    src={newLogoPreview}
                                    alt="Logo preview"
                                    className={css.create_club_logo_preview}
                                />
                            ) : (
                                <Image
                                    src={data.club.image!}
                                    alt="Current logo"
                                    width={200}
                                    height={120}
                                    className={css.create_club_logo_preview}
                                    unoptimized
                                />
                            )}
                            <button
                                type="button"
                                className={css.create_club_logo_change_btn}
                                onClick={() => fileInputRef.current?.click()}
                            >
                                Change image
                            </button>
                        </div>
                    ) : (
                        <div
                            className={css.create_club_upload_zone}
                            onClick={() => fileInputRef.current?.click()}
                            onDrop={handleDrop}
                            onDragOver={handleDragOver}
                        >
                            <Icon name="arrow_up" className={css.create_club_upload_icon} />
                            <span className={css.create_club_upload_primary_text}>
                                Choose a file or drag & drop it here.
                            </span>
                            <span className={css.create_club_upload_secondary_text}>
                                png, jpeg - Up to 5 MB
                            </span>
                            <button
                                type="button"
                                className={css.create_club_upload_btn}
                                onClick={(e) => {
                                    e.stopPropagation();
                                    fileInputRef.current?.click();
                                }}
                            >
                                <Icon name="arrow_up" />
                                Upload Image
                            </button>
                        </div>
                    )}
                </div>
                </div>
                <div className={css.create_club_footer}>
                    <Button
                        type="button"
                        buttonType="secondary"
                        className={css.create_club_submit}
                        onClick={handleSubmit}
                        disabled={isSubmitting}
                    >
                        Save changes
                    </Button>
                </div>
            </div>
        </div>
    );
};
