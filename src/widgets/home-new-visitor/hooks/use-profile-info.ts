import { useState, useRef } from "react";

export const useProfileInfo = () => {
    const [imageSrc, setImageSrc] = useState<string>(
        "/images/profile-placeholder.png"
    );
    const fileInputRef = useRef<HTMLInputElement>(null);

    const handleButtonClick = () => {
        fileInputRef.current?.click();
    };

    const handleFileChange = (e: React.ChangeEvent<HTMLInputElement>) => {
        const file = e.target.files?.[0];
        if (file) {
            if (file.type.startsWith("image/")) {
                const reader = new FileReader();
                reader.onloadend = () => {
                    if (reader.result) {
                        setImageSrc(reader.result as string);
                    }
                };
                reader.readAsDataURL(file);
            }
        }
    };

    const countries = [
        {
            value: "United States",
            label: "United States",
        },
        {
            value: "Canada",
            label: "Canada",
        },
        {
            value: "United Kingdom",
            label: "United Kingdom",
        },
        {
            value: "Australia",
            label: "Australia",
        },
        {
            value: "New Zealand",
            label: "New Zealand",
        },
        {
            value: "Other",
            label: "Other",
        },
    ];

    const clubs = [
        {
            value: "Manchester United",
            label: "Manchester United",
        },
        {
            value: "Manchester City",
            label: "Manchester City",
        },
        {
            value: "Liverpool",
            label: "Liverpool",
        },
        {
            value: "Chelsea",
            label: "Chelsea",
        },
    ];

    return {
        imageSrc,
        fileInputRef,
        handleButtonClick,
        handleFileChange,
        countries,
        clubs,
    };
};
