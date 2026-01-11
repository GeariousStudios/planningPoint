"use client";

import Link from "next/link";
import { useTranslations } from "next-intl";
import NavbarLink from "@/app/components/navbar/NavbarLink";

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

const AdminManageClient = (props: Props) => {
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
          href: "/admin/manage/units/master-plan-fields/",
          label: t("Common/Master plan fields"),
        },
        {
          href: "/admin/manage/units/master-plans/import-rules/",
          label: t("ImportRules/Import rules"),
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

  return (
    <div className="flex w-full flex-col gap-8">
      <div className="xs:grid-cols-2 grid grid-cols-1 gap-4 lg:grid-cols-3 xl:grid-cols-4">
        {sections.map((section, sectionIndex) => (
          <div key={section.sectionLabel} className="p-4">
            <hr className="my-2 flex rounded-full text-(--border-main)" />
            <div className="uppercase font-semibold">{section.sectionLabel}</div>
            <hr className="my-2 flex rounded-full text-(--border-main)" />

            <div className="flex flex-col gap-2">
              {section.items.map((item) => (
                <div key={item.href} className="flex flex-col">
                  {item.title && (
                    <div className={`${sectionIndex !== 0 ? "mt-6" : "mt-2"} mb-1 text-sm font-semibold uppercase`}>
                      {item.title}
                    </div>
                  )}

                  <NavbarLink href={item.href} label={item.label} />
                </div>
              ))}
            </div>
          </div>
        ))}
      </div>
    </div>
  );
};

export default AdminManageClient;
