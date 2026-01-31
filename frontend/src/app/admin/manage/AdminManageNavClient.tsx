"use client";

import Link from "next/link";
import useTN from "@/app/hooks/useTN";
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
  const t = useTN();

  const sections: LinkSection[] = [
    {
      sectionLabel: t("entities.unit", { capitalize: true, plural: true }),
      items: [
        {
          href: "/admin/manage/units/",
          label: t("entities.unit", { capitalize: true, plural: true }),
        },
        {
          href: "/admin/manage/units/unit-groups/",
          label: t("entities.group", { capitalize: true, plural: true }),
        },
        {
          title: t("navbar.report", { capitalize: true }),
          href: "/admin/manage/units/categories/",
<<<<<<< Updated upstream
<<<<<<< Updated upstream
          label: t("Common/Categories"),
=======
          label: t("entities.category", { capitalize: true, plural: true }),
>>>>>>> Stashed changes
=======
          label: t("entities.category", { capitalize: true, plural: true }),
>>>>>>> Stashed changes
        },
        {
          href: "/admin/manage/units/unit-columns/",
          label: t("entities.column", { capitalize: true, plural: true }),
        },
      ],
    },
    {
      sectionLabel: t("navbar.plan", { capitalize: true }),
      items: [
        {
          href: "/admin/manage/plan/planned-stops/",
          label: t("entities.plannedStop", { capitalize: true, plural: true }),
        },
        {
          href: "/admin/manage/plan/products/",
          label: t("entities.product", { capitalize: true, plural: true }),
        },
        {
          href: "/admin/manage/plan/products/product-groups/",
          label: t("entities.productGroup", { capitalize: true, plural: true }),
        },
        {
          title: t("navbar.master planning", { capitalize: true }),
          href: "/admin/manage/plan/master-plans/",
          label: t("entities.masterPlan", { capitalize: true, plural: true }),
        },
        {
          href: "/admin/manage/plan/master-plans/master-plan-fields/",
          label: t("entities.masterPlanField", {
            capitalize: true,
            plural: true,
          }),
        },
        {
          href: "/admin/manage/plan/master-plans/import-rules/",
<<<<<<< Updated upstream
<<<<<<< Updated upstream
          label: t("ImportRules/Import rules"),
=======
          label: t("entities.importRules", { capitalize: true }),
>>>>>>> Stashed changes
=======
          label: t("entities.importRules", { capitalize: true }),
>>>>>>> Stashed changes
        },
        {
          title: t("navbar.operational planning", { capitalize: true }),
          href: "/admin/manage/plan/operational-plans/",
          label: t("entities.operationalPlan", {
            capitalize: true,
            plural: true,
          }),
        },
<<<<<<< Updated upstream
=======
        {
          href: "/admin/manage/plan/operational-plans/planning-rules/",
          label: t("entities.planningRules", { capitalize: true }),
        },
>>>>>>> Stashed changes
      ],
    },
    {
      sectionLabel: t("entities.shift", { capitalize: true, plural: true }),
      items: [
        {
          href: "/admin/manage/shifts/",
          label: t("entities.shift", { capitalize: true, plural: true }),
        },
        {
          href: "/admin/manage/shifts/shift-teams/",
          label: t("entities.shiftTeam", { capitalize: true, plural: true }),
        },
      ],
    },
    {
      sectionLabel: t("entities.news", { capitalize: true, plural: true }),
      items: [
        {
          href: "/admin/manage/news/news-types/",
          label: t("entities.newsType", { capitalize: true, plural: true }),
        },
      ],
    },
  ];

  return <NavPage sections={sections} variant="grid-sections" />;
};

export default AdminManageNavClient;
