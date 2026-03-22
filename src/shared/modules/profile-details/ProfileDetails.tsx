"use client";
import React, { useEffect, useState } from "react";
import css from "./styles.module.scss";
import Image from "next/image";
import { RootLink } from "@/shared/ui";
import { clientRoutes } from "@/shared/routes/client";
import cn from "classnames";
import { useUserProfile, useCurrentUserPlayer, useAuth } from "@/shared/hooks";
import { isSupabaseConfigured, supabase } from "@/shared/supabase/client";
import { invalidateProfileCache, notifyProfileUpdated } from "@/shared/hooks/use-user-profile";
import { useRouter } from "next/navigation";

export const ProfileDetails: React.FC = () => {
    const { fullName, email, profile } = useUserProfile();
    const { user, isAuth, isMounted } = useAuth();
    const { player } = useCurrentUserPlayer();
    const router = useRouter();
    const [mode, setMode] = useState<
        "overview" | "security" | "securityEmail" | "securityEmailSent" | "securityPassword"
    >("overview");
    const [emailInput, setEmailInput] = useState("");
    const [emailError, setEmailError] = useState<string | null>(null);
    const [emailLoading, setEmailLoading] = useState(false);
    const [passwordOld, setPasswordOld] = useState("");
    const [passwordNew, setPasswordNew] = useState("");
    const [passwordError, setPasswordError] = useState<string | null>(null);
    const [passwordMessage, setPasswordMessage] = useState<string | null>(null);
    const [passwordLoading, setPasswordLoading] = useState(false);
    const kingdom = player?.kingdom || profile?.country || "—";
    const club = player?.club || profile?.club || "—";
    const singlesRating = player?.singlesRating ?? player?.rating;
    const doublesRating = player?.doublesRating ?? null;
    const laurels24Mo = player?.laurels24mo ?? null;
    const showKingBadge =
        Boolean(player?.title?.trim() || player?.clubTitle?.trim()) &&
        kingdom !== "—" &&
        kingdom.trim() !== "";
    const avatarSrc =
        player?.avatarUrl?.trim() || profile?.avatar_url?.trim() || "/svg/avatar-placeholder.svg";

    const normalizedClub = (() => {
        const raw = club.trim();
        return !raw || /^[\s,]*$/.test(raw) ? "—" : raw;
    })();

    const normalizedKingdom = (() => {
        const raw = kingdom.trim();
        return !raw || /^[\s,]*$/.test(raw) ? "—" : raw;
    })();

    const handleOpenSecurity = () => setMode("security");
    const handleBackToOverview = () => {
        setMode("overview");
        setEmailInput("");
        setEmailError(null);
        setEmailLoading(false);
        setPasswordOld("");
        setPasswordNew("");
        setPasswordError(null);
        setPasswordMessage(null);
        setPasswordLoading(false);
        if (typeof window !== "undefined") {
            window.localStorage.removeItem("wcr-profile-email-change");
        }
    };

    const handleChangeEmail = () => {
        setMode("securityEmail");
        setEmailInput("");
        setEmailError(null);
    };

    const handleChangePassword = () => {
        setMode("securityPassword");
        setPasswordOld("");
        setPasswordNew("");
        setPasswordError(null);
        setPasswordMessage(null);
    };

    const handleSubmitNewEmail = async () => {
        const nextEmail = emailInput.trim();
        if (!nextEmail) {
            setEmailError("Email is required");
            return;
        }
        if (!/^[^@\s]+@[^@\s]+\.[^@\s]+$/.test(nextEmail)) {
            setEmailError("Please enter a valid email address");
            return;
        }
        if (!user?.id || !isSupabaseConfigured) {
            setEmailError("Email change is not available right now.");
            return;
        }
        setEmailLoading(true);
        setEmailError(null);
        try {
            const { error } = await supabase.auth.updateUser({ email: nextEmail });
            if (error) {
                setEmailError(error.message);
                return;
            }
            invalidateProfileCache(user.id);
            notifyProfileUpdated(user.id);
            setMode("securityEmailSent");
            if (typeof window !== "undefined") {
                window.localStorage.setItem(
                    "wcr-profile-email-change",
                    JSON.stringify({ mode: "securityEmailSent", email: nextEmail })
                );
            }
        } catch {
            setEmailError(
                "Could not reach Supabase. Please check NEXT_PUBLIC_SUPABASE_URL and your Internet connection."
            );
        } finally {
            setEmailLoading(false);
        }
    };

    const handleSubmitNewPassword = async () => {
        const oldPwd = passwordOld.trim();
        const newPwd = passwordNew.trim();
        if (!newPwd) {
            setPasswordError("New password is required");
            setPasswordMessage(null);
            return;
        }
        if (newPwd.length < 8) {
            setPasswordError("Password must be at least 8 characters");
            setPasswordMessage(null);
            return;
        }
        if (!user?.email || !isSupabaseConfigured) {
            setPasswordError("Password change is not available right now.");
            return;
        }
        setPasswordLoading(true);
        setPasswordError(null);
        setPasswordMessage(null);
        try {
            const { error: signInError } = await supabase.auth.signInWithPassword({
                email: user.email,
                password: oldPwd,
            });
            if (signInError) {
                setPasswordError("Current password is incorrect");
                return;
            }
            const { error: updateError } = await supabase.auth.updateUser({
                password: newPwd,
            });
            if (updateError) {
                setPasswordError(updateError.message);
                return;
            }
            setPasswordOld("");
            setPasswordNew("");
            setPasswordError(null);
            setPasswordMessage("Password updated successfully.");
        } catch {
            setPasswordError(
                "Could not reach Supabase. Please check NEXT_PUBLIC_SUPABASE_URL and your Internet connection."
            );
        } finally {
            setPasswordLoading(false);
        }
    };

    useEffect(() => {
        if (typeof window === "undefined" || !isMounted || !isSupabaseConfigured) return;
        if (!isAuth || !user?.id || !email) return;
        try {
            const raw = window.localStorage.getItem("wcr-profile-email-change");
            if (!raw) return;
            const parsed = JSON.parse(raw) as { mode?: string; email?: string };
            if (parsed.mode !== "securityEmailSent" || !parsed.email) return;

            const pending = parsed.email.trim().toLowerCase();
            const current = email.trim().toLowerCase();

            if (current === pending) {
                window.localStorage.removeItem("wcr-profile-email-change");
                invalidateProfileCache(user.id);
                notifyProfileUpdated(user.id);
                setMode((m) => (m === "securityEmailSent" ? "overview" : m));
                setEmailInput("");
                return;
            }

            setEmailInput(parsed.email);
            setMode((m) => {
                if (m === "security" || m === "securityEmail" || m === "securityPassword") {
                    return m;
                }
                return "securityEmailSent";
            });
        } catch {
            // ignore
        }
    }, [isMounted, isAuth, user?.id, email]);

    if (mode === "security" || mode === "securityEmail" || mode === "securityEmailSent" || mode === "securityPassword") {
        return (
            <div className="container">
                <div className={cn(css.profile_details_content, css.profile_details_content_centered)}>
                    <div className={css.profile_details_security}>
                        <div className={css.profile_details_security_header}>
                            <button
                                type="button"
                                className={css.profile_details_security_back}
                                onClick={handleBackToOverview}
                                aria-label="Back to profile overview"
                            >
                                <span className={css.profile_details_security_back_icon} />
                            </button>
                            <h3 className={css.profile_details_security_title}>
                                {mode === "securityEmail" ||
                                mode === "securityEmailSent" ||
                                mode === "securityPassword"
                                    ? "Back"
                                    : "Change email or password"}
                            </h3>
                        </div>
                        {mode === "security" && (
                            <div className={css.profile_details_security_body}>
                                <div className={css.profile_details_security_section}>
                                    <h4 className={css.profile_details_security_section_title}>
                                        Current email
                                    </h4>
                                    <p className={css.profile_details_security_text}>
                                        <span>You are logged in as&nbsp;</span>
                                        <span className={css.profile_details_security_text_email}>
                                            {email || "-"}
                                        </span>
                                    </p>
                                    <button
                                        type="button"
                                        className={css.profile_details_security_button}
                                        onClick={handleChangeEmail}
                                    >
                                        Change my email
                                    </button>
                                </div>
                                <div className={css.profile_details_security_section}>
                                    <h4 className={css.profile_details_security_section_title}>
                                        Password
                                    </h4>
                                    <button
                                        type="button"
                                        className={css.profile_details_security_button}
                                        onClick={handleChangePassword}
                                    >
                                        Change my password
                                    </button>
                                </div>
                            </div>
                        )}
                        {mode === "securityEmail" && (
                            <div className={css.profile_details_security_change_email}>
                                <h4 className={css.profile_details_security_change_email_title}>
                                    Change my email
                                </h4>
                                <div className={css.profile_details_security_change_email_text}>
                                    <p>
                                        <span>Your current email is&nbsp;</span>
                                        <span className={css.profile_details_security_text_email}>
                                            {email || "-"}
                                        </span>
                                    </p>
                                    <p>
                                        Please enter a new email and we will send you a confirmation
                                        link to verify it.
                                    </p>
                                </div>
                                <div className={css.profile_details_security_change_email_field}>
                                    <label
                                        className={
                                            css.profile_details_security_change_email_field_label
                                        }
                                    >
                                        Email
                                    </label>
                                    <input
                                        type="email"
                                        className={
                                            css.profile_details_security_change_email_field_input
                                        }
                                        placeholder="Enter your new email"
                                        value={emailInput}
                                        onChange={(e) => {
                                            setEmailInput(e.target.value);
                                            if (emailError) setEmailError(null);
                                        }}
                                    />
                                </div>
                                {emailError && (
                                    <p className={css.profile_details_security_change_email_error}>
                                        {emailError}
                                    </p>
                                )}
                                <button
                                    type="button"
                                    className={cn(
                                        css.profile_details_security_change_email_button,
                                        emailInput.trim() &&
                                            css.profile_details_security_change_email_button_active
                                    )}
                                    onClick={handleSubmitNewEmail}
                                    disabled={emailLoading}
                                >
                                    {emailLoading ? "Sending..." : "Change my email"}
                                </button>
                            </div>
                        )}
                        {mode === "securityEmailSent" && (
                            <div className={css.profile_details_security_change_email}>
                                <h4 className={css.profile_details_security_change_email_title}>
                                    Check your email
                                </h4>
                                <div className={css.profile_details_security_change_email_text}>
                                    <p>We just sent you a temporary login link.</p>
                                    <p>
                                        <span>Please check your inbox at&nbsp;</span>
                                        <span className={css.profile_details_security_text_email}>
                                            {emailInput || email || "-"}
                                        </span>
                                        .
                                    </p>
                                </div>
                            </div>
                        )}
                        {mode === "securityPassword" && (
                            <div className={css.profile_details_security_change_password}>
                                <h4 className={css.profile_details_security_change_password_title}>
                                    Change password
                                </h4>
                                <p className={css.profile_details_security_change_password_subtitle}>
                                    Create a new password
                                </p>
                                <div className={css.profile_details_security_change_password_field}>
                                    <label
                                        className={
                                            css.profile_details_security_change_password_field_label
                                        }
                                    >
                                        Old Password
                                    </label>
                                    <input
                                        type="password"
                                        className={
                                            css.profile_details_security_change_password_field_input
                                        }
                                        placeholder="Enter your old password"
                                        value={passwordOld}
                                        onChange={(e) => {
                                            setPasswordOld(e.target.value);
                                            if (passwordError) setPasswordError(null);
                                            if (passwordMessage) setPasswordMessage(null);
                                        }}
                                    />
                                    <button
                                        type="button"
                                        className={
                                            css.profile_details_security_change_password_forgot
                                        }
                                        onClick={() => router.push(clientRoutes.forgotPassword)}
                                    >
                                        Forgot password?
                                    </button>
                                </div>
                                <div className={css.profile_details_security_change_password_field}>
                                    <label
                                        className={
                                            css.profile_details_security_change_password_field_label
                                        }
                                    >
                                        New Password
                                    </label>
                                    <input
                                        type="password"
                                        className={
                                            css.profile_details_security_change_password_field_input
                                        }
                                        placeholder="Enter your new password"
                                        value={passwordNew}
                                        onChange={(e) => {
                                            setPasswordNew(e.target.value);
                                            if (passwordError) setPasswordError(null);
                                            if (passwordMessage) setPasswordMessage(null);
                                        }}
                                    />
                                </div>
                                {passwordError && (
                                    <p className={css.profile_details_security_change_password_error}>
                                        {passwordError}
                                    </p>
                                )}
                                {passwordMessage && (
                                    <p className={css.profile_details_security_change_password_success}>
                                        {passwordMessage}
                                    </p>
                                )}
                                <button
                                    type="button"
                                    className={cn(
                                        css.profile_details_security_change_password_button,
                                        passwordOld.trim() &&
                                            passwordNew.trim() &&
                                            css.profile_details_security_change_password_button_active
                                    )}
                                    onClick={handleSubmitNewPassword}
                                    disabled={passwordLoading}
                                >
                                    {passwordLoading ? "Saving..." : "Save password"}
                                </button>
                            </div>
                        )}
                    </div>
                </div>
            </div>
        );
    }

    return (
        <div className="container">
            <div className={css.profile_details_content}>
                <div className={css.profile_details_left}>
                    <div className={css.profile_details_left_profile}>
                        <Image
                            src={avatarSrc}
                            alt="Profile"
                            width={164}
                            height={164}
                            className={css.profile_details_left_profile_image}
                            unoptimized={avatarSrc.includes("supabase.co")}
                        />
                        <div className={css.profile_details_left_profile_info}>
                            <h4
                                className={
                                    css.profile_details_left_profile_name
                                }
                            >
                                {player?.name || fullName}
                            </h4>
                            {showKingBadge && (
                                <span className={css.profile_details_left_profile_role}>
                                    👑 King of {normalizedKingdom}
                                </span>
                            )}
                        </div>
                    </div>
                    <div className={css.profile_details_left_buttons}>
                        <RootLink
                            href={clientRoutes.profileEdit}
                            className={cn(css.profile_details_left_button, css.profile_details_left_button_link)}
                        >
                            Edit profile
                        </RootLink>
                        {(!player || player.isAutoCreated) && (
                            <RootLink
                                href={clientRoutes.claimHistory}
                                className={cn(css.profile_details_left_button, css.profile_details_left_button_link, css.profile_details_left_button_link_primary)}
                            >
                                Claim history
                            </RootLink>
                        )}
                    </div>
                </div>
                <div className={css.profile_details_right}>
                    <>
                            <div className={css.profile_details_right_header}>
                                <p className={css.profile_details_right_header_email}>
                                    <b>Email:</b>
                                    <span>{email || "-"}</span>
                                </p>
                                <RootLink
                                    href={clientRoutes.profileEdit}
                                    className={css.profile_details_right_header_link}
                                    onClick={(e) => {
                                        e.preventDefault();
                                        handleOpenSecurity();
                                    }}
                                >
                                    Change email or password
                                </RootLink>
                            </div>
                            <div className={css.profile_details_right_info}>
                                <div className={css.profile_details_right_info_item}>
                                    <span
                                        className={
                                            css.profile_details_right_info_item_label
                                        }
                                    >
                                        Singles Rating
                                    </span>
                                    <p
                                        className={
                                            css.profile_details_right_info_item_value
                                        }
                                    >
                                        {player ? (singlesRating != null ? String(singlesRating) : "—") : "—"}
                                    </p>
                                </div>
                                <div className={css.profile_details_right_info_item}>
                                    <span
                                        className={
                                            css.profile_details_right_info_item_label
                                        }
                                    >
                                        Laurels (24 mo)
                                    </span>
                                    <p
                                        className={
                                            css.profile_details_right_info_item_value
                                        }
                                    >
                                        {laurels24Mo != null ? String(laurels24Mo) : "—"}
                                    </p>
                                </div>
                                <div className={css.profile_details_right_info_item}>
                                    <span
                                        className={
                                            css.profile_details_right_info_item_label
                                        }
                                    >
                                        Doubles Rating
                                    </span>
                                    <p
                                        className={
                                            css.profile_details_right_info_item_value
                                        }
                                    >
                                        {player ? (doublesRating != null ? String(doublesRating) : "—") : "—"}
                                    </p>
                                </div>
                                <div className={css.profile_details_right_info_item}>
                                    <span
                                        className={
                                            css.profile_details_right_info_item_label
                                        }
                                    >
                                        Club
                                    </span>
                                    <p
                                        className={
                                            css.profile_details_right_info_item_value
                                        }
                                    >
                                        {normalizedClub}
                                    </p>
                                </div>
                                <div className={css.profile_details_right_info_item}>
                                    <span
                                        className={
                                            css.profile_details_right_info_item_label
                                        }
                                    >
                                        Kingdom
                                    </span>
                                    <p
                                        className={
                                            css.profile_details_right_info_item_value
                                        }
                                    >
                                        {normalizedKingdom}
                                    </p>
                                </div>
                            </div>
                        </>
                </div>
            </div>
        </div>
    );
};
