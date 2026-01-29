"use client";

import { useToast } from "@/app/components/toast/ToastProvider";
import { useHandbook } from "@/app/context/HandbookContext";
import { useTranslations } from "next-intl";
import { useEffect, useState } from "react";

type Props = {
  isConnected: boolean | null;
};

const PlanningRulesClient = (props: Props) => {
  const t = useTranslations();

  // --- VARIABLES ---
  // --- States ---
  const [operationalPlans, setOperationalPlans] = useState<
    { id: number; name: string }[]
  >([]);

  // --- Other ---
  const { notify } = useToast();
  const apiUrl = process.env.NEXT_PUBLIC_API_URL;
  const token =
    typeof window !== "undefined" ? localStorage.getItem("token") : null;

  // --- Fetch operational plans ---
  useEffect(() => {
    const fetchOperationalPlans = async () => {
      const response = await fetch(`${apiUrl}/operational-plan`, {
        headers: {
          "Content-Type": "application/json",
          Authorization: `Bearer ${token}`,
        },
      });

      if (!response.ok) {
        return;
      }

      const result = await response.json();
      setOperationalPlans(result.items || []);
    };

    fetchOperationalPlans();
  }, []);

  // --- Update handbook (Unique) ---
  const { setHandbook } = useHandbook();

  useEffect(() => {
    setHandbook("Import rules");
  }, []);

  return <div className="flex flex-col gap-4">{/* --- ACTION BAR --- */}</div>;
};

export default PlanningRulesClient;
