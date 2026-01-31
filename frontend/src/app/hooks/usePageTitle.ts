"use client";

import { useEffect } from "react";
import useTN from "@/app/hooks/useTN";

const usePageTitle = (key: string) => {
  const t = useTN();

  useEffect(() => {
    document.title = t(key);
  }, [t, key]);
};

export default usePageTitle;
