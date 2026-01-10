"use client";

import { useEffect, useState } from "react";
import { useTranslations } from "next-intl";
import { TdCell, ThCell } from "@/app/components/manage/ManageComponents";
import SingleDropdown from "@/app/components/common/SingleDropdown";
import ExcelAutocomplete from "@/app/components/manage/ExcelAutoComplete";
import Message from "@/app/components/common/Message";
import {
  buttonPrimaryClass,
  buttonSecondaryClass,
} from "@/app/styles/buttonClasses";
import * as Outline from "@heroicons/react/24/outline";
import * as Solid from "@heroicons/react/24/solid";
import LoadingSpinner from "@/app/components/common/LoadingSpinner";
import HoverIcon from "@/app/components/common/HoverIcon";
import CustomTooltip from "@/app/components/common/CustomTooltip";
import Toast from "@/app/components/toast/Toast";
import { useToast } from "@/app/components/toast/ToastProvider";
import { useHandbook } from "@/app/context/HandbookContext";

type Props = {
  isConnected: boolean | null;
};

const ImportRulesClient = (props: Props) => {
  const t = useTranslations();

  // --- VARIABLES ---
  // --- States ---
  const [masterPlans, setMasterPlans] = useState<
    { id: number; name: string }[]
  >([]);
  const [fields, setFields] = useState<
    { id: number; name: string; dataType: string }[]
  >([]);
  const [selectedMasterPlan, setSelectedMasterPlan] = useState<string>("");
  const [columnMapping, setColumnMapping] = useState<Record<number, string>>(
    {},
  );
  const [originalMapping, setOriginalMapping] = useState<
    Record<number, string>
  >({});
  const [isFetchingFields, setIsFetchingFields] = useState(false);
  const [isSaving, setIsSaving] = useState(false);
  const [isReverting, setIsReverting] = useState(false);

  // --- Other ---
  const { notify } = useToast();
  const apiUrl = process.env.NEXT_PUBLIC_API_URL;
  const token =
    typeof window !== "undefined" ? localStorage.getItem("token") : null;

  // --- Fetch master plans ---
  useEffect(() => {
    const fetchMasterPlans = async () => {
      const response = await fetch(`${apiUrl}/master-plan`, {
        headers: {
          "Content-Type": "application/json",
          Authorization: `Bearer ${token}`,
        },
      });

      if (!response.ok) {
        return;
      }

      const result = await response.json();
      setFields(result.fields || []);
      await fetchMappings(String(selectedMasterPlan));

      setMasterPlans(result.items);
    };

    fetchMasterPlans();
  }, []);

  useEffect(() => {
    if (!selectedMasterPlan) {
      return;
    }

    const fetchFields = async () => {
      try {
        setIsFetchingFields(true);
        const response = await fetch(
          `${apiUrl}/master-plan/fetch/${selectedMasterPlan}`,
          {
            headers: {
              "Content-Type": "application/json",
              Authorization: `Bearer ${token}`,
            },
          },
        );

        if (!response.ok) {
          setFields([]);
          setColumnMapping({});
          return;
        }

        const result = await response.json();

        setFields(result.fields || []);
        await fetchMappings(selectedMasterPlan);
      } catch (error) {
      } finally {
        setIsFetchingFields(false);
      }
    };

    fetchFields();
  }, [selectedMasterPlan]);

  // --- Fetch existing mappings ---
  const fetchMappings = async (id: string) => {
    const response = await fetch(`${apiUrl}/master-plan/mapping/${id}`, {
      headers: {
        "Content-Type": "application/json",
        Authorization: `Bearer ${token}`,
      },
    });

    if (!response.ok) {
      setColumnMapping({});
      setOriginalMapping({});
      return;
    }

    const result = await response.json();
    const map: Record<number, string> = {};
    result.forEach((m: { fieldId: number; excelColumn: string }) => {
      map[m.fieldId] = m.excelColumn;
    });

    setColumnMapping(map);
    setOriginalMapping(map);
  };

  // --- Save mappings ---
  const saveMappings = async () => {
    if (!selectedMasterPlan) {
      return;
    }
    setIsSaving(true);

    const response = await fetch(
      `${apiUrl}/master-plan/mapping/${selectedMasterPlan}`,
      {
        method: "POST",
        headers: {
          "Content-Type": "application/json",
          Authorization: `Bearer ${token}`,
        },
        body: JSON.stringify(columnMapping),
      },
    );

    notify("success", t("ImportRules/Rules saved"));
    setIsSaving(false);
    setOriginalMapping(columnMapping);
  };

  // --- Revert mappings ---
  const revertMappings = async () => {
    if (!selectedMasterPlan) {
      return;
    }

    setIsReverting(true);

    await fetchMappings(selectedMasterPlan);

    notify("info", t("ImportRules/Changes reverted"));
    setIsReverting(false);
  };

  const hasChanges =
    JSON.stringify(columnMapping) !== JSON.stringify(originalMapping);

  // --- Excel columns generation ---
  const excelColumns = Array.from({ length: 16384 }, (_, i) => {
    let col = "";
    let n = i;
    while (n >= 0) {
      col = String.fromCharCode((n % 26) + 65) + col;
      n = Math.floor(n / 26) - 1;
    }
    return { label: col, value: col };
  });

  // --- Update handbook (Unique) ---
  const { setHandbook } = useHandbook();

  useEffect(() => {
    setHandbook("Import rules");
  }, []);

  return (
    <div className="flex flex-col gap-4">
      {/* --- ACTION BAR --- */}
      {/* --- Save --- */}
      <div className="flex justify-between">
        <CustomTooltip
          content={
            fields.length === 0
              ? t("ImportRules/Tooltip select a master plan")
              : t("ImportRules/Tooltip save rules")
          }
          showOnTouch
          longDelay
        >
          <button
            onClick={saveMappings}
            className={`${buttonPrimaryClass} group lg:w-max lg:px-4`}
            disabled={
              fields.length === 0 ||
              isSaving ||
              isReverting ||
              isFetchingFields ||
              !hasChanges
            }
          >
            {isSaving ? (
              <div className="flex items-center justify-center gap-2">
                <LoadingSpinner />
                <span className="hidden lg:block">
                  {t("ImportRules/Saving rules")}
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
                  {t("ImportRules/Save rules")}
                </span>
              </div>
            )}
          </button>
        </CustomTooltip>

        {/* --- Revert --- */}
        <CustomTooltip
          content={
            fields.length === 0
              ? t("ImportRules/Tooltip select a master plan")
              : t("ImportRules/Tooltip revert changes")
          }
          showOnTouch
          longDelay
        >
          <button
            onClick={revertMappings}
            className={`${buttonSecondaryClass} group lg:w-max lg:px-4`}
            disabled={
              fields.length === 0 || isSaving || isReverting || isFetchingFields
            }
          >
            {isReverting ? (
              <div className="flex items-center justify-center gap-2">
                <LoadingSpinner />
                <span className="hidden lg:block">
                  {t("ImportRules/Reverting changes")}
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
                  {t("ImportRules/Revert changes")}
                </span>
              </div>
            )}
          </button>
        </CustomTooltip>
      </div>

      {/* --- MASTER PLAN SELECTION --- */}
      <div className="grid w-full rounded-2xl bg-(--bg-modal)">
        <div className="flex items-center justify-between gap-4 px-6 pt-6">
          <h2 className="text-lg font-semibold whitespace-nowrap">
            {t("ImportRules/Import rules")} {t("Common/for")}{" "}
            {t("Common/master plan")}
          </h2>
        </div>

        <div className="overflow-hidden px-6 pb-6">
          <div className="grid gap-6">
            <hr className="-mx-6 mt-6 text-(--border-tertiary)" />

            <div className="flex items-center gap-2">
              <hr className="w-12 text-(--border-tertiary)" />
              <h3 className="text-sm whitespace-nowrap text-(--text-secondary)">
                {t("ImportRules/Select a master plan")}
              </h3>
              <hr className="w-full text-(--border-tertiary)" />
            </div>

            <SingleDropdown
              label={t("Common/Master plan")}
              options={masterPlans.map((p) => ({
                label: p.name,
                value: String(p.id),
              }))}
              value={selectedMasterPlan}
              onChange={(id) => {
                setSelectedMasterPlan(String(id));
                setColumnMapping({});
              }}
              required
              usePortal
              onModal
            />
          </div>
        </div>
      </div>

      {/* --- FIELDS SELECTION --- */}
      {isFetchingFields ? (
        <div className="mt-8">
          <Message icon="loading" content={t("ImportRules/Fetching fields")} />
        </div>
      ) : fields.length === 0 && selectedMasterPlan && !isFetchingFields ? (
        <div className="mt-8">
          <Message icon="" content={t("ImportRules/No fields")} />
        </div>
      ) : fields.length === 0 && !selectedMasterPlan && !isFetchingFields ? (
        <div className="mt-8">
          <Message
            icon="noData"
            content={t("ImportRules/No master plan selected")}
          />
        </div>
      ) : (
        fields.length > 0 && (
          <div className="xs:grid-cols-2 grid grid-cols-1 gap-4 lg:grid-cols-3 xl:grid-cols-4">
            {fields.map((f) => (
              <div key={f.id} className="flex flex-col gap-2">
                <div
                  className={`${f.dataType !== "Text" ? "border-(--locked) opacity-50" : "border-(--border-main)"} overflow-x-auto rounded border`}
                >
                  <table className="table w-full table-auto border-collapse">
                    <thead
                      className={`${f.dataType !== "Text" ? "bg-(--locked)/75" : "bg-(--bg-grid-header)"}`}
                    >
                      <tr>
                        <ThCell
                          label={f.name}
                          sortable={false}
                          classNameAddition={
                            f.dataType !== "Text" ? "border-b-(--locked)" : ""
                          }
                        />
                      </tr>
                    </thead>
                    <tbody
                      className={`${f.dataType !== "Text" ? "bg-(--locked)/25" : ""}`}
                    >
                      <tr>
                        <TdCell childClassNameAddition="overflow-visible -mx-2">
                          <ExcelAutocomplete
                            key={columnMapping[f.id] ?? ""}
                            options={excelColumns}
                            value={columnMapping[f.id] ?? ""}
                            onChange={(val) =>
                              f.dataType === "Text"
                                ? setColumnMapping((prev) => ({
                                    ...prev,
                                    [f.id]: val,
                                  }))
                                : undefined
                            }
                            placeholder={t("ImportRules/Select excel column")}
                            disabled={f.dataType !== "Text"}
                          />
                        </TdCell>
                      </tr>
                    </tbody>
                  </table>
                </div>
                {f.dataType !== "Text" && (
                  <span className="text-sm text-(--text-secondary)">
                    {t("ImportRules/Non-text fields cannot be mapped")}
                  </span>
                )}
              </div>
            ))}
          </div>
        )
      )}
    </div>
  );
};

export default ImportRulesClient;
