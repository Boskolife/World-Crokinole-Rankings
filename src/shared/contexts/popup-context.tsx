"use client";

import React, { createContext, useContext, useState, useCallback } from "react";

export type PopupType = "verify" | "verify-code" | string;

interface PopupContextType {
    openPopups: Set<PopupType>;
    openPopup: (type: PopupType, data?: Record<string, unknown>) => void;
    closePopup: (type: PopupType) => void;
    closeAllPopups: () => void;
    isPopupOpen: (type: PopupType) => boolean;
    getPopupData: (type: PopupType) => Record<string, unknown> | undefined;
}

const PopupContext = createContext<PopupContextType | undefined>(undefined);

interface PopupProviderProps {
    children: React.ReactNode;
}

export const PopupProvider: React.FC<PopupProviderProps> = ({ children }) => {
    const [openPopups, setOpenPopups] = useState<Set<PopupType>>(new Set());
    const [popupDataMap, setPopupDataMap] = useState<
        Map<PopupType, Record<string, unknown>>
    >(new Map());

    const openPopup = useCallback(
        (type: PopupType, data?: Record<string, unknown>) => {
            setOpenPopups((prev) => {
                const newSet = new Set(prev);
                newSet.add(type);
                return newSet;
            });

            if (data) {
                setPopupDataMap((prev) => {
                    const newMap = new Map(prev);
                    newMap.set(type, data);
                    return newMap;
                });
            }
        },
        []
    );

    const closePopup = useCallback((type: PopupType) => {
        setOpenPopups((prev) => {
            const newSet = new Set(prev);
            newSet.delete(type);
            return newSet;
        });

        setPopupDataMap((prev) => {
            const newMap = new Map(prev);
            newMap.delete(type);
            return newMap;
        });
    }, []);

    const closeAllPopups = useCallback(() => {
        setOpenPopups(new Set());
        setPopupDataMap(new Map());
    }, []);

    const isPopupOpen = useCallback(
        (type: PopupType) => {
            return openPopups.has(type);
        },
        [openPopups]
    );

    const getPopupData = useCallback(
        (type: PopupType) => {
            return popupDataMap.get(type);
        },
        [popupDataMap]
    );

    return (
        <PopupContext.Provider
            value={{
                openPopups,
                openPopup,
                closePopup,
                closeAllPopups,
                isPopupOpen,
                getPopupData,
            }}
        >
            {children}
        </PopupContext.Provider>
    );
};

export const usePopup = (): PopupContextType => {
    const context = useContext(PopupContext);
    if (!context) {
        throw new Error("usePopup must be used within a PopupProvider");
    }
    return context;
};
