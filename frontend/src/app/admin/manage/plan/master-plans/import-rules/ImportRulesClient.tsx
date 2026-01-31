"use client";

import { useEffect, useState } from "react";
import useTN from "@/app/hooks/useTN";
import { TdCell, ThCell } from "@/app/components/manage/ManageComponents";
import SingleDropdown from "@/app/components/common/SingleDropdown";
import ExcelAutocomplete from "@/app/components/manage/ExcelAutoComplete";
import Message from "@/app/components/common/Message";
import {
  buttonPrimaryClass,
  buttonSecondaryClass,
  smallSwitchClass,
  smallSwitchKnobClass,
  switchClass,
  switchKnobClass,
} from "@/app/styles/buttonClasses";
import * as Outline from "@heroicons/react/24/outline";
import * as Solid from "@heroicons/react/24/solid";
import LoadingSpinner from "@/app/components/common/LoadingSpinner";
import HoverIcon from "@/app/components/common/HoverIcon";
import CustomTooltip from "@/app/components/common/CustomTooltip";
import Toast from "@/app/components/toast/Toast";
import { useToast } from "@/app/components/toast/ToastProvider";
import { useHandbook } from "@/app/context/HandbookContext";
import { fetchMasterPlanFields } from "@/app/apis/manage/masterPlansApi";

type Props = {
  isConnected: boolean | null;
};

