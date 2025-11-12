"use client";

import React from "react";
import { Link } from "@/app/localization/routing";
import { Locale } from "@/app/localization/config";
import type { ComponentProps } from "react";

export type IRootLinkProps = ComponentProps<typeof Link> & {
    locale?: Locale;
};

/**
 * RootLink - обертка над Link с поддержкой локализации
 *
 * Преимущества:
 * 1. Единая точка входа для всех ссылок с локализацией
 * 2. Возможность явно указать язык через проп locale
 * 3. Упрощает использование - не нужно импортировать Link из разных мест
 * 4. Позволяет добавить общую логику (стили, активное состояние, аналитика)
 * 5. Типобезопасность - единый интерфейс для всех ссылок
 *
 * @example
 * // Обычное использование (использует текущую локаль)
 * <RootLink href="/about">About</RootLink>
 *
 * @example
 * // С явным указанием языка
 * <RootLink href="/about" locale="fr">About</RootLink>
 *
 * @example
 * // Со всеми стандартными пропсами Next.js Link
 * <RootLink href="/about" className="nav-link" prefetch={false}>
 *   About
 * </RootLink>
 */
export const RootLink: React.FC<IRootLinkProps> = ({
    href,
    locale,
    children,
    ...props
}) => {
    return (
        <Link
            href={href}
            {...(locale ? { locale } : {})}
            {...props}
        >
            {children}
        </Link>
    );
};

