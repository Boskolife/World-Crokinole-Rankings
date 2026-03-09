"use client";

import React, { useEffect, useRef, useState } from "react";
import cn from "classnames";
import { loadGoogleMapsWithPlaces } from "@/shared/lib/load-google-maps";
import css from "./styles.module.scss";

export type PlaceSearchResult = {
    address: string;
    latitude: number;
    longitude: number;
};

type PlaceSearchInputProps = {
    id: string;
    label: string;
    placeholder?: string;
    value: string;
    onChange: (result: PlaceSearchResult) => void;
    onClear?: () => void;
    error?: string;
    className?: string;
};

declare global {
    interface Window {
        google: typeof google;
    }
}

export function PlaceSearchInput({
    id,
    label,
    placeholder = "Search for a place or address",
    value,
    onChange,
    onClear,
    error,
    className,
}: PlaceSearchInputProps) {
    const inputRef = useRef<HTMLInputElement>(null);
    const autocompleteRef = useRef<google.maps.places.Autocomplete | null>(null);
    const [isLoading, setIsLoading] = useState(true);
    const [loadError, setLoadError] = useState<string | null>(null);

    useEffect(() => {
        loadGoogleMapsWithPlaces()
            .then(() => {
                setIsLoading(false);
                setLoadError(null);
            })
            .catch((err) => {
                setIsLoading(false);
                setLoadError(err instanceof Error ? err.message : "Failed to load maps");
            });
    }, []);

    useEffect(() => {
        if (isLoading || loadError || !inputRef.current || !window.google?.maps?.places?.Autocomplete) return;

        if (autocompleteRef.current) return;

        const autocomplete = new window.google.maps.places.Autocomplete(inputRef.current, {
            types: ["establishment", "geocode"],
            fields: ["formatted_address", "geometry", "name"],
        });

        autocomplete.addListener("place_changed", () => {
            const place = autocomplete.getPlace();
            const addr = place.formatted_address || place.name || "";
            const loc = place.geometry?.location;
            if (addr && loc) {
                onChange({
                    address: addr,
                    latitude: loc.lat(),
                    longitude: loc.lng(),
                });
            }
        });

        autocompleteRef.current = autocomplete;
        return () => {
            if (autocompleteRef.current) {
                autocompleteRef.current = null;
            }
        };
    }, [isLoading, loadError, onChange]);

    const handleClear = () => {
        if (inputRef.current) {
            inputRef.current.value = "";
            onClear?.();
        }
    };

    const handleInputChange = (e: React.ChangeEvent<HTMLInputElement>) => {
        if (!e.target.value.trim()) {
            onClear?.();
        }
    };

    const handleKeyDown = (e: React.KeyboardEvent<HTMLInputElement>) => {
        if (e.key === "Escape") {
            handleClear();
        }
    };

    if (loadError) {
        return (
            <div className={cn(css.field, className)}>
                {label && (
                    <label className={css.label} htmlFor={id}>
                        {label}
                    </label>
                )}
                <div className={css.loading}>
                    {loadError}. Set NEXT_PUBLIC_GOOGLE_MAPS_API_KEY.
                </div>
            </div>
        );
    }

    return (
        <div className={cn(css.field, className)}>
            {label && (
                <label className={css.label} htmlFor={id}>
                    {label}
                </label>
            )}
            {isLoading ? (
                <div className={css.loading}>Loading search…</div>
            ) : (
                <div className={css.inputWrapper}>
                    <input
                        ref={inputRef}
                        id={id}
                        type="text"
                        className={cn(css.input, { [css.error]: !!error })}
                        placeholder={placeholder}
                        defaultValue={value}
                        onChange={handleInputChange}
                        onKeyDown={handleKeyDown}
                        autoComplete="off"
                        aria-invalid={!!error}
                    />
                    {value && onClear && (
                        <button
                            type="button"
                            className={css.clearBtn}
                            onClick={handleClear}
                            aria-label="Clear location"
                        >
                            ×
                        </button>
                    )}
                </div>
            )}
            {error && <span className={css.errorText}>{error}</span>}
        </div>
    );
}
