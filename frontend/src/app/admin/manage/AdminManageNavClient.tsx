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

const AdminManageNavClient = (props: Props) => {
  const t = useTranslations();

  const sections: LinkSection[] = [
    {
      sectionLabel: t("Common/Units"),
      items: [
        { href: "/admin/manage/units/unit-groups/", label: t("Common/Groups") },
        { href: "/admin/manage/units/", label: t("Common/Units") },
        {
          title: t("Navbar/Report"),
          href: "/admin/manage/units/categories/",
          label: t("Common/Categories"),
        },
        {
          href: "/admin/manage/units/unit-columns/",
          label: t("Common/Columns"),
        },
        {
          title: t("Navbar/Plan"),
          href: "/admin/manage/units/master-plans/",
          label: t("Common/Master plans"),
        },
        {
          href: "/admin/manage/units/master-plans/master-plan-fields/",
          label: t("Common/Master plan fields"),
        },
        {
          href: "/admin/manage/units/master-plans/import-rules/",
          label: t("ImportRules/Import rules"),
        },
        {
          href: "/admin/manage/units/operational-plans/",
          label: t("Common/Operational plans"),
        },
      ],
    },
    {
      sectionLabel: t("Common/Shifts"),
      items: [
        { href: "/admin/manage/shifts/", label: t("Common/Shifts") },
        {
          href: "/admin/manage/shifts/shift-teams/",
          label: t("Common/Shift teams"),
        },
      ],
    },
    {
      sectionLabel: t("Common/News"),
      items: [
        {
          href: "/admin/manage/news/news-types/",
          label: t("Common/News types"),
        },
      ],
    },
    {
      sectionLabel: t("Common/Planned stops"),
      items: [
        {
          href: "/admin/manage/planned-stops/stop-types/",
          label: t("Common/Stop types"),
        },
      ],
    },
  ];

  return <NavPage sections={sections} variant="grid-sections" />;
};

export default AdminManageNavClient;
