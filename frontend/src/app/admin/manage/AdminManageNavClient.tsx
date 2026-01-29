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
        { href: "/admin/manage/units/", label: t("Common/Units") },
        { href: "/admin/manage/units/unit-groups/", label: t("Common/Groups") },
        {
          title: t("Navbar/Report"),
          href: "/admin/manage/units/categories/",
          label: t("Common/Categories"),
        },
        {
          href: "/admin/manage/units/unit-columns/",
          label: t("Common/Columns"),
        },
      ],
    },
    {
      sectionLabel: t("Navbar/Plan"),
      items: [
        {
          href: "/admin/manage/plan/planned-stops/",
          label: t("Common/Planned stops"),
        },
        {
          href: "/admin/manage/plan/products/",
          label: t("Common/Products"),
        },
        {
          href: "/admin/manage/plan/products/product-groups/",
          label: t("Common/Product groups"),
        },
        {
          title: t("Navbar/Master planning"),
          href: "/admin/manage/plan/master-plans/",
          label: t("Common/Master plans"),
        },
        {
          href: "/admin/manage/plan/master-plans/master-plan-fields/",
          label: t("Common/Master plan fields"),
        },
        {
          href: "/admin/manage/plan/master-plans/import-rules/",
          label: t("Navbar/Import rules"),
        },
        {
          title: t("Navbar/Operational planning"),
          href: "/admin/manage/plan/operational-plans/",
          label: t("Common/Operational plans"),
        },
        {
          href: "/admin/manage/plan/operational-plans/planning-rules/",
          label: t("Navbar/Planning rules"),
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
  ];

  return <NavPage sections={sections} variant="grid-sections" />;
};

export default AdminManageNavClient;
