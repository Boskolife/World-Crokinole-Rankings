import React, { useState, useCallback } from "react";
import css from "./styles.module.scss";
import { ProfileInfo } from "../profile-info/ProfileInfo";
import { ProfileEdit } from "../profile-edit/ProfileEdit";

type CompleteProfileProps = {
    credentialsReadOnly?: boolean;
};

export const CompleteProfile: React.FC<CompleteProfileProps> = ({
    credentialsReadOnly = false,
}) => {
    const [previewCountry, setPreviewCountry] = useState<string | undefined>();
    const [previewClub, setPreviewClub] = useState<string | undefined>();

    const handleCountryClubChange = useCallback(
        (country: string, club: string) => {
            setPreviewCountry(country);
            setPreviewClub(club);
        },
        []
    );

    return (
        <section className={css.complete_profile}>
            <div className="container">
                <div className={css.complete_profile_content}>
                    <ProfileInfo
                        countryOverride={credentialsReadOnly ? previewCountry : undefined}
                        clubOverride={credentialsReadOnly ? previewClub : undefined}
                    />
                    <ProfileEdit
                        credentialsReadOnly={credentialsReadOnly}
                        onCountryClubChange={
                            credentialsReadOnly ? handleCountryClubChange : undefined
                        }
                    />
                </div>
            </div>
        </section>
    );
};
