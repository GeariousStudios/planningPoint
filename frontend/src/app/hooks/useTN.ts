import { useLocale, useTranslations } from "next-intl";
import { createTN } from "@/app/helpers/textUtils";

const useTN = () => {
  const t = useTranslations();
  const locale = useLocale();

  return createTN(t, locale);
};

export default useTN;