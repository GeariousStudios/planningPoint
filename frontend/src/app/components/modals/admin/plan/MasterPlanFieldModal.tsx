"use client";

import { FormEvent, useEffect, useRef, useState } from "react";
import { PencilSquareIcon, PlusIcon } from "@heroicons/react/24/outline";
import Input from "../../../common/Input";
import { useToast } from "../../../toast/ToastProvider";
import {
  buttonPrimaryClass,
  buttonSecondaryClass,
  switchClass,
  switchKnobClass,
} from "@/app/styles/buttonClasses";
import {
  MasterPlanFieldDataType,
  getMasterPlanFieldDataTypeOptions,
} from "@/app/types/manageTypes";
import ModalBase, { ModalBaseHandle } from "../../ModalBase";
import { useTranslations } from "next-intl";
import { masterPlanFieldConstraints } from "@/app/helpers/inputConstraints";
import SingleDropdown from "@/app/components/common/SingleDropdown";
import LoadingSpinner from "@/app/components/common/LoadingSpinner";
import CustomTooltip from "@/app/components/common/CustomTooltip";
import HoverIcon from "@/app/components/common/HoverIcon";
import * as Outline from "@heroicons/react/24/outline";
import * as Solid from "@heroicons/react/24/solid";
import { setGlobal } from "next/dist/trace";

type Props = {
  isOpen: boolean;
  onClose: () => void;
  itemId?: number | null;
  onItemUpdated: () => void;
};

type MasterPlanFieldDto = {
  id: number;
  name: string;
  dataType: MasterPlanFieldDataType;
  alignment: "Left" | "Center" | "Right";
  isHidden: boolean;
};

