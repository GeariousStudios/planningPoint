"use client";

import { FormEvent, useEffect, useRef, useState } from "react";
import * as Outline from "@heroicons/react/24/outline";
import * as Solid from "@heroicons/react/24/solid";
import Input from "../../../common/Input";
import { useToast } from "../../../toast/ToastProvider";
import {
  buttonPrimaryClass,
  buttonSecondaryClass,
  roundedButtonClass,
  switchClass,
  switchKnobClass,
} from "@/app/styles/buttonClasses";
import ModalBase, { ModalBaseHandle } from "../../ModalBase";
import useTN from "@/app/hooks/useTN";
import { plannedStopConstraints } from "@/app/helpers/inputConstraints";
import LoadingSpinner from "@/app/components/common/LoadingSpinner";
import CustomTooltip from "@/app/components/common/CustomTooltip";
import HoverIcon from "@/app/components/common/HoverIcon";
import XMarkIcon from "@heroicons/react/20/solid/XMarkIcon";
import MultiDropdown from "@/app/components/common/MultiDropdown";

type Props = {
  isOpen: boolean;
  onClose: () => void;
  itemId?: number | null;
  onItemUpdated: () => void;
};

type MasterPlanOption = {
  id: number;
  name: string;
};

const PlannedStopModal = (props: Props) => {
  const t = useTN();

  // --- VARIABLES ---
  // --- Refs ---
  const formRef = useRef<HTMLFormElement>(null);
  const modalRef = useRef<ModalBaseHandle>(null);
  const getScrollEl = () => modalRef.current?.getScrollEl() ?? null;

  // --- States ---
  const [isSaving, setIsSaving] = useState(false);
  const [name, setName] = useState("");
  const [lightColorHex, setLightColorHex] = useState("#212121");
  const [darkColorHex, setDarkColorHex] = useState("#e0e0e0");
  const [reverseColor, setReverseColor] = useState(false);
  const [masterPlanOptions, setMasterPlanOptions] = useState<
    MasterPlanOption[]
  >([]);
  const [masterPlanIds, setMasterPlanIds] = useState<number[]>([]);
  const [isHidden, setIsHidden] = useState(false);

  const [originalName, setOriginalName] = useState("");
  const [originalLightColorHex, setOriginalLightColorHex] = useState("#212121");
  const [originalDarkColorHex, setOriginalDarkColorHex] = useState("#e0e0e0");
  const [originalReverseColor, setOriginalReverseColor] = useState(false);
  const [originalMasterPlanIds, setOriginalMasterPlanIds] = useState<number[]>(
    [],
  );
  const [originalIsHidden, setOriginalIsHidden] = useState(false);
  const [isDirty, setIsDirty] = useState(false);

  // --- Other ---
  const token = localStorage.getItem("token");
  const { notify } = useToast();
  const apiUrl = process.env.NEXT_PUBLIC_API_URL;

  useEffect(() => {
    if (!props.isOpen) {
      return;
    }

    fetchMasterPlans();

    if (props.itemId !== null && props.itemId !== undefined) {
      fetchPlannedStop();
    } else {
      setName("");
      setOriginalName("");

      setLightColorHex("#212121");
      setOriginalLightColorHex("#212121");

      setDarkColorHex("#e0e0e0");
      setOriginalDarkColorHex("#e0e0e0");

      setReverseColor(false);
      setOriginalReverseColor(false);

      setMasterPlanIds([]);
      setOriginalMasterPlanIds([]);

      setIsHidden(false);
      setOriginalIsHidden(false);
    }
  }, [props.isOpen, props.itemId]);

  // --- BACKEND ---
  // --- Create planned stop ---
  const createPlannedStop = async (event: FormEvent) => {
    event.preventDefault();
    setIsSaving(true);

    try {
      const response = await fetch(`${apiUrl}/planned-stop/create`, {
        method: "POST",
        headers: {
          "X-User-Language": localStorage.getItem("language") || "sv",
          "Content-Type": "application/json",
          Authorization: `Bearer ${token}`,
        },
        body: JSON.stringify({
          name,
          lightColorHex,
          darkColorHex,
          reverseColor,
          masterPlanIds,
          isHidden,
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

      props.onClose();
      props.onItemUpdated();
      notify(
        "success",
        t("entities.plannedStop", { capitalize: true }) + t("Modal/created1"),
        4000,
      );
    } catch (err) {
      notify("error", t("Modal/Unknown error"));
    } finally {
      setIsSaving(false);
    }
  };

  // --- Fetch master plans ---
  const fetchMasterPlans = async () => {
    try {
      const response = await fetch(`${apiUrl}/master-plan`, {
        headers: {
          "X-User-Language": localStorage.getItem("language") || "sv",
          "Content-Type": "application/json",
          Authorization: `Bearer ${token}`,
        },
      });

      if (response.status === 401) {
        localStorage.removeItem("token");
        notify("error", t("Modal/Unknown error"));
        return;
      }

      const result = await response.json();

      const items =
        result?.items ?? result?.data?.items ?? result?.data ?? result ?? [];
      setMasterPlanOptions(Array.isArray(items) ? items : []);
    } catch {
      notify("error", t("Modal/Unknown error"));
    }
  };

  // --- Fetch planned stop ---
  const fetchPlannedStop = async () => {
    try {
      const response = await fetch(
        `${apiUrl}/planned-stop/fetch/${props.itemId}`,
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
        fillPlannedStopData(result);
      }
    } catch (err) {
      notify("error", t("Modal/Unknown error"));
    }
  };

  const fillPlannedStopData = (result: any) => {
    setName(result.name ?? "");
    setOriginalName(result.name ?? "");

    setLightColorHex(result.lightColorHex ?? "#212121");
    setOriginalLightColorHex(result.lightColorHex ?? "#212121");

    setDarkColorHex(result.darkColorHex ?? "#e0e0e0");
    setOriginalDarkColorHex(result.darkColorHex ?? "#e0e0e0");

    setReverseColor(result.reverseColor ?? false);
    setOriginalReverseColor(result.reverseColor ?? false);

    const ids = Array.isArray(result.masterPlans)
      ? result.masterPlans.map((mp: { id: number }) => mp.id)
      : [];

    setMasterPlanIds(ids);
    setOriginalMasterPlanIds(ids);

    setIsHidden(result.isHidden ?? false);
    setOriginalIsHidden(result.isHidden ?? false);
  };

  // --- Update planned stop ---
  const updatePlannedStop = async (event: FormEvent) => {
    event.preventDefault();
    setIsSaving(true);

    try {
      const response = await fetch(
        `${apiUrl}/planned-stop/update/${props.itemId}`,
        {
          method: "PUT",
          headers: {
            "X-User-Language": localStorage.getItem("language") || "sv",
            "Content-Type": "application/json",
            Authorization: `Bearer ${token}`,
          },
          body: JSON.stringify({
            name,
            lightColorHex,
            darkColorHex,
            reverseColor,
            masterPlanIds,
            isHidden,
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

      props.onClose();
      props.onItemUpdated();
      notify(
        "success",
        t("entities.plannedStop", { capitalize: true }) + t("Modal/updated1"),
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

  const deleteMasterPlan = (id: number) => {
    setMasterPlanIds((prev) => prev.filter((x) => x !== id));
  };

  // --- COMPONENTS ---
  // --- MasterPlanChip ---
  const MasterPlanChip = ({
    id,
    label,
    onDelete,
  }: {
    id: number;
    label: string;
    onDelete: () => void;
  }) => {
    return (
      <div
        className={`${roundedButtonClass} flex w-auto !cursor-default items-center gap-2 !bg-(--bg-modal-link) px-4 transition-transform duration-(--fast)`}
      >
        <span className="truncate font-semibold select-none">{label}</span>

        <button
          type="button"
          onClick={(e) => {
            e.stopPropagation();
            onDelete();
          }}
          className="text-(--text-secondary) transition-colors duration-(--fast) hover:text-(--accent-color)"
          style={{ cursor: "pointer" }}
        >
          <XMarkIcon className="h-6 w-6" />
        </button>
      </div>
    );
  };

  // --- SET/UNSET IS DIRTY ---
  useEffect(() => {
    if (props.itemId === null || props.itemId === undefined) {
      const dirty =
        name !== "" ||
        lightColorHex !== "#212121" ||
        darkColorHex !== "#e0e0e0" ||
        reverseColor !== false ||
        JSON.stringify(masterPlanIds) !==
          JSON.stringify(originalMasterPlanIds) ||
        isHidden !== false;

      setIsDirty(dirty);
      return;
    }

    const dirty =
      name !== originalName ||
      lightColorHex !== originalLightColorHex ||
      darkColorHex !== originalDarkColorHex ||
      reverseColor !== originalReverseColor ||
      JSON.stringify(masterPlanIds) !== JSON.stringify(originalMasterPlanIds) ||
      isHidden !== originalIsHidden;

    setIsDirty(dirty);
  }, [
    props.itemId,
    name,
    lightColorHex,
    darkColorHex,
    reverseColor,
    masterPlanIds,
    isHidden,
    originalName,
    originalLightColorHex,
    originalDarkColorHex,
    originalReverseColor,
    originalMasterPlanIds,
    originalIsHidden,
  ]);

  return (
    <>
      {props.isOpen && (
        <form
          ref={formRef}
          onSubmit={(e) =>
            props.itemId ? updatePlannedStop(e) : createPlannedStop(e)
          }
        >
          <ModalBase
            ref={modalRef}
            isOpen={props.isOpen}
            onClose={() => props.onClose()}
            icon={props.itemId ? Outline.PencilSquareIcon : Outline.PlusIcon}
            label={
              props.itemId
                ? t("actions.edit", { capitalize: true }) +
                  " " +
                  t("entities.plannedStop")
                : t("actions.add", { capitalize: true }) +
                  " " +
                  t("entities.plannedStop")
            }
            confirmOnClose
            isDirty={isDirty}
          >
            <ModalBase.Content>
              <div className="flex items-center gap-2">
                <hr className="w-12 text-(--border-tertiary)" />
                <h3 className="text-sm whitespace-nowrap text-(--text-secondary)">
                  {t("PlannedStopModal/Info1")}
                </h3>
                <hr className="w-full text-(--border-tertiary)" />
              </div>

              <div className="xs:grid-cols-2 mb-8 grid grid-cols-1 gap-6">
                <div className="xs:col-span-2">
                  <Input
                    label={t("common.name", { capitalize: true })}
                    value={name}
                    onChange={(val) => {
                      setName(String(val));
                    }}
                    onModal
                    required
                    {...plannedStopConstraints.name}
                  />
                </div>

                <Input
                  label={t("appearance.lightColour", { capitalize: true })}
                  type="color"
                  value={lightColorHex}
                  onChange={(val) => setLightColorHex(String(val))}
                  pattern="^#([0-9A-Fa-f]{6})$"
                  onModal
                />

                <Input
                  label={t("appearance.darkColour", { capitalize: true })}
                  type="color"
                  value={darkColorHex}
                  onChange={(val) => setDarkColorHex(String(val))}
                  pattern="^#([0-9A-Fa-f]{6})$"
                  onModal
                />

                <div className="flex items-center gap-2 truncate">
                  <button
                    type="button"
                    role="switch"
                    aria-checked={reverseColor}
                    className={switchClass(reverseColor)}
                    onClick={() => setReverseColor((prev) => !prev)}
                  >
                    <div className={switchKnobClass(reverseColor)} />
                  </button>
                  {t("Modal/Reverse color")}
                  <CustomTooltip
                    content={t("Modal/Tooltip reverse color")}
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

              <div className="flex items-center gap-2">
                <hr className="w-12 text-(--border-tertiary)" />
                <h3 className="text-sm whitespace-nowrap text-(--text-secondary)">
                  {t("PlannedStopModal/Info2")}
                </h3>
                <hr className="w-full text-(--border-tertiary)" />
              </div>

              <MultiDropdown
                scrollContainer={getScrollEl}
                label={t("entities.masterPlan", {
                  capitalize: true,
                  plural: true,
                })}
                options={masterPlanOptions.map((mp) => ({
                  value: String(mp.id),
                  label: mp.name,
                }))}
                value={masterPlanIds.map(String)}
                onChange={(val: string[]) => setMasterPlanIds(val.map(Number))}
                onModal
              />

              {masterPlanIds.length > 0 && (
                <div className="flex flex-wrap gap-2">
                  {masterPlanIds
                    .sort((a, b) => a - b)
                    .map((id) => {
                      const label =
                        masterPlanOptions.find((mp) => mp.id === id)?.name ??
                        `#${id}`;

                      return (
                        <MasterPlanChip
                          key={id}
                          id={id}
                          label={label}
                          onDelete={() => deleteMasterPlan(id)}
                        />
                      );
                    })}
                </div>
              )}

              <div className="mt-8 flex items-center gap-2">
                <hr className="w-12 text-(--border-tertiary)" />
                <h3 className="text-sm whitespace-nowrap text-(--text-secondary)">
                  {t("status.status", { capitalize: true })}
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
                    {t("PlannedStopModal/Hide planned stop")}
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
                      <LoadingSpinner />{" "}
                      {t("common.adding", { capitalize: true, end: "..." })}
                    </div>
                  )
                ) : props.itemId ? (
                  t("Modal/Save")
                ) : (
                  t("actions.add", { capitalize: true })
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

export default PlannedStopModal;
