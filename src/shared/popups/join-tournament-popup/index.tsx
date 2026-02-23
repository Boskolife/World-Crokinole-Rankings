"use client";

import React, { useState } from "react";
import css from "../styles.module.scss";
import { Icon } from "@/shared/ui/icons";
import { FormField } from "@/shared/ui";
import { CustomRoundedDropdown } from "@/shared/ui";
import { useForm } from "react-hook-form";
import { usePopup } from "@/shared/contexts/popup-context";
import cn from "classnames";

const qualifyingHeatsOptions = [
    { value: "heat-1", label: "Heat 1" },
    { value: "heat-2", label: "Heat 2" },
    { value: "heat-3", label: "Heat 3" },
];

interface JoinTournamentForm {
    name: string;
    email: string;
}

export const JoinTournamentPopup: React.FC = () => {
    const { closePopup, getPopupData } = usePopup();
    const data = getPopupData("join-tournament") as { title?: string } | undefined;
    const title = data?.title ?? "Tournament";

    const [qualifyingHeat, setQualifyingHeat] = useState("");

    const {
        register,
        handleSubmit,
        formState: { errors },
    } = useForm<JoinTournamentForm>();

    const onSubmit = (formData: JoinTournamentForm) => {
        console.log("Register for tournament", { ...formData, qualifyingHeat });
        closePopup("join-tournament");
    };

    return (
        <div className={css.popup}>
            <div className={css.popup_close}>
                <Icon
                    name="x"
                    className={css.popup_close_icon}
                    onClick={() => closePopup("join-tournament")}
                />
            </div>
            <div className={css.popup_content}>
                <h2 className={css.join_tournament_title}>{title}</h2>
                <p className={css.join_tournament_description}>
                    Participation in this tournament is free.
                </p>
                <form
                    noValidate
                    onSubmit={handleSubmit(onSubmit)}
                    className={css.popup_form}
                >
                    <FormField
                        className={css.popup_form_field}
                        id="join-name"
                        name="name"
                        type="text"
                        placeholder="John Smith"
                        register={register}
                        rules={{ required: "Name is required" }}
                        error={errors.name?.message}
                    />
                    <FormField
                        className={css.popup_form_field}
                        id="join-email"
                        name="email"
                        type="email"
                        placeholder="johnsmith.business@gmail.com"
                        register={register}
                        rules={{
                            required: "Email is required",
                            pattern: {
                                value: /^[^\s@]+@[^\s@]+\.[^\s@]+$/,
                                message: "Invalid email address",
                            },
                        }}
                        error={errors.email?.message}
                    />
                    <div className={css.join_tournament_dropdown_wrap}>
                        <label
                            className={css.join_tournament_dropdown_label}
                            htmlFor="qualifying-heats"
                        >
                            Qualifying heats to the tournament
                        </label>
                        <CustomRoundedDropdown
                            id="qualifying-heats"
                            placeholder="Choose a qualifying heats to the tournament"
                            options={qualifyingHeatsOptions}
                            value={qualifyingHeat}
                            onChange={setQualifyingHeat}
                            className={css.join_tournament_dropdown}
                        />
                    </div>
                    <button
                        type="submit"
                        className={cn(css.popup_button, css.join_tournament_submit)}
                    >
                        Register for a tournament
                    </button>
                </form>
            </div>
        </div>
    );
};
