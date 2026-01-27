"use client";

import Link from "next/link";
import { useTranslations } from "next-intl";
import NavbarLink from "@/app/components/navbar/NavbarLink";
import NavPage from "@/app/components/navbar/NavPage";

type Props = {
  isConnected: boolean | null;
};

type Link = {
  title?: string;
  href: string;
  label: string;
};

type LinkSection = {
  sectionLabel: string;
  items: Link[];
};

const DeveloperManageNavClient = (props: Props) => {
  const t = useTranslations();

  const sections: LinkSection[] = [
    {
      sectionLabel: t("Common/Users"),
      items: [{ href: "/developer/manage/users/", label: t("Common/Users") }],
    },
  ];

  return (
    <NavPage
      sections={sections}
      variant="single-grouped"
      pageLabel={t("Common/Users")}
    />
  );
};

export default DeveloperManageNavClient;
