"use client";

import Link from "next/link";
import { useTranslations } from "next-intl";
import { useEffect, useState } from "react";
import Message from "../../components/common/Message";
import NavPage from "../../components/navbar/NavPage";

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

const ReportUnitsNavClient = (props: Props) => {
  const t = useTranslations();

  const [sections, setSections] = useState<LinkSection[]>([]);
  const [isLoading, setIsLoading] = useState(true);

  const apiUrl = process.env.NEXT_PUBLIC_API_URL;

  const fetchUnits = async () => {
    try {
      setIsLoading(true);

      const response = await fetch(
        `${apiUrl}/unit?sortBy=unitGroupName&sortOrder=desc`,
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
            href: `/report/units/${unit.unitGroupId}/${unit.id}`,
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
    fetchUnits();

    const handleUnitUpdate = () => fetchUnits();
    window.addEventListener("unit-list-updated", handleUnitUpdate);

    return () => {
      window.removeEventListener("unit-list-updated", handleUnitUpdate);
    };
  }, []);

  if (isLoading) {
    return <Message icon="loading" content="loading" fullscreen />;
  }

  return (
    <NavPage
      sections={sections}
      variant="single-grouped"
      pageLabel={t("Common/Units")}
    />
  );
};

export default ReportUnitsNavClient;
