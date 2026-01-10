"use client";

import { ReactNode, useEffect, useState } from "react";
import { NextIntlClientProvider } from "next-intl";
import useLanguage from "@/app/hooks/useLanguage";

const messagesMap: Record<string, () => Promise<any>> = {
  sv: () => import("@/locales/sv.json"),
  en: () => import("@/locales/en.json"),
};

const handbookMessagesMap: Record<string, () => Promise<any>> = {
  sv: () => import("@/locales/handbook.sv.json"),
  en: () => import("@/locales/handbook.en.json"),
};

export default function DynamicIntlProvider({
  children,
}: {
  children: ReactNode;
}) {
  const { currentLanguage } = useLanguage();
  const [messages, setMessages] = useState<Record<string, string>>({});
  const [locale, setLocale] = useState("sv");

  useEffect(() => {
    const lang = currentLanguage ?? "sv";

    setLocale(lang);

     Promise.all([messagesMap[lang](), handbookMessagesMap[lang]()]).then(
      ([baseMod, handbookMod]) => {
        setMessages({
          ...baseMod.default,
          ...handbookMod.default,
        });
      },
    );
  }, [currentLanguage]);

  if (!messages || Object.keys(messages).length === 0) return null;

  return (
    <NextIntlClientProvider locale={locale} messages={messages}>
      {children}
    </NextIntlClientProvider>
  );
}
