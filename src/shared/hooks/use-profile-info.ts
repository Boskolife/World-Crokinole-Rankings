"use client";

import { useState, useRef, useEffect } from "react";
import { useAuth } from "@/shared/hooks/use-auth";
import { useUserProfile } from "@/shared/hooks/use-user-profile";
import { isSupabaseConfigured, supabase } from "@/shared/supabase/client";
import { getUniqueKingdoms } from "@/shared/supabase/data";
import type { DropdownOption } from "@/shared/constants/dropdown-options";

const AVATAR_BUCKET = "avatars";
const PLACEHOLDER_SRC = "/svg/avatar-placeholder.svg";

function getExtension(filename: string): string {
    const match = filename.match(/\.([a-zA-Z0-9]+)$/);
    return match ? match[1].toLowerCase() : "jpg";
}

export const useProfileInfo = () => {
    const { user } = useAuth();
    const { profile, refetch: refetchProfile } = useUserProfile();
    const userId = user?.id ?? null;

    const [imageSrc, setImageSrc] = useState<string>(PLACEHOLDER_SRC);
    const [avatarVersion, setAvatarVersion] = useState(0);
    const [isUploading, setIsUploading] = useState(false);
    const [uploadError, setUploadError] = useState<string | null>(null);
    const [countryOptions, setCountryOptions] = useState<DropdownOption[]>([]);
    const fileInputRef = useRef<HTMLInputElement>(null);

    useEffect(() => {
        getUniqueKingdoms().then((kingdoms) => {
            const current = profile?.country?.trim();
            if (current && !kingdoms.some((o) => o.value === current)) {
                setCountryOptions([{ value: current, label: current }, ...kingdoms]);
            } else {
                setCountryOptions(kingdoms);
            }
        });
    }, [profile?.country]);

    const baseImageSrc = profile?.avatar_url?.trim() || imageSrc;
    const effectiveImageSrc =
        baseImageSrc && baseImageSrc.includes("supabase.co")
            ? `${baseImageSrc}${baseImageSrc.includes("?") ? "&" : "?"}t=${avatarVersion}`
            : baseImageSrc;

    const handleButtonClick = () => {
        fileInputRef.current?.click();
    };

    const handleFileChange = async (
        e: React.ChangeEvent<HTMLInputElement>
    ) => {
        const file = e.target.files?.[0];
        e.target.value = "";
        if (!file || !file.type.startsWith("image/")) return;
        if (!isSupabaseConfigured || !userId) {
            const reader = new FileReader();
            reader.onloadend = () => {
                if (reader.result) setImageSrc(reader.result as string);
            };
            reader.readAsDataURL(file);
            return;
        }

        setIsUploading(true);
        setUploadError(null);

        const ext = getExtension(file.name);
        const path = `${userId}/avatar.${ext}`;

        try {
            const { error: uploadError } = await supabase.storage
                .from(AVATAR_BUCKET)
                .upload(path, file, { upsert: true });

            if (uploadError) {
                setUploadError(uploadError.message);
                return;
            }

            const {
                data: { publicUrl },
            } = supabase.storage.from(AVATAR_BUCKET).getPublicUrl(path);

            const { error: updateError } = await supabase
                .from("profiles")
                .update({ avatar_url: publicUrl })
                .eq("id", userId);

            if (updateError) {
                setUploadError(updateError.message);
                return;
            }

            setImageSrc(publicUrl);
            setAvatarVersion((v) => v + 1);
            await refetchProfile();
        } catch {
            setUploadError("Failed to upload avatar");
        } finally {
            setIsUploading(false);
        }
    };

    const countries = countryOptions;

    const clubs = [
        { value: "Manchester United", label: "Manchester United" },
        { value: "Manchester City", label: "Manchester City" },
        { value: "Liverpool", label: "Liverpool" },
        { value: "Chelsea", label: "Chelsea" },
    ];

    return {
        imageSrc: effectiveImageSrc,
        imageKey: `${effectiveImageSrc}-${avatarVersion}`,
        fileInputRef,
        handleButtonClick,
        handleFileChange,
        isUploading,
        uploadError,
        countries,
        clubs,
    };
};
