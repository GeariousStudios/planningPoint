"use client";

import { useTranslations } from "next-intl";
import Input from "@/app/components/common/Input";
import {
  buttonDeletePrimaryClass,
  buttonDeleteSecondaryClass,
  buttonPrimaryClass,
  buttonSecondaryClass,
  iconButtonPrimaryClass,
  roundedButtonClass,
  switchClass,
  switchKnobClass,
  textPrimaryButtonClass,
  textSecondaryButtonClass,
} from "@/app/styles/buttonClasses";
import * as Outline from "@heroicons/react/24/outline";
import * as Solid from "@heroicons/react/24/solid";
import * as SmallerSolid from "@heroicons/react/20/solid";
import { motion } from "framer-motion";
import React, { createRef, useEffect, useMemo, useRef, useState } from "react";
import {
  AllFilter,
  Filter,
  FilterChip,
  TdCell,
  ThCell,
} from "../../components/manage/ManageComponents";
import Message from "../../components/common/Message";
import SingleDropdown from "../../components/common/SingleDropdown";
import CustomTooltip from "@/app/components/common/CustomTooltip";
import HoverIcon from "@/app/components/common/HoverIcon";
import { useParams } from "next/navigation";
import {
  MasterPlanElementStatus,
  useMasterPlan,
} from "@/app/hooks/useMasterPlan";
import {
  badgeClass,
  filterClass,
  filterIconClass,
  tdClass,
  thClass,
} from "@/app/components/manage/ManageClasses";
import { useHandbook } from "@/app/context/HandbookContext";
import SideMenu from "@/app/components/sideMenu/SideMenu";

type Props = {
  isAuthReady: boolean | null;
  isLoggedIn: boolean | null;
  isConnected: boolean | null;
  isPlanner: boolean | null;
};

const OperationalPlanClient = (props: Props) => {
  const t = useTranslations();
  const { operationalPlanId } = useParams();
  const apiUrl = process.env.NEXT_PUBLIC_API_URL;
  const token =
    typeof window !== "undefined" ? localStorage.getItem("token") : null;

  // --- Update handbook ---
  const { setHandbook } = useHandbook();

  useEffect(() => {
    setHandbook("Operational plan");
  }, [setHandbook]);

  return (
    <>
      <Message content={t("Common/Not implemented")} />
    </>
  );
};

export default OperationalPlanClient;