const ImportRulesClient = (props: Props) => {
  const t = useTN();

  // --- VARIABLES ---
  // --- States ---
  const [masterPlans, setMasterPlans] = useState<
    { id: number; name: string }[]
  >([]);
  const [fields, setFields] = useState<
    { id: number; name: string; dataType: string }[]
  >([]);
  const [groupFieldId, setGroupFieldId] = useState<number | null>(null);
  const [selectedMasterPlan, setSelectedMasterPlan] = useState<string>("");
  const [columnMapping, setColumnMapping] = useState<Record<number, string>>(
    {},
  );
  const [replaceOnImport, setReplaceOnImport] = useState(false);
  const [skipRowOne, setSkipRowOne] = useState(false);
  const [originalMapping, setOriginalMapping] = useState<
    Record<number, string>
  >({});
  const [originalGroupFieldId, setOriginalGroupFieldId] = useState<
    number | null
  >(null);
  const [originalReplaceOnImport, setOriginalReplaceOnImport] = useState(false);
  const [originalSkipRowOne, setOriginalSkipRowOne] = useState(false);
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
      const response = await fetch(
        `${apiUrl}/master-plan?allowImport=true&pageSize=1000`,
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
      setMasterPlans(result.items || []);
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
        setGroupFieldId(result.groupFieldId ?? null);
        setOriginalGroupFieldId(result.groupFieldId ?? null);

        await fetchImportRules(selectedMasterPlan);
      } catch (error) {
      } finally {
        setIsFetchingFields(false);
      }
    };

    fetchFields();
  }, [selectedMasterPlan]);

  // --- Fetch existing import rules ---
  const fetchImportRules = async (id: string) => {
    const response = await fetch(`${apiUrl}/master-plan/import-rules/${id}`, {
      headers: {
        "Content-Type": "application/json",
        Authorization: `Bearer ${token}`,
      },
    });

    if (!response.ok) {
      setColumnMapping({});
      setOriginalMapping({});
      setGroupFieldId(null);
      setOriginalGroupFieldId(null);
      setReplaceOnImport(false);
      setOriginalReplaceOnImport(false);
      setSkipRowOne(false);
      setOriginalSkipRowOne(false);
      return;
    }

    const result = await response.json();

    const map: Record<number, string> = {};
    result.mappings.forEach((m: { fieldId: number; excelColumn: string }) => {
      map[m.fieldId] = m.excelColumn;
    });

    setColumnMapping(map);
    setOriginalMapping(map);

    setGroupFieldId(result.groupFieldId ?? null);
    setOriginalGroupFieldId(result.groupFieldId ?? null);

    setReplaceOnImport(!!result.replaceOnImport);
    setOriginalReplaceOnImport(!!result.replaceOnImport);

    setSkipRowOne(!!result.skipRowOne);
    setOriginalSkipRowOne(!!result.skipRowOne);
  };

  // --- Save import rules ---
  const saveImportRules = async () => {
    if (!selectedMasterPlan) {
      return;
    }

    setIsSaving(true);

    const response = await fetch(
      `${apiUrl}/master-plan/import-rules/${selectedMasterPlan}`,
      {
        method: "POST",
        headers: {
          "Content-Type": "application/json",
          Authorization: `Bearer ${token}`,
        },
        body: JSON.stringify({
          mappings: columnMapping,
          groupFieldId,
          replaceOnImport,
          skipRowOne,
        }),
      },
    );

    if (!response.ok) {
      notify("error", t("Modal/Unknown error"));
      setIsSaving(false);
      return;
    }

<<<<<<< Updated upstream
<<<<<<< Updated upstream
    notify("success", t("ImportRules/Rules saved"));
=======
=======
>>>>>>> Stashed changes
    notify(
      "success",
      t("common.rules", { capitalize: true }) +
        " " +
        t("actions.saved", { end: "!" }),
    );
<<<<<<< Updated upstream
>>>>>>> Stashed changes
=======
>>>>>>> Stashed changes
    setIsSaving(false);

    setOriginalMapping(columnMapping);
    setOriginalGroupFieldId(groupFieldId);
    setOriginalReplaceOnImport(replaceOnImport);
    setOriginalSkipRowOne(skipRowOne);
  };

  // --- Revert import rules ---
  const revertImportRules = async () => {
    if (!selectedMasterPlan) {
      return;
    }

    setIsReverting(true);

    setColumnMapping(originalMapping);
    setGroupFieldId(originalGroupFieldId);
    setReplaceOnImport(originalReplaceOnImport);
    setSkipRowOne(originalSkipRowOne);

<<<<<<< Updated upstream
<<<<<<< Updated upstream
    notify("info", t("ImportRules/Changes reverted"));
=======
=======
>>>>>>> Stashed changes
    notify(
      "success",
      t("common.changes", { capitalize: true }) +
        " " +
        t("common.saved", { end: "!" }),
      4000,
    );
<<<<<<< Updated upstream
>>>>>>> Stashed changes
=======
>>>>>>> Stashed changes
    setIsReverting(false);
  };

  const hasChanges =
    JSON.stringify(columnMapping) !== JSON.stringify(originalMapping) ||
    groupFieldId !== originalGroupFieldId ||
    replaceOnImport !== originalReplaceOnImport ||
    skipRowOne !== originalSkipRowOne;

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

  // --- Toggle group field ---
  const toggleGroupField = (fieldId: number) => {
    setGroupFieldId((prev) => (prev === fieldId ? null : fieldId));
  };

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
<<<<<<< Updated upstream
<<<<<<< Updated upstream
              : t("ImportRules/Tooltip save rules")
=======
              : t("actions.save", { capitalize: true }) +
                " " +
                t("common.rules")
>>>>>>> Stashed changes
=======
              : t("actions.save", { capitalize: true }) +
                " " +
                t("common.rules")
>>>>>>> Stashed changes
          }
          showOnTouch
          longDelay
        >
          <button
            onClick={saveImportRules}
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
<<<<<<< Updated upstream
<<<<<<< Updated upstream
                  {t("ImportRules/Saving rules")}
=======
                  {t("actions.saving", { capitalize: true }) +
                    " " +
                    t("common.rules", { end: "..." })}
>>>>>>> Stashed changes
=======
                  {t("actions.saving", { capitalize: true }) +
                    " " +
                    t("common.rules", { end: "..." })}
>>>>>>> Stashed changes
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
<<<<<<< Updated upstream
<<<<<<< Updated upstream
                  {t("ImportRules/Save rules")}
=======
                  {t("actions.save", { capitalize: true }) +
                    " " +
                    t("common.rules")}
>>>>>>> Stashed changes
=======
                  {t("actions.save", { capitalize: true }) +
                    " " +
                    t("common.rules")}
