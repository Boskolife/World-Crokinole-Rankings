"use client";
import React from "react";
import css from "./styles.module.scss";
import { CustomButton } from "@/shared/ui/buttons";
import { useRouter } from "next/navigation";
import { clientRoutes } from "@/shared/routes/client";
import { PlayerProfileView } from "@/shared/modules";
import { useCurrentUserPlayer, useUserProfile } from "@/shared/hooks";
import { SaveContinueFallback } from "./SaveContinueFallback";

export const SaveContinue: React.FC = () => {
    const router = useRouter();
    const { player, isLoading } = useCurrentUserPlayer();
    const { fullName, profile } = useUserProfile();

    if (isLoading) {
        return (
            <div className={css.save_continue}>
                <div className="container" style={{ padding: "40px 0", textAlign: "center" }}>
                    Loading...
                </div>
            </div>
        );
    }

    if (player) {
        return (
            <div className={css.save_continue}>
                <PlayerProfileView player={player} />
                <div className="container">
                    <CustomButton
                        className={css.save_continue_button}
                        onClick={() => router.push(clientRoutes.home)}
                    >
                        Go to Dashboard
                    </CustomButton>
                </div>
            </div>
        );
    }

    return (
        <div className={css.save_continue}>
            <SaveContinueFallback fullName={fullName} profile={profile} />
            <div className="container">
                <CustomButton
                    className={css.save_continue_button}
                    onClick={() => router.push(clientRoutes.home)}
                >
                    Go to Dashboard
                </CustomButton>
            </div>
        </div>
    );
};
