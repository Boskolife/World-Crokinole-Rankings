"use client";

import { AdminSignInForm } from "@/widgets/admin-sign-in/AdminSignInForm";
import css from "./styles.module.scss";

export default function AdminSignInPage() {
    return (
        <div className={css.sign_in_page}>
            <AdminSignInForm />
        </div>
    );
}
