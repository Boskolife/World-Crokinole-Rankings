import { redirect } from "next/navigation";
import { defaultLocale } from "./localization/config";

export default function RootPage() {
  redirect(`/${defaultLocale}`);
}