>>>>>>> Stashed changes
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
<<<<<<< Updated upstream
<<<<<<< Updated upstream
              : t("ImportRules/Tooltip revert changes")
=======
              : t("actions.revert", { capitalize: true }) +
                " " +
                t("common.changes")
>>>>>>> Stashed changes
=======
              : t("actions.revert", { capitalize: true }) +
                " " +
                t("common.changes")
>>>>>>> Stashed changes
          }
          showOnTouch
          longDelay
        >
          <button
            onClick={revertImportRules}
            className={`${buttonSecondaryClass} group lg:w-max lg:px-4`}
            disabled={
              fields.length === 0 || isSaving || isReverting || isFetchingFields
            }
          >
            {isReverting ? (
              <div className="flex items-center justify-center gap-2">
                <LoadingSpinner />
                <span className="hidden lg:block">
<<<<<<< Updated upstream
<<<<<<< Updated upstream
                  {t("ImportRules/Reverting changes")}
=======
                  {t("actions.reverting", { capitalize: true }) +
                    " " +
                    t("common.changes", { end: "..." })}
>>>>>>> Stashed changes
=======
                  {t("actions.reverting", { capitalize: true }) +
                    " " +
                    t("common.changes", { end: "..." })}
>>>>>>> Stashed changes
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
<<<<<<< Updated upstream
<<<<<<< Updated upstream
                  {t("ImportRules/Revert changes")}
=======
                  {t("actions.revert", { capitalize: true }) +
                    " " +
                    t("common.changes")}
>>>>>>> Stashed changes
=======
                  {t("actions.revert", { capitalize: true }) +
                    " " +
                    t("common.changes")}
>>>>>>> Stashed changes
                </span>
              </div>
            )}
          </button>
        </CustomTooltip>
      </div>

      {/* --- MASTER PLAN SELECTION --- */}
      <div className="grid w-full rounded-2xl bg-(--bg-modal)">
        <div className="flex items-center justify-between gap-4 px-6 pt-6">
<<<<<<< Updated upstream
<<<<<<< Updated upstream
          <h2 className="text-lg font-semibold whitespace-nowrap">
            {t("ImportRules/Import rules")} {t("Common/for")}{" "}
            {t("Common/master plan")}
=======
          <h2 className="text-lg font-semibold">
            {t("entities.importRules", { capitalize: true })} {t("common.for")}{" "}
            {t("entities.masterPlan")}
>>>>>>> Stashed changes
=======
          <h2 className="text-lg font-semibold">
            {t("entities.importRules", { capitalize: true })} {t("common.for")}{" "}
            {t("entities.masterPlan")}