const MasterPlanFieldModal = (props: Props) => {
  const t = useTranslations();

  // --- VARIABLES ---
  // --- Refs ---
  const formRef = useRef<HTMLFormElement>(null);
  const modalRef = useRef<ModalBaseHandle>(null);
  const getScrollEl = () => modalRef.current?.getScrollEl() ?? null;
  const updatedMasterPlanFieldsRef = useRef<MasterPlanFieldDto[]>([]);

  // --- States ---
  const [isSaving, setIsSaving] = useState(false);
  const [name, setName] = useState("");
  const [isHidden, setIsHidden] = useState(false);
  const [dataType, setDataType] = useState<MasterPlanFieldDataType>("Text");
  const [alignment, setAlignment] = useState<"Left" | "Center" | "Right">(
    "Left",
  );
  const [localIncremental, setLocalIncremental] = useState(false);
  const [globalIncremental, setGlobalIncremental] = useState(false);

  const [originalName, setOriginalName] = useState("");
  const [originalIsHidden, setOriginalIsHidden] = useState(false);
  const [originalDataType, setOriginalDataType] =
    useState<MasterPlanFieldDataType>("Text");
  const [originalAlignment, setOriginalAlignment] = useState<
    "Left" | "Center" | "Right"
  >("Left");
  const [originalLocalIncremental, setOriginalLocalIncremental] =
    useState(false);
  const [originalGlobalIncremental, setOriginalGlobalIncremental] =
    useState(false);
  const [isDirty, setIsDirty] = useState(false);

  const [isAnyDragging, setIsAnyDragging] = useState(false);

  const [updateTick, setUpdateTick] = useState(0);

  // --- Other ---
  const token = localStorage.getItem("token");
  const { notify } = useToast();
  const apiUrl = process.env.NEXT_PUBLIC_API_URL;

  useEffect(() => {
    if (!props.isOpen) {
      return;
    }

    if (props.isOpen && props.itemId !== null && props.itemId !== undefined) {
      fetchMasterPlanField();
    } else {
      setName("");
      setOriginalName("");

      setIsHidden(false);
      setOriginalIsHidden(false);

      setDataType("Text");
      setOriginalDataType("Text");

      setAlignment("Left");
      setOriginalAlignment("Left");

      setLocalIncremental(false);
      setOriginalLocalIncremental(false);

      setGlobalIncremental(false);
      setOriginalGlobalIncremental(false);
    }
  }, [props.isOpen, props.itemId]);

  // --- BACKEND ---
  // --- Create master plan field ---
  const createMasterPlanField = async (event: FormEvent) => {
    event.preventDefault();
    setIsSaving(true);

    try {
      const response = await fetch(`${apiUrl}/master-plan-field/create`, {
        method: "POST",
        headers: {
          "X-User-Language": localStorage.getItem("language") || "sv",
          "Content-Type": "application/json",
          Authorization: `Bearer ${token}`,
        },
        body: JSON.stringify({
          name,
          isHidden,
          dataType,
          alignment,
          localIncremental,
          globalIncremental,
        }),
      });

      if (response.status === 401) {
        localStorage.removeItem("token");
        return;
      }

      const result = await response.json();

      if (!response.ok) {
        if (result.errors) {
          let firstError: string | null = null;
          let lowestOrder = Number.MAX_SAFE_INTEGER;

          for (const field in result.errors) {
            const fieldErrors = result.errors[field];

            for (const msg of fieldErrors) {
              const match = msg.match(/\[(\d+)\]/);
              const order = match ? parseInt(match[1], 10) : 99;

              if (order < lowestOrder) {
                lowestOrder = order;
                firstError = msg.replace(/\[\d+\]\s*/, "");
              }
            }
          }
          if (firstError) {
            notify("error", firstError);
          }
          return;
        }

        if (result.message) {
          notify("error", result.message);
          return;
        }

        notify("error", t("Modal/Unknown error"));
        return;
      }

      (result.fields ?? []).forEach((mpf: any) => {
        const existing = updatedMasterPlanFieldsRef.current.find(
          (f) => f.name.trim() === mpf.name.trim() && f.id < 0,
        );

        if (existing) {
          existing.id = mpf.id;
        }
      });

      props.onClose();
      props.onItemUpdated();
      notify(
        "success",
        t("Common/Master plan field") + t("Modal/created2"),
        4000,
      );
    } catch (err) {
      notify("error", t("Modal/Unknown error"));
    } finally {
      setIsSaving(false);
    }
  };

  // --- Fetch master plan field ---
  const fetchMasterPlanField = async () => {
    try {
      const response = await fetch(
        `${apiUrl}/master-plan-field/fetch/${props.itemId}`,
        {
          headers: {
            "X-User-Language": localStorage.getItem("language") || "sv",
            "Content-Type": "application/json",
            Authorization: `Bearer ${token}`,
          },
        },
      );

      const result = await response.json();

      if (!response.ok) {
        notify("error", result?.message ?? t("Modal/Unknown error"));
      } else {
        fillMasterPlanFieldData(result);
      }
    } catch (err) {
      notify("error", t("Modal/Unknown error"));
    }
  };

  const fillMasterPlanFieldData = (result: any) => {
    setName(result.name ?? "");
    setOriginalName(result.name ?? "");

    setIsHidden(result.isHidden ?? false);
    setOriginalIsHidden(result.isHidden ?? false);

    setDataType(result.dataType ?? "Text");
    setOriginalDataType(result.dataType ?? "Text");

    setAlignment(result.alignment ?? "Left");
    setOriginalAlignment(result.alignment ?? "Left");

    setLocalIncremental(result.localIncremental ?? false);
    setOriginalLocalIncremental(result.localIncremental ?? false);
  };

  // --- Update master plan field ---
  const updateMasterPlanField = async (event: FormEvent) => {
    event.preventDefault();
    setIsSaving(true);

    try {
      const response = await fetch(
        `${apiUrl}/master-plan-field/update/${props.itemId}`,
        {
          method: "PUT",
          headers: {
            "X-User-Language": localStorage.getItem("language") || "sv",
            "Content-Type": "application/json",
            Authorization: `Bearer ${token}`,
          },
          body: JSON.stringify({
            name,
            isHidden,
            dataType,
            alignment,
            localIncremental,
            globalIncremental,
          }),
        },
      );

      if (response.status === 401) {
        localStorage.removeItem("token");
        return;
      }

      const result = await response.json();

      if (!response.ok) {
        if (result.errors) {
          let firstError: string | null = null;
          let lowestOrder = Number.MAX_SAFE_INTEGER;

          for (const field in result.errors) {
            const fieldErrors = result.errors[field];

            for (const msg of fieldErrors) {
              const match = msg.match(/\[(\d+)\]/);
              const order = match ? parseInt(match[1], 10) : 99;

              if (order < lowestOrder) {
                lowestOrder = order;
                firstError = msg.replace(/\[\d+\]\s*/, "");
              }
            }
          }
          if (firstError) {
            notify("error", firstError);
          }
          return;
        }

        if (result.message) {
          notify("error", result.message);
          return;
        }

        notify("error", t("Modal/Unknown error"));
        return;
      }

      (result.fields ?? []).forEach((mpf: any) => {
        const existing = updatedMasterPlanFieldsRef.current.find(
          (s) => s.name.toLowerCase() === mpf.name.toLowerCase() && s.id < 0,
        );

        if (existing) {
          existing.id = mpf.id;
        }
      });

      props.onClose();
      props.onItemUpdated();
      notify(
        "success",
        t("Common/Master plan field") + t("Modal/updated2"),
        4000,
      );
    } catch (err) {
      notify("error", t("Modal/Unknown error"));
    } finally {
      setIsSaving(false);
    }
  };

  const handleSaveClick = () => {
    formRef.current?.requestSubmit();
  };

  // --- SET/UNSET IS DIRTY ---
  useEffect(() => {
    if (props.itemId === null || props.itemId === undefined) {
      const dirty =
        name !== "" ||
        isHidden !== false ||
        dataType !== "Text" ||
        alignment !== "Left" ||
        localIncremental !== false ||
        globalIncremental !== false;

      setIsDirty(dirty);
      return;
    }

    const dirty =
      name !== originalName ||
      isHidden !== originalIsHidden ||
      dataType !== originalDataType ||
      alignment !== originalAlignment ||
      localIncremental !== originalLocalIncremental ||
      globalIncremental !== originalGlobalIncremental;

    setIsDirty(dirty);
  }, [
    props.itemId,
    name,
    isHidden,
    dataType,
    alignment,
    localIncremental,
    globalIncremental,
    originalName,
    originalIsHidden,
    originalDataType,
    originalAlignment,
    originalLocalIncremental,
    originalGlobalIncremental,
  ]);

  return (
    <>
      {props.isOpen && (
        <form
          ref={formRef}
          onSubmit={(e) =>
            props.itemId ? updateMasterPlanField(e) : createMasterPlanField(e)
          }
        >
          <ModalBase
            ref={modalRef}
            isOpen={props.isOpen}
            onClose={() => {
              props.onClose();
            }}
            icon={props.itemId ? PencilSquareIcon : PlusIcon}
            label={
              props.itemId
                ? t("Common/Edit") + " " + t("Common/master plan field")
                : t("Common/Add") + " " + t("Common/master plan field")
            }
            confirmOnClose
            isDirty={isDirty}
          >
            <ModalBase.Content>
              <div className="flex items-center gap-2">
                <hr className="w-12 text-(--border-tertiary)" />
                <h3 className="text-sm whitespace-nowrap text-(--text-secondary)">
                  {t("MasterPlanFieldModal/Info1")}
                </h3>
                <hr className="w-full text-(--border-tertiary)" />
              </div>

              <div className="mb-8 grid grid-cols-1 gap-6">
                <Input
                  label={t("Common/Name")}
                  value={name}
                  onChange={(val) => setName(String(val))}
                  onModal
                  required
                  {...masterPlanFieldConstraints.name}
                />
              </div>

              <div className="flex items-center gap-2">
                <hr className="w-12 text-(--border-tertiary)" />
                <h3 className="text-sm whitespace-nowrap text-(--text-secondary)">
                  {t("MasterPlanFieldModal/Info2")}
                </h3>

                <hr className="w-full text-(--border-tertiary)" />
              </div>
              <div className="xs:grid-cols-2 mb-8 grid grid-cols-1 gap-6">
                <SingleDropdown
                  id="datatype"
                  label={t("MasterPlanFieldModal/Data type")}
                  value={dataType}
                  onChange={(val) =>
                    setDataType(val as MasterPlanFieldDataType)
                  }
                  options={getMasterPlanFieldDataTypeOptions(t).map((opt) => ({
                    label: opt.label,
                    value: opt.value,
                  }))}
                  required
                  onModal
                />

                <SingleDropdown
                  id="alignment"
                  label={t("MasterPlanFieldModal/Alignment")}
                  value={alignment}
                  onChange={(val) =>
                    setAlignment(val as "Left" | "Center" | "Right")
                  }
                  options={[
                    { label: t("Common/Left"), value: "Left" },
                    { label: t("Common/Center"), value: "Center" },
                    { label: t("Common/Right"), value: "Right" },
                  ]}
                  required
                  onModal
                />
              </div>

              {dataType === "Number" ? (
                <>
                  <div className="flex items-center gap-2">
                    <hr className="w-12 text-(--border-tertiary)" />
                    <h3 className="text-sm whitespace-nowrap text-(--text-secondary)">
                      {t("MasterPlanFieldModal/Info3")}
                    </h3>
                    <hr className="w-full text-(--border-tertiary)" />
                  </div>

                  <div className="xs:grid-cols-1 mb-8 grid grid-cols-1 gap-6">
                    <div className="flex items-center gap-2 truncate">
                      <button
                        type="button"
                        role="switch"
                        aria-checked={localIncremental}
                        className={switchClass(localIncremental)}
                        onClick={() => {
                          setLocalIncremental((prev) => !prev);
                          setGlobalIncremental(false);
                        }}
                      >
                        <div className={switchKnobClass(localIncremental)} />
                      </button>
                      <span className="mb-0.5">
                        {t("MasterPlanFieldModal/Local incremental")}
                      </span>

                      <CustomTooltip
                        content={t(
                          "MasterPlanFieldModal/Tooltip local incremental",
                        )}
                        showOnTouch
                      >
                        <span className="group min-h-4 min-w-4 cursor-help">
                          <HoverIcon
                            outline={Outline.InformationCircleIcon}
                            solid={Solid.InformationCircleIcon}
                            className="flex"
                          />
                        </span>
                      </CustomTooltip>
                    </div>
                    <div className="flex items-center gap-2 truncate">
                      <button
                        type="button"
                        role="switch"
                        aria-checked={globalIncremental}
                        className={switchClass(globalIncremental)}
                        onClick={() => {
                          setGlobalIncremental((prev) => !prev);
                          setLocalIncremental(false);
                        }}
                      >
                        <div className={switchKnobClass(globalIncremental)} />
                      </button>
                      <span className="mb-0.5">
                        {t("MasterPlanFieldModal/Global incremental")}
                      </span>
                      <CustomTooltip
                        content={t(
                          "MasterPlanFieldModal/Tooltip global incremental",
                        )}
                        showOnTouch
                      >
                        <span className="group min-h-4 min-w-4 cursor-help">
                          <HoverIcon
                            outline={Outline.InformationCircleIcon}
                            solid={Solid.InformationCircleIcon}
                            className="flex"
                          />
                        </span>
                      </CustomTooltip>
                    </div>
                  </div>
                </>
              ) : (
                ""
              )}

              <div className="flex items-center gap-2">
                <hr className="w-12 text-(--border-tertiary)" />
                <h3 className="text-sm whitespace-nowrap text-(--text-secondary)">
                  {t("Common/Status")}
                </h3>
                <hr className="w-full text-(--border-tertiary)" />
              </div>

              <div className="mb-8 flex justify-between gap-6">
                <div className="flex items-center gap-2 truncate">
                  <button
                    type="button"
                    role="switch"
                    aria-checked={isHidden}
                    className={switchClass(isHidden)}
                    onClick={() => setIsHidden((prev) => !prev)}
                  >
                    <div className={switchKnobClass(isHidden)} />
                  </button>
                  <span className="mb-0.5">
                    {t("MasterPlanFieldModal/Hide master plan field")}
                  </span>
                </div>
              </div>
            </ModalBase.Content>

            <ModalBase.Footer>
              <button
                type="button"
                onClick={handleSaveClick}
                className={`${buttonPrimaryClass} xs:col-span-2 col-span-3`}
                disabled={isSaving}
              >
                {isSaving ? (
                  props.itemId ? (
                    <div className="flex items-center justify-center gap-2">
                      <LoadingSpinner /> {t("Modal/Saving")}
                    </div>
                  ) : (
                    <div className="flex items-center justify-center gap-2">
                      <LoadingSpinner /> {t("Common/Adding")}
                    </div>
                  )
                ) : props.itemId ? (
                  t("Modal/Save")
                ) : (
                  t("Common/Add")
                )}
              </button>
              <button
                type="button"
                onClick={() => modalRef.current?.requestClose()}
                className={`${buttonSecondaryClass} xs:col-span-1 col-span-3`}
              >
                {t("Modal/Abort")}
              </button>
            </ModalBase.Footer>
          </ModalBase>
        </form>
      )}
    </>
  );
};

export default MasterPlanFieldModal;
