import { NextIntlClientProvider, useMessages } from "next-intl";
import { setRequestLocale } from "next-intl/server";

interface ProvidersProps {
    children: React.ReactNode;
    locale: string;
}

export const ServerProviders: React.FC<ProvidersProps> = ({ children, locale }) => {
    setRequestLocale(locale);
    const messages = useMessages();
    return (
        <NextIntlClientProvider locale={locale} messages={messages}>
            {children}
        </NextIntlClientProvider>
    );
};


