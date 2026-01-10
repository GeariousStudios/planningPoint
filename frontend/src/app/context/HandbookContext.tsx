"use client";

import { createContext, useContext, useState } from "react";

type HandbookContextValue = {
  handbook: string;
  setHandbook: (handbook: string) => void;
};

const HandbookContext = createContext<HandbookContextValue | null>(null);

export const HandbookProvider = ({
  children,
}: {
  children: React.ReactNode;
}) => {
  const [handbook, setHandbook] = useState<string>("");

  return (
    <HandbookContext.Provider value={{ handbook, setHandbook }}>
      {children}
    </HandbookContext.Provider>
  );
};

export const useHandbook = () => {
  const context = useContext(HandbookContext);

  if (!context) {
    return {
      handbook: "",
      setHandbook: () => {},
    };
  }

  return context;
};
