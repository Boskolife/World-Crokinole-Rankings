import { NextIntlClientProvider } from "next-intl";
import { setRequestLocale, getMessages } from "next-intl/server";

interface ProvidersProps {
    children: React.ReactNode;
    locale: string;
}

export async function ServerProviders({ children, locale }: ProvidersProps) {
    setRequestLocale(locale);
    const messages = await getMessages();
    return (
        <NextIntlClientProvider locale={locale} messages={messages}>
            {children}
        </NextIntlClientProvider>
    );
}


