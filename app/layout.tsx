import { ReactNode } from "react";
import { localeConfig } from "@/app/localization/config";
import type { Metadata } from "next";
import { PopupProvider } from "@/shared/contexts/popup-context";

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
            <body>
                <div id="wrapper">
                    <PopupProvider>{children}</PopupProvider>
                </div>
            </body>
        </html>
    );
}
