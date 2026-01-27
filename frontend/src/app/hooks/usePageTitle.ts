"use client";

import { useEffect } from "react";
import { useTranslations } from "next-intl";

const usePageTitle = (key: string) => {
  const t = useTranslations();

  useEffect(() => {
    document.title = t(key);
  }, [t, key]);
};

export default usePageTitle;
