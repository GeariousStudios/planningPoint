"use client";

import Link from "next/link";
import { useTranslations } from "next-intl";
import NavbarLink from "@/app/components/navbar/NavbarLink";
import { useEffect, useState } from "react";
import Message from "../components/common/Message";

type Props = {
  isConnected: boolean | null;
};

type Unit = {
  id: number;
  name: string;
  unitGroupId: number;
  unitGroupName: string;
  isHidden?: boolean;
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

const PlanClient = (props: Props) => {
  const t = useTranslations();

  const [sections, setSections] = useState<LinkSection[]>([]);
  const [isLoading, setIsLoading] = useState(true);

  const apiUrl = process.env.NEXT_PUBLIC_API_URL;

  const fetchMasterPlans = async () => {
    try {
      setIsLoading(true);

      const response = await fetch(
        `${apiUrl}/master-plan`,
        {
          headers: {
            "X-User-Language": localStorage.getItem("language") || "sv",
            "Content-Type": "application/json",
          },
        },
      );

      const result = await response.json();

      if (!response.ok) {
        setSections([]);
        return;
      }

      const allItems: Unit[] = result?.items ?? [];
      const items = allItems.filter((u) => !u.isHidden);

      const grouped = items.reduce(
        (acc: Record<string, Link[]>, unit: Unit) => {
          const groupName = unit.unitGroupName || t("Common/Groups");

          if (!acc[groupName]) {
            acc[groupName] = [];
          }

          acc[groupName].push({
            href: `/plan/master-plans/${unit.unitGroupId}/${unit.id}`,
            label: unit.name,
          });

          return acc;
        },
        {},
      );

      const nextSections: LinkSection[] = Object.entries(grouped).map(
        ([groupName, links]) => ({
          sectionLabel: groupName,
          items: links,
        }),
      );

      setSections(nextSections);
    } finally {
      setIsLoading(false);
    }
  };

  useEffect(() => {
    fetchMasterPlans();

    const handleMasterPlanUpdate = () => fetchMasterPlans();
    window.addEventListener("master-plan-list-updated", handleMasterPlanUpdate);

    return () => {
      window.removeEventListener("master-plan-list-updated", handleMasterPlanUpdate);
    };
  }, []);

  if (isLoading) {
    return <Message icon="loading" content="loading" fullscreen />;
  }

  return (
    <div className="flex w-full flex-col gap-8">
      {/* <div className="xs:grid-cols-2 grid grid-cols-1 gap-4 lg:grid-cols-3 xl:grid-cols-4"> */}
      <div>
        <div className="p-4">
          <hr className="my-2 flex rounded-full text-(--border-main)" />
          <div className="font-semibold uppercase">{t("Common/Master plans")}</div>
          <hr className="my-2 flex rounded-full text-(--border-main)" />
          {sections.map((section, sectionIndex) => (
            <div key={section.sectionLabel} className="flex flex-col gap-2">
              {section.items.map((item, itemIndex) => (
                <div key={item.href} className="flex flex-col">
                  {itemIndex === 0 && (
                    <div className={`${sectionIndex !== 0 ? "mt-6" : "mt-2"} mb-1 text-sm font-semibold uppercase`}>
                      {section.sectionLabel}
                    </div>
                  )}

                  <NavbarLink href={item.href} label={item.label} />
                </div>
              ))}
            </div>
          ))}
        </div>
      </div>
    </div>
  );
};

export default PlanClient;
