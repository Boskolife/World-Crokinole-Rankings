"use client";

import React, { useState, useRef, useEffect } from "react";
import popupCss from "../styles.module.scss";
import css from "./styles.module.scss";
import { Icon } from "@/shared/ui/icons";
import { usePopup } from "@/shared/contexts/popup-context";
import { useAuth } from "@/shared/hooks/use-auth";
import { CustomCheckbox, Button } from "@/shared/ui";
import { PlaceSearchInput } from "@/shared/ui/place-search-input";
import inputCss from "@/shared/ui/input/styles.module.scss";
import { createClub } from "@/shared/supabase/data";
import { useRouter } from "next/navigation";
import { clientRoutes } from "@/shared/routes/client";
import cn from "classnames";

export const CreateClubPopup: React.FC = () => {
    const { closePopup, isPopupOpen } = usePopup();
    const { user } = useAuth();
    const router = useRouter();
    const [clubName, setClubName] = useState("");
    const [description, setDescription] = useState("");
    const [location, setLocation] = useState("");
    const [inviteOnly, setInviteOnly] = useState(false);
    const [logoFile, setLogoFile] = useState<File | null>(null);
    const [logoPreviewUrl, setLogoPreviewUrl] = useState<string | null>(null);
    const [isSubmitting, setIsSubmitting] = useState(false);
    const [error, setError] = useState<string | null>(null);
    const fileInputRef = useRef<HTMLInputElement>(null);

    useEffect(() => {
        if (logoFile) {
            const url = URL.createObjectURL(logoFile);
            setLogoPreviewUrl(url);
            return () => {
                URL.revokeObjectURL(url);
                setLogoPreviewUrl(null);
            };
        } else {
            setLogoPreviewUrl(null);
        }
    }, [logoFile]);

    if (!isPopupOpen("create-club")) {
        return null;
    }

    const handleClose = () => closePopup("create-club");

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
        if (!location.trim()) {
            setError("Location is required");
            return;
        }
        if (!user?.id) {
            setError("You must be signed in to create a club");
            return;
        }
        setIsSubmitting(true);
        try {
            const club = await createClub({
                title: clubName.trim(),
                description: description.trim(),
                location: location.trim(),
                inviteOnly,
                logoFile,
                userId: user.id,
            });
            handleClose();
            router.push(clientRoutes.clubDetail(club.id));
        } catch (err: unknown) {
            setError(err instanceof Error ? err.message : "Failed to create club");
        } finally {
            setIsSubmitting(false);
        }
    };

    return (
        <div className={cn(popupCss.popup, css.create_club_popup)}>
            <div className={css.create_club_layout}>
                <div className={css.create_club_header}>
                    <h2 className={css.create_club_title}>Create Your Club</h2>
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
                        htmlFor="create-club-name"
                    >
                        Club name
                    </label>
                    <input
                        id="create-club-name"
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
                        htmlFor="create-club-description"
                    >
                        Description
                    </label>
                    <textarea
                        id="create-club-description"
                        placeholder="Tell others what makes your club unique"
                        value={description}
                        onChange={(e) => setDescription(e.target.value)}
                        className={cn(inputCss.form_field_input, css.create_club_description_input)}
                        rows={4}
                    />
                </div>

                <PlaceSearchInput
                    id="create-club-location"
                    label="Location"
                    placeholder="Search for a place or address"
                    value={location}
                    onChange={(result) => setLocation(result.address)}
                    onClear={() => setLocation("")}
                    className={inputCss.form_field}
                    labelClassName={inputCss.form_field_label}
                    inputClassName={cn(
                        inputCss.form_field_input,
                        location && inputCss.form_field_input_with_icon
                    )}
                    wrapperClassName={inputCss.form_field_input_wrapper}
                />

                <CustomCheckbox
                    name="inviteOnly"
                    label="Invite only — only members who are invited can join this club"
                    checked={inviteOnly}
                    onChange={(e) => setInviteOnly(e.target.checked)}
                    className={css.create_club_invite_only}
                />

                <div className={css.create_club_upload_section}>
                    <span className={css.create_club_upload_label}>Add Club Logo</span>
                    <input
                        ref={fileInputRef}
                        type="file"
                        accept=".png,.jpeg,.jpg"
                        onChange={handleFileChange}
                        style={{ display: "none" }}
                    />
                    {logoFile && logoPreviewUrl ? (
                        <div className={css.create_club_logo_preview_wrap}>
                            <img
                                src={logoPreviewUrl}
                                alt="Logo preview"
                                className={css.create_club_logo_preview}
                            />
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
                            <span className={css.create_club_upload_secondary_text}>
                                Upload a logo for your club (recommended: 1116×480px)
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
                        Create club
                    </Button>
                </div>
            </div>
        </div>
    );
};
