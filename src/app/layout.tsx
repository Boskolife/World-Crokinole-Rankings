import { ReactNode } from "react";
import { localeConfig } from "./localization/config";
import type { Metadata } from "next";

export const metadata: Metadata = {
    robots: {
        index: false,
        follow: false,
        nocache: true,
    },
};

export default function RootLayout({ children }: { children: ReactNode }) {
    return (
        <html
            lang={localeConfig.defaultLocale as string}
            suppressHydrationWarning
        >
            <body>{children}</body>
        </html>
    );
}
