"use client";

import CustomTooltip from "@/app/components/common/CustomTooltip";
import HoverIcon from "@/app/components/common/HoverIcon";
import LoadingSpinner from "@/app/components/common/LoadingSpinner";
import { useToast } from "@/app/components/toast/ToastProvider";
import { useHandbook } from "@/app/context/HandbookContext";
import useTN from "@/app/hooks/useTN";
import { use, useEffect, useState } from "react";
import * as Outline from "@heroicons/react/24/outline";
import * as Solid from "@heroicons/react/24/solid";
import {
  buttonPrimaryClass,
  buttonSecondaryClass,
  switchClass,
  switchKnobClass,
} from "@/app/styles/buttonClasses";
import SingleDropdown from "@/app/components/common/SingleDropdown";
import Message from "@/app/components/common/Message";

type Props = {
  isConnected: boolean | null;
};

const PlanningRulesClient = (props: Props) => {
  const t = useTN();

  // --- VARIABLES ---
  // --- States: Buttons ---
  const [isSaving, setIsSaving] = useState(false);
  const [isReverting, setIsReverting] = useState(false);

  // --- States: Backend ---
  const [operationalPlans, setOperationalPlans] = useState<
    { id: number; name: string }[]
  >([]);
  const [rules, setRules] = useState<
    { id: number; name: string; dataType: string }[]
  >([]);
  const [allowAutomaticPlanning, setAllowAutomaticPlanning] = useState(false);
  const [isFetchingRules, setIsFetchingRules] = useState(false);
  const [hasMasterPlan, setHasMasterPlan] = useState(false);
  const [fetchInterval, setFetchInterval] = useState<number>(-1);

  const [originalAllowAutomaticPlanning, setOriginalAllowAutomaticPlanning] =
    useState(false);
  const [originalFetchInterval, setOriginalFetchInterval] =
    useState<number>(-1);

  // --- States: Selections ---
  const [selectedOperationalPlan, setSelectedOperationalPlan] =
    useState<string>("");

  // --- Other ---
  const hasChanges =
    allowAutomaticPlanning !== originalAllowAutomaticPlanning ||
    fetchInterval !== originalFetchInterval;
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

  // --- Fetch selected operational plan ---
  useEffect(() => {
    const fetchSelectedOperationalPlan = async () => {
      const response = await fetch(
        `${apiUrl}/operational-plan/fetch/${selectedOperationalPlan}`,
        {
          headers: {
            "Content-Type": "application/json",
            Authorization: `Bearer ${token}`,
          },
        },
      );

      if (!response.ok) {
        return;
      }

      const result = await response.json();
      setHasMasterPlan(!!result.masterPlanId);
    };

    fetchSelectedOperationalPlan();
  }, [selectedOperationalPlan]);

  // --- Update handbook (Unique) ---
  const { setHandbook } = useHandbook();

  useEffect(() => {
    setHandbook("Planning rules");
  }, []);

  return (
    <div className="flex flex-col gap-4">
      {/* --- ACTION BAR --- */}
      {/* --- Save --- */}
      <div className="flex justify-between">
        <CustomTooltip
          content={
            !selectedOperationalPlan
              ? t("PlanningRules/Tooltip select an operational plan")
              : t("actions.save", { capitalize: true }) +
                " " +
                t("common.rules")
          }
          showOnTouch
          longDelay
        >
          <button
            onClick={() => {}}
            className={`${buttonPrimaryClass} group lg:w-max lg:px-4`}
            disabled={isSaving || isReverting || !hasChanges}
          >
            {isSaving ? (
              <div className="flex items-center justify-center gap-2">
                <LoadingSpinner />
                <span className="hidden lg:block">
                  {t("common.savingRules", { capitalize: true })}
                </span>
              </div>
            ) : (
              <div className="flex items-center justify-center gap-2">
                <HoverIcon
                  outline={Outline.CheckIcon}
                  solid={Solid.CheckIcon}
                  className="h-6 w-6"
                />
                <span className="hidden lg:block">
                  {t("actions.save", { capitalize: true }) +
                    " " +
                    t("common.rules")}
                </span>
              </div>
            )}
          </button>
        </CustomTooltip>

        {/* --- Revert --- */}
        <CustomTooltip
          content={
            !selectedOperationalPlan
              ? t("PlanningRules/Tooltip select an operational plan")
              : t("actions.revert", { capitalize: true }) +
                " " +
                t("common.changes")
          }
          showOnTouch
          longDelay
        >
          <button
            onClick={() => {}}
            className={`${buttonSecondaryClass} group lg:w-max lg:px-4`}
            disabled={isSaving || isReverting || !selectedOperationalPlan}
          >
            {isReverting ? (
              <div className="flex items-center justify-center gap-2">
                <LoadingSpinner />
                <span className="hidden lg:block">
                  {t("actions.reverting", { capitalize: true }) +
                    " " +
                    t("common.changes", { end: "..." })}
                </span>
              </div>
            ) : (
              <div className="flex items-center justify-center gap-2">
                <HoverIcon
                  outline={Outline.XMarkIcon}
                  solid={Solid.XMarkIcon}
                  className="h-6 w-6"
                />
                <span className="hidden lg:block">
                  {t("actions.revert", { capitalize: true }) +
                    " " +
                    t("common.changes")}
                </span>
              </div>
            )}
          </button>
        </CustomTooltip>
      </div>

      {/* --- OPERATIONAL PLAN SELECTION --- */}
      <div className="grid w-full rounded-2xl bg-(--bg-modal)">
        <div className="flex items-center justify-between gap-4 px-6 pt-6">
          <h2 className="text-lg font-semibold">
            {t("entities.planningRules", { capitalize: true })}{" "}
            {t("common.for")} {t("entities.operationalPlan")}
          </h2>
        </div>

        <div className="overflow-hidden px-6 pb-6">
          <div className="grid gap-6">
            <hr className="-mx-6 mt-6 text-(--border-tertiary)" />

            <div className="flex items-center gap-2">
              <hr className="w-12 text-(--border-tertiary)" />
              <h3 className="text-sm whitespace-nowrap text-(--text-secondary)">
                {t("PlanningRules/Select an operational plan")}
              </h3>
              <hr className="w-full text-(--border-tertiary)" />
            </div>

            <SingleDropdown
              label={t("entities.operationalPlan", { capitalize: true })}
              options={operationalPlans.map((p) => ({
                label: p.name,
                value: String(p.id),
              }))}
              value={selectedOperationalPlan}
              onChange={(id) => {
                const next = String(id);

                if (next === selectedOperationalPlan) {
                  setSelectedOperationalPlan("");
                  return;
                }

                setSelectedOperationalPlan(next);
              }}
              required
              usePortal
              onModal
            />

            {selectedOperationalPlan && (
              <>
                <div className="flex items-center gap-2">
                  <hr className="w-12 text-(--border-tertiary)" />
                  <h3 className="text-sm whitespace-nowrap text-(--text-secondary)">
                    {t("PlanningRules/Operational plan settings")}
                  </h3>
                  <hr className="w-full text-(--border-tertiary)" />
                </div>

                <div
                  className={`${!hasMasterPlan ? "cursor-not-allowed opacity-25" : ""} flex flex-wrap gap-x-12 gap-y-6`}
                >
                  <div className="flex flex-col gap-8">
                    {/* --- Allow automatic planning --- */}
                    <CustomTooltip
                      content={
                        !hasMasterPlan &&
                        t("PlanningRules/Tooltip cannot without master plan")
                      }
                      showOnTouch
                    >
                      <div className="flex items-center gap-2 truncate">
                        <button
                          type="button"
                          role="switch"
                          aria-checked={allowAutomaticPlanning}
                          className={`${switchClass(
                            allowAutomaticPlanning && hasMasterPlan,
                          )} ${!hasMasterPlan ? "!cursor-not-allowed" : ""}`}
                          onClick={() => {
                            if (!hasMasterPlan) {
                              return;
                            }

                            setAllowAutomaticPlanning((prev) => !prev);
                            setFetchInterval(-1);
                          }}
                          disabled={!hasMasterPlan}
                        >
                          <div
                            className={switchKnobClass(
                              allowAutomaticPlanning && hasMasterPlan,
                            )}
                          />
                        </button>
                        {t("PlanningRules/Allow automatic planning")}

                        <CustomTooltip
                          content={t(
                            "PlanningRules/Tooltip allow automatic planning",
                          )}
                          showOnTouch
                        >
                          <span
                            className={`${!hasMasterPlan ? "pointer-events-none" : ""} group min-h-4 min-w-4 cursor-help`}
                          >
                            <HoverIcon
                              outline={Outline.InformationCircleIcon}
                              solid={Solid.InformationCircleIcon}
                              className="flex"
                            />
                          </span>
                        </CustomTooltip>
                      </div>
                    </CustomTooltip>

                    {/* --- Fetch interval --- */}
                    <CustomTooltip
                      content={
                        (!hasMasterPlan || !allowAutomaticPlanning) &&
                        t(
                          "PlanningRules/Tooltip cannot without allow automatic planning",
                        )
                      }
                      showOnTouch
                    >
                      <div
                        className={`${hasMasterPlan && !allowAutomaticPlanning ? "!cursor-not-allowed opacity-25" : ""} w-full items-center gap-2 whitespace-nowrap`}
                      >
                        <SingleDropdown
                          label={t("PlanningRules/Fetch interval")}
                          onChange={(val) => {
                            if (!hasMasterPlan || !allowAutomaticPlanning) {
                              return;
                            }

                            setFetchInterval(Number(val));
                          }}
                          options={[
                            {
                              label: t("PlanningRules/Do not fetch"),
                              value: -1,
                            },
                            {
                              label: "10 " + t("time.minute", { plural: true }),
                              value: 10,
                            },
                            {
                              label: "30 " + t("time.minute", { plural: true }),
                              value: 30,
                            },
                            {
                              label: "1 " + t("time.hour", { plural: true }),
                              value: 60,
                            },
                            {
                              label: "24 " + t("time.hour", { plural: true }),
                              value: 1440,
                            },
                          ]}
                          value={fetchInterval}
                          onModal
                          usePortal
                          disabled={!hasMasterPlan || !allowAutomaticPlanning}
                        />
                      </div>
                    </CustomTooltip>
                  </div>
                </div>
              </>
            )}
          </div>
        </div>
      </div>

      {isFetchingRules ? (
        <div className="mt-8">
          <Message icon="loading" content={t("PlanningRules/Fetching rules")} />
        </div>
      ) : !selectedOperationalPlan ? (
        <div className="mt-8">
          <Message
            icon="noData"
            content={t("PlanningRules/No operational plan selected")}
          />
        </div>
      ) : (
        <div></div>
      )}
    </div>
  );
};

export default PlanningRulesClient;
