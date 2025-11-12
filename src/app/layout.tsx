import { ReactNode } from "react";
import { defaultLocale } from "./localization/config";

export default function RootLayout({ children }: { children: ReactNode }) {
    return (
    <html lang={defaultLocale} suppressHydrationWarning>
      <body>{children}</body>
        </html>
    );
}
