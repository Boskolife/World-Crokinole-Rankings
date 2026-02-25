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

    const handleCountryChange = useCallback((country: string) => {
        setPreviewCountry(country);
    }, []);

    return (
        <section className={css.complete_profile}>
            <div className="container">
                <div className={css.complete_profile_content}>
                    <ProfileInfo
                        countryOverride={credentialsReadOnly ? previewCountry : undefined}
                    />
                    <ProfileEdit
                        credentialsReadOnly={credentialsReadOnly}
                        onCountryChange={
                            credentialsReadOnly ? handleCountryChange : undefined
                        }
                        hideAvatarBlock={credentialsReadOnly}
                    />
                </div>
            </div>
        </section>
    );
};
