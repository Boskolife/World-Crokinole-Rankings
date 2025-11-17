import { redirect } from "next/navigation";
import { localeConfig } from "./localization/config";

export default function RootPage() {
  redirect(`/${localeConfig.defaultLocale as string}`);
}

