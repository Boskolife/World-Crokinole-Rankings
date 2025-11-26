"use client";
import React from "react";
import css from "./styles.module.scss";
import { CustomButton } from "@/shared/ui/buttons";
import { useRouter } from "next/navigation";
import { clientRoutes } from "@/shared/routes/client";
import { ProfileDetails } from "@/shared/modules";

export const SaveContinue: React.FC = () => {
    const router = useRouter();
    return (
        <div className={css.save_continue}>
            <div className="container">
                <ProfileDetails />
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
