"use client";

import React from "react";
import { Link } from "@/app/localization/routing";
import { Locale } from "@/app/localization/config";
import type { ComponentProps } from "react";

export type IRootLinkProps = ComponentProps<typeof Link> & {
    locale?: Locale;
};

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

