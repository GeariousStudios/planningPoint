"use client";

import { useEffect, useRef } from "react";
import { usePathname } from "next/navigation";
import { useHandbook } from "@/app/context/HandbookContext";

const HandbookReset = () => {
  const pathname = usePathname();
  const { setHandbook } = useHandbook();
  const prevPath = useRef<string | null>(null);

  useEffect(() => {
    if (prevPath.current === null) {
      prevPath.current = pathname;
      return;
    }

    if (prevPath.current !== pathname) {
      setHandbook("");
      prevPath.current = pathname;
    }
  }, [pathname, setHandbook]);

  return null;
}

export default HandbookReset;