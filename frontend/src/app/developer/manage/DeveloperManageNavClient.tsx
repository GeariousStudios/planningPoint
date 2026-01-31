"use client";

import Link from "next/link";
import useTN from "@/app/hooks/useTN";
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
  const t = useTN();

  const sections: LinkSection[] = [
    {
      sectionLabel: t("entities.user", { capitalize: true, plural: true }),
      items: [
        {
          href: "/developer/manage/users/",
          label: t("entities.user", { capitalize: true, plural: true }),
        },
      ],
    },
  ];

  return (
    <NavPage
      sections={sections}
      variant="single-grouped"
      pageLabel={t("entities.user", { capitalize: true, plural: true })}
    />
  );
};

export default DeveloperManageNavClient;
