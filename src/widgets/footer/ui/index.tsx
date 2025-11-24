"use client";

import React from "react";
import { useTranslations } from "next-intl";
import css from "./styles.module.scss";
import { Logo } from "@/shared/components/logo";
import Image from "next/image";
import { useForm } from "react-hook-form";
import cn from "classnames";
import { RootLink } from "@/shared/ui/links/root-link";

export const Footer: React.FC = () => {
    const tNavigation = useTranslations("navigation");
    type SubscribeFormValues = { email: string };
    const {
        register,
        handleSubmit,
        formState: { errors, isSubmitting },
        reset,
    } = useForm<SubscribeFormValues>({
        defaultValues: { email: "" },
        mode: "onSubmit",
        reValidateMode: "onChange",
    });

    const onSubmit = async (data: SubscribeFormValues) => {
        // TODO: integrate with backend/marketing service
        // For now, we just reset on success
        console.log("subscribe:", data.email);
        reset();
    };

    const navMenuItems = [
        {
            href: "#",
            label: tNavigation("rankings"),
        },
        {
            href: "#",
            label: tNavigation("events"),
        },
        {
            href: "#",
            label: tNavigation("clubs"),
        },
        {
            href: "#",
            label: tNavigation("players"),
        },
    ];

    const date = new Date().getFullYear();

    return (
        <footer className={css.footer}>
            <Image
                className={css.footer_logo_bg}
                src="/images/big-logo-black.png"
                alt="big-logo-black"
                width={190}
                height={380}
            />
            <div className="container">
                <div className={css.footer_content}>
                    <div className={css.footer_content_top}>
                        <div className={css.footer_content_left}>
                            <Logo
                                colorInverted={true}
                                className={css.footer_content_left_logo}
                            />
                            <p className={css.footer_content_left_text}>
                                We`re a family company and we love to hear from
                                you. Reach us at
                            </p>
                            <a
                                href="mailto:support@worldcrokinolerankings.com"
                                className={css.footer_content_left_email}
                            >
                                support@worldcrokinolerankings.com
                            </a>
                        </div>
                        <div className={css.footer_content_right}>
                            <nav className={css.footer_content_right_menu}>
                                <ul
                                    className={
                                        css.footer_content_right_menu_list
                                    }
                                >
                                    {navMenuItems.map((item, index: number) => (
                                        <li
                                            key={index}
                                            className={
                                                css.footer_content_right_menu_item
                                            }
                                        >
                                            <RootLink
                                                href={item.href}
                                                className={
                                                    css.footer_content_right_menu_link
                                                }
                                            >
                                                {item.label}
                                            </RootLink>
                                        </li>
                                    ))}
                                </ul>
                            </nav>
                            <div className={css.footer_content_right_subscribe}>
                                <span
                                    className={
                                        css.footer_content_right_subscribe_title
                                    }
                                >
                                    Subscribe to our monthly newsletter
                                </span>
                                <form
                                    noValidate
                                    onSubmit={handleSubmit(onSubmit)}
                                    className={cn(
                                        css.footer_content_right_subscribe_form,
                                        {
                                            [css.error]: errors.email?.message,
                                        }
                                    )}
                                >
                                    <input
                                        type="email"
                                        placeholder="Your email"
                                        aria-label="Email address"
                                        aria-invalid={
                                            !!errors.email || undefined
                                        }
                                        {...register("email", {
                                            required: "Email is required",
                                            pattern: {
                                                value: /^[a-zA-Z0-9._%+-]+@[a-zA-Z0-9.-]+\.[a-zA-Z]{2,}$/,
                                                message:
                                                    "Please enter a valid email",
                                            },
                                        })}
                                    />
                                    <button
                                        type="submit"
                                        disabled={isSubmitting}
                                    >
                                        Subscribe
                                    </button>
                                </form>
                                {errors.email?.message && (
                                    <div
                                        className={
                                            css.footer_content_right_subscribe_error
                                        }
                                        role="alert"
                                    >
                                        {errors.email.message}
                                    </div>
                                )}
                            </div>
                        </div>
                    </div>
                    <div className={css.footer_content_bottom}>
                        <div className={css.footer_content_bottom_social}>
                            <a
                                href="#"
                                target="_blank"
                                className={
                                    css.footer_content_bottom_social_item
                                }
                            >
                                <Image
                                    src="/svg/facebook.svg"
                                    alt="facebook"
                                    width={36}
                                    height={36}
                                />
                            </a>
                            <a
                                href="#"
                                target="_blank"
                                className={
                                    css.footer_content_bottom_social_item
                                }
                            >
                                <Image
                                    src="/svg/instagram.svg"
                                    alt="instagram"
                                    width={36}
                                    height={36}
                                />
                            </a>
                            <a
                                href="#"
                                target="_blank"
                                className={
                                    css.footer_content_bottom_social_item
                                }
                            >
                                <Image
                                    src="/svg/pinterest.svg"
                                    alt="pinterest"
                                    width={36}
                                    height={36}
                                />
                            </a>
                            <a
                                href="#"
                                target="_blank"
                                className={
                                    css.footer_content_bottom_social_item
                                }
                            >
                                <Image
                                    src="/svg/youtube.svg"
                                    alt="youtube"
                                    width={36}
                                    height={36}
                                />
                            </a>
                        </div>
                        <p className={css.footer_content_bottom_text}>
                           <span> © {date} World Crokinole Rankings.</span> 
                           <span> All rights reserved.</span>
                        </p>
                    </div>
                </div>
            </div>
        </footer>
    );
};
