import React from "react";
import css from "./styles.module.scss";
import Image from "next/image";
import { useProfileInfo } from "../hooks/use-profile-info";
export const ProfileInfo: React.FC = () => {
    const { imageSrc, fileInputRef, handleButtonClick, handleFileChange } =
        useProfileInfo();

    return (
        <div className={css.profile_info}>
            <div className={css.profile_info_head}>
                <div className={css.profile_info_head_image_wrapper}>
                    <Image
                        className={css.profile_info_head_image}
                        src={imageSrc}
                        alt="Profile Image"
                        width={120}
                        height={120}
                        unoptimized={imageSrc.startsWith("data:")}
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
                <h4 className={css.profile_info_head_name}>John Smith</h4>
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
                        Pennsylvania
                    </p>
                </div>
                <div className={css.profile_info_body_item}>
                    <span className={css.profile_info_body_item_label}>
                        Club
                    </span>
                    <p className={css.profile_info_body_item_value}>
                        Pittsburgh Crokinole Club
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
