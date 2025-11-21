import { redirect } from "next/navigation";
import { localeConfig } from "@/app/localization/config";

export default function RootPage() {
    redirect(`/${localeConfig.defaultLocale as string}`);
}

