"use client";

import Link from "next/link";
import { useTranslations } from "next-intl";
import NavbarLink from "@/app/components/navbar/NavbarLink";
import { useEffect, useState } from "react";
import Message from "../components/common/Message";
import NavPage from "../components/navbar/NavPage";

type Props = {
  isConnected: boolean | null;
};

type MasterPlan = {
  id: number;
  name: string;
  unitGroupId: number;
  unitGroupName: string;
  isHidden?: boolean;
};

type OperationalPlan = {
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

const PlanNavClient = (props: Props) => {
  const t = useTranslations();

  const [masterPlanSections, setMasterPlanSections] = useState<LinkSection[]>(
    [],
  );
  const [operationalPlanSections, setOperationalPlanSections] = useState<
    LinkSection[]
  >([]);
  const [isLoadingMasterPlans, setIsLoadingMasterPlans] = useState(true);
  const [isLoadingOperationalPlans, setIsLoadingOperationalPlans] =
    useState(true);

  const apiUrl = process.env.NEXT_PUBLIC_API_URL;

  const fetchMasterPlans = async () => {
    try {
      setIsLoadingMasterPlans(true);

      const response = await fetch(`${apiUrl}/master-plan?sortBy=unitGroupName&sortOrder=asc`, {
        headers: {
          "X-User-Language": localStorage.getItem("language") || "sv",
          "Content-Type": "application/json",
        },
      });

      const result = await response.json();

      if (!response.ok) {
        setMasterPlanSections([]);
        return;
      }

      const allItems: MasterPlan[] = result?.items ?? [];
      const items = allItems.filter((mp) => !mp.isHidden);

      const grouped = items.reduce(
        (acc: Record<string, Link[]>, masterPlan: MasterPlan) => {
          const groupName = masterPlan.unitGroupName || t("Common/Groups");

          if (!acc[groupName]) {
            acc[groupName] = [];
          }

          acc[groupName].push({
            href: `/plan/master-plans/${masterPlan.unitGroupId}/${masterPlan.id}`,
            label: masterPlan.name,
          });

          return acc;
        },
        {},
      );

      const nextSections: LinkSection[] = [
        {
          sectionLabel: t("Common/Master plans"),
          items: Object.entries(grouped).flatMap(([groupName, links]) =>
            links.map((l, index) => ({
              ...l,
              title: index === 0 ? groupName : undefined,
            })),
          ),
        },
      ];

      setMasterPlanSections(nextSections);
    } finally {
      setIsLoadingMasterPlans(false);
    }
  };

  const fetchOperationalPlans = async () => {
    try {
      setIsLoadingOperationalPlans(true);

      const response = await fetch(`${apiUrl}/operational-plan?sortBy=unitGroupName&sortOrder=asc`, {
        headers: {
          "X-User-Language": localStorage.getItem("language") || "sv",
          "Content-Type": "application/json",
        },
      });

      const result = await response.json();

      if (!response.ok) {
        setOperationalPlanSections([]);
        return;
      }

      const allItems: OperationalPlan[] = result?.items ?? [];
      const items = allItems.filter((op) => !op.isHidden);

      const grouped = items.reduce(
        (acc: Record<string, Link[]>, operationalPlan: OperationalPlan) => {
          const groupName = operationalPlan.unitGroupName || t("Common/Groups");

          if (!acc[groupName]) {
            acc[groupName] = [];
          }

          acc[groupName].push({
            href: `/plan/operational-plans/${operationalPlan.unitGroupId}/${operationalPlan.id}`,
            label: operationalPlan.name,
          });

          return acc;
        },
        {},
      );

      const nextSections: LinkSection[] = [
        {
          sectionLabel: t("Common/Operational plans"),
          items: Object.entries(grouped).flatMap(([groupName, links]) =>
            links.map((l, index) => ({
              ...l,
              title: index === 0 ? groupName : undefined,
            })),
          ),
        },
      ];

      setOperationalPlanSections(nextSections);
    } finally {
      setIsLoadingOperationalPlans(false);
    }
  };

  useEffect(() => {
    fetchMasterPlans();
    fetchOperationalPlans();

    const handleMasterPlanUpdate = () => fetchMasterPlans();
    window.addEventListener("master-plan-list-updated", handleMasterPlanUpdate);

    const handleOperationalPlanUpdate = () => fetchOperationalPlans();
    window.addEventListener(
      "operational-plan-list-updated",
      handleOperationalPlanUpdate,
    );

    return () => {
      window.removeEventListener(
        "master-plan-list-updated",
        handleMasterPlanUpdate,
      );
      window.removeEventListener(
        "operational-plan-list-updated",
        handleOperationalPlanUpdate,
      );
    };
  }, []);

  const sections = [...masterPlanSections, ...operationalPlanSections];

  if (isLoadingMasterPlans || isLoadingOperationalPlans) {
    return <Message icon="loading" content="loading" fullscreen />;
  }

  return <NavPage sections={sections} variant="grid-sections" />;
};

export default PlanNavClient;
