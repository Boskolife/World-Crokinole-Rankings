"use client";

import React from "react";
import { useTranslations } from "next-intl";

export const Footer: React.FC = () => {
  const t = useTranslations("footer");

  return (
    <div>
      <h1>{t("title")}</h1>
    </div>
  );
};
