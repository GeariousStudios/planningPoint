import { getRequestConfig } from "next-intl/server";

import sv from "../locales/sv.json";
import en from "../locales/en.json";
import handbookSv from "../locales/handbook.sv.json";
import handbookEn from "../locales/handbook.en.json";

const locales = ["sv", "en"] as const;

export default getRequestConfig(async ({ locale }) => {
  const currentLocale = locale ?? "sv";
  const safeLocale = locales.includes(currentLocale as any) ? currentLocale : "sv";

  const baseMessages = safeLocale === "sv" ? sv : en;
  const handbookMessages = safeLocale === "sv" ? handbookSv : handbookEn;

  return {
    messages: {
      ...baseMessages,
      ...handbookMessages,
    },
    locale: safeLocale,
  };
});