>>>>>>> Stashed changes
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
              label={t("entities.masterPlan", { capitalize: true })}
              options={masterPlans.map((p) => ({
                label: p.name,
                value: String(p.id),
              }))}
              value={selectedMasterPlan}
              onChange={(id) => {
                const next = String(id);

                if (next === selectedMasterPlan) {
                  setSelectedMasterPlan("");
                  setColumnMapping({});
                  setGroupFieldId(null);
                  setOriginalGroupFieldId(null);
                  setFields([]);
                  return;
                }

                setSelectedMasterPlan(next);
                setColumnMapping({});
                setGroupFieldId(null);
                setOriginalGroupFieldId(null);
              }}
              required
              usePortal
              onModal
            />

            {selectedMasterPlan && (
              <>
                <div className="flex items-center gap-2">
                  <hr className="w-12 text-(--border-tertiary)" />
                  <h3 className="text-sm whitespace-nowrap text-(--text-secondary)">
                    {t("ImportRules/Master plan settings")}
                  </h3>
                  <hr className="w-full text-(--border-tertiary)" />
                </div>

                <div className="flex flex-wrap gap-x-12 gap-y-6">
                  <div className="flex items-center gap-2 truncate">
                    <button
                      type="button"
                      role="switch"
                      aria-checked={replaceOnImport}
                      className={switchClass(replaceOnImport)}
                      onClick={() => setReplaceOnImport((prev) => !prev)}
                    >
                      <div className={switchKnobClass(replaceOnImport)} />
                    </button>
                    {t("ImportRules/Replace master plan")}
                  </div>

                  <div className="flex items-center gap-2 truncate">
                    <button
                      type="button"
                      role="switch"
                      aria-checked={skipRowOne}
                      className={switchClass(skipRowOne)}
                      onClick={() => setSkipRowOne((prev) => !prev)}
                    >
                      <div className={switchKnobClass(skipRowOne)} />
                    </button>
                    {t("ImportRules/Skip row one")}
                  </div>
                </div>
              </>
            )}
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
                  // className={`${f.dataType !== "Text" ? "border-(--locked) opacity-50" : "border-(--border-main)"} overflow-x-auto rounded border`}
                  className="overflow-x-auto rounded border border-(--border-main)"
                >
                  <table className="table w-full table-auto border-collapse bg-(--bg-grid)">
                    <thead
                      // className={`${f.dataType !== "Text" ? "bg-(--locked)/75" : "bg-(--bg-grid-header)"}`}
                      className="bg-(--bg-grid-header)"
                    >
                      <tr>
                        {/* <ThCell
                          label={f.name}
                          sortable={false}
                          classNameAddition={
                            f.dataType !== "Text" ? "border-b-(--locked)" : ""
                          }
                        /> */}

                        <ThCell
                          label={
                            <div className="flex flex-wrap items-center justify-between gap-4">
                              <span className="truncate">{f.name}</span>
                              <div
                                className={`${columnMapping[f.id] ? "" : "cursor-not-allowed opacity-25"} flex items-center gap-2`}
                              >
                                <button
                                  type="button"
                                  role="switch"
                                  aria-checked={groupFieldId === f.id}
                                  className={`${smallSwitchClass(
                                    groupFieldId === f.id,
                                  )} ${columnMapping[f.id] ? "" : "!cursor-not-allowed"}`}
                                  onClick={() => toggleGroupField(f.id)}
                                  disabled={
                                    // f.dataType !== "Text" ||
                                    !columnMapping[f.id]
                                  }
                                >
                                  <div
                                    className={smallSwitchKnobClass(
                                      groupFieldId === f.id,
                                    )}
                                  />
                                </button>

                                <span className="text-sm font-light whitespace-nowrap text-(--text-secondary)">
                                  {t("ImportRules/Group key")}
                                </span>
                              </div>
                            </div>
                          }
                          sortable={false}
                          // classNameAddition={
                          //   f.dataType !== "Text" ? "border-b-(--locked)" : ""
                          // }
                        />
                      </tr>
                    </thead>
                    <tbody
                    // className={`${f.dataType !== "Text" ? "bg-(--locked)/25" : ""}`}
                    >
                      <tr>
                        <TdCell childClassNameAddition="overflow-visible -mx-2">
                          <ExcelAutocomplete
                            key={columnMapping[f.id] ?? ""}
                            options={excelColumns}
                            value={columnMapping[f.id] ?? ""}
                            // onChange={(val) =>
                            //   f.dataType === "Text"
                            //     ? setColumnMapping((prev) => ({
                            //         ...prev,
                            //         [f.id]: val,
                            //       }))
                            //     : undefined
                            // }
                            onChange={(val) => {
                              // if (f.dataType !== "Text") {
                              //   return;
                              // }

                              setColumnMapping((prev) => {
                                const next = { ...prev, [f.id]: val };

                                if (!val && groupFieldId === f.id) {
                                  setGroupFieldId(null);
                                }

                                return next;
                              });
                            }}
                            placeholder={t("ImportRules/Select excel column")}
                            // disabled={f.dataType !== "Text"}
                          />
                        </TdCell>
                      </tr>
                    </tbody>
                  </table>
                </div>
                {/* {f.dataType !== "Text" && (
                  <span className="text-sm text-(--text-secondary)">
                    {t("ImportRules/Non-text fields cannot be mapped")}
                  </span>
                )} */}
              </div>
            ))}
          </div>
        )
      )}
    </div>
  );
};

export default ImportRulesClient;
