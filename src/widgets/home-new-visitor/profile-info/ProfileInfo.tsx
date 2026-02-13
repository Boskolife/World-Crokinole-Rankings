import React from "react";
import css from "./styles.module.scss";
import Image from "next/image";
import { useProfileInfo, useUserProfile } from "@/shared/hooks";

type ProfileInfoProps = {
    countryOverride?: string;
    clubOverride?: string;
};

export const ProfileInfo: React.FC<ProfileInfoProps> = ({
    countryOverride,
    clubOverride,
}) => {
    const {
        imageSrc,
        imageKey,
        fileInputRef,
        handleButtonClick,
        handleFileChange,
        isUploading,
        uploadError,
    } = useProfileInfo();
    const { fullName, profile } = useUserProfile();

    const displayCountry = countryOverride !== undefined ? countryOverride : (profile?.country ?? "");
    const displayClub = clubOverride !== undefined ? clubOverride : (profile?.club ?? "");

    return (
        <div className={css.profile_info}>
            <div className={css.profile_info_head}>
                <div className={css.profile_info_head_image_wrapper}>
                    <Image
                        key={imageKey}
                        className={css.profile_info_head_image}
                        src={imageSrc}
                        alt="Profile Image"
                        width={120}
                        height={120}
                        unoptimized={
                            imageSrc.startsWith("data:") ||
                            imageSrc.includes("supabase.co")
                        }
                    />
                    <input
                        ref={fileInputRef}
                        type="file"
                        accept="image/*"
                        onChange={handleFileChange}
                        style={{ display: "none" }}
                        aria-label="Profile photo file input"
                    />
                    <button
                        className={css.profile_info_head_button}
                        onClick={handleButtonClick}
                        type="button"
                        disabled={isUploading}
                        aria-label="Upload new profile photo"
                    >
                        <Image
                            src="/svg/upload-icon.svg"
                            alt="Upload Icon"
                            width={32}
                            height={32}
                        />
                    </button>
                </div>
                <h4 className={css.profile_info_head_name}>{fullName}</h4>
                {uploadError && (
                    <p className={css.profile_info_upload_error} role="alert">
                        {uploadError}
                    </p>
                )}
            </div>
            <div className={css.profile_info_body}>
                <div className={css.profile_info_body_item}>
                    <span className={css.profile_info_body_item_label}>
                        Player rating
                    </span>
                    <p className={css.profile_info_body_item_value}>1420</p>
                </div>
                <div className={css.profile_info_body_item}>
                    <span className={css.profile_info_body_item_label}>
                        Kingdom
                    </span>
                    <p className={css.profile_info_body_item_value}>
                        {displayCountry || "-"}
                    </p>
                </div>
                <div className={css.profile_info_body_item}>
                    <span className={css.profile_info_body_item_label}>
                        Club
                    </span>
                    <p className={css.profile_info_body_item_value}>
                        {displayClub || "-"}
                    </p>
                </div>
                <div className={css.profile_info_body_item}>
                    <span className={css.profile_info_body_item_label}>
                        Record
                    </span>
                    <p className={css.profile_info_body_item_value}>
                        8W – 3L – 3T
                    </p>
                </div>
                <div className={css.profile_info_body_item}>
                    <span className={css.profile_info_body_item_label}>
                        Tournament Points
                    </span>
                    <p className={css.profile_info_body_item_value}>
                        Top 8 over past 2 years: 1520
                    </p>
                </div>
            </div>
        </div>
    );
};
