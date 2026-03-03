"use client";

import React, { useState } from "react";
import Link from "next/link";
import { useRouter } from "next/navigation";
import { useForm } from "react-hook-form";
import { FormField, CustomDropdown } from "@/shared/ui";
import { updateEvent } from "@/shared/supabase/data";
import type { IEventCardProps, IPlayer } from "@/shared/types";
import css from "./styles.module.scss";

type EnterEventResultsFormValues = {
    winner: string;
};

type EnterEventResultsFormProps = {
    event: IEventCardProps;
    players: IPlayer[];
    backLinkHref: string;
    backLinkLabel: string;
    successRedirect: string;
};

export function EnterEventResultsForm({
    event,
    players,
    backLinkHref,
    backLinkLabel,
    successRedirect,
}: EnterEventResultsFormProps) {
    const router = useRouter();
    const [submitError, setSubmitError] = useState<string | null>(null);
    const [isSubmitting, setIsSubmitting] = useState(false);

    const winnerOptions = [
        { value: "", label: "—" },
        ...players.map((p) => ({ value: p.name, label: p.name })),
    ];

    const { register, handleSubmit, watch, setValue, formState: { errors } } = useForm<EnterEventResultsFormValues>({
        defaultValues: { winner: event.winner ?? "" },
    });

    const watchedWinner = watch("winner");

    const onSubmit = async (data: EnterEventResultsFormValues) => {
        setSubmitError(null);
        setIsSubmitting(true);
        try {
            await updateEvent(event.id, { winner: data.winner?.trim() || null });
            router.push(successRedirect);
            router.refresh();
        } catch (e) {
            setSubmitError(e instanceof Error ? e.message : "Failed to save");
            setIsSubmitting(false);
        }
    };

    return (
        <div className={css.hero}>
            <div className={css.container}>
                <div className={css.header}>
                    <Link href={backLinkHref} className={css.backLink}>
                        {backLinkLabel}
                    </Link>
                    <h1 className={css.title}>Enter results</h1>
                    <p className={css.subtitle}>{event.title}</p>
                </div>
                <form className={css.formWrap} onSubmit={handleSubmit(onSubmit)}>
                    <div className={css.fields}>
                        <CustomDropdown<EnterEventResultsFormValues>
                            id="enter-results-winner"
                            name="winner"
                            label="Winner"
                            placeholder="Select winner"
                            options={winnerOptions}
                            value={watchedWinner}
                            onChange={(v) => setValue("winner", v)}
                            register={register}
                            error={errors.winner?.message}
                        />
                    </div>
                    {submitError && (
                        <p className={css.submitError} role="alert">
                            {submitError}
                        </p>
                    )}
                    <button
                        type="submit"
                        className={css.submitBtn}
                        disabled={isSubmitting}
                    >
                        {isSubmitting ? "Saving…" : "Save results"}
                    </button>
                </form>
            </div>
        </div>
    );
}
