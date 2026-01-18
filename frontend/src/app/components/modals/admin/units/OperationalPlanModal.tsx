"use client";

import { FormEvent, useEffect, useRef, useState } from "react";
import {
  PencilIcon,
  PencilSquareIcon,
  PlusIcon,
} from "@heroicons/react/24/outline";
import Input from "../../../common/Input";
import { useToast } from "../../../toast/ToastProvider";
import {
  buttonDeletePrimaryClass,
  buttonPrimaryClass,
  buttonSecondaryClass,
  iconButtonPrimaryClass,
  roundedButtonClass,
  switchClass,
  switchKnobClass,
} from "@/app/styles/buttonClasses";
import {
  getMasterPlanFieldDataTypeOptions,
  MasterPlanFieldDataType,
} from "@/app/types/manageTypes";
import ModalBase, { ModalBaseHandle } from "../../ModalBase";
import { useTranslations } from "next-intl";
import { masterPlanConstraints } from "@/app/helpers/inputConstraints";
import { EllipsisVerticalIcon, XMarkIcon } from "@heroicons/react/20/solid";
import DragDrop from "@/app/components/common/DragDrop";
import SingleDropdown from "@/app/components/common/SingleDropdown";
import MenuDropdown from "@/app/components/common/MenuDropdown/MenuDropdown";
import MultiDropdown from "@/app/components/common/MultiDropdown";
import LoadingSpinner from "@/app/components/common/LoadingSpinner";

type Props = {
  isOpen: boolean;
  onClose: () => void;
  itemId?: number | null;
  onItemUpdated: () => void;
};

type MasterPlanOptions = {
  id: number;
  name: string;
};

const OperationalPlanModal = (props: Props) => {
  const t = useTranslations();

  // --- VARIABLES ---
  // --- Refs ---
  const formRef = useRef<HTMLFormElement>(null);
  const modalRef = useRef<ModalBaseHandle>(null);
  const getScrollEl = () => modalRef.current?.getScrollEl() ?? null;

  // --- States ---
  const [isSaving, setIsSaving] = useState(false);
  const [name, setName] = useState("");
  const [masterPlan, setMasterPlan] = useState("");
  const [masterPlans, setMasterPlans] = useState<MasterPlanOptions[]>([]);
  const [isHidden, setIsHidden] = useState(false);

  const [originalName, setOriginalName] = useState("");
  const [originalMasterPlan, setOriginalMasterPlan] = useState("");
  const [originalIsHidden, setOriginalIsHidden] = useState(false);

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

    fetchMasterPlans();

    if (props.isOpen && props.itemId !== null && props.itemId !== undefined) {
      fetchOperationalPlan();
    } else {
      setName("");
      setOriginalName("");

      setMasterPlan("");
      setOriginalMasterPlan("");

      setIsHidden(false);
      setOriginalIsHidden(false);
    }
  }, [props.isOpen, props.itemId]);

  // --- BACKEND ---
  // --- Create operational plan ---
  const createOperationalPlan = async (event: FormEvent) => {
    event.preventDefault();
    setIsSaving(true);

    try {
      const response = await fetch(`${apiUrl}/operational-plan/create`, {
        method: "POST",
        headers: {
          "X-User-Language": localStorage.getItem("language") || "sv",
          "Content-Type": "application/json",
          Authorization: `Bearer ${token}`,
        },
        body: JSON.stringify({
          name,
          masterPlanId: parseInt(masterPlan),
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
      window.dispatchEvent(new Event("operational-plan-list-updated"));
      notify(
        "success",
        t("Common/Operational plan") + t("Modal/created1"),
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

      const result = await response.json();

      if (!response.ok) {
        notify("error", result?.message ?? t("Modal/Unknown error"));
      } else {
        setMasterPlans(result.items);
      }
    } catch (err) {
      notify("error", t("Modal/Unknown error"));
    }
  };

  // --- Fetch operational plan---
  const fetchOperationalPlan = async () => {
    try {
      const response = await fetch(
        `${apiUrl}/operational-plan/fetch/${props.itemId}`,
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
        fillOperationalPlanData(result);
      }
    } catch (err) {
      notify("error", t("Modal/Unknown error"));
    }
  };

  const fillOperationalPlanData = (result: any) => {
    setName(result.name ?? "");
    setOriginalName(result.name ?? "");

    setMasterPlan(String(result.masterPlanId ?? ""));
    setOriginalMasterPlan(String(result.masterPlanId ?? ""));

    setIsHidden(result.isHidden ?? false);
    setOriginalIsHidden(result.isHidden ?? false);
  };

  // --- Update operational plan ---
  const updateOperationalPlan = async (event: FormEvent) => {
    event.preventDefault();
    setIsSaving(true);

    try {
      const response = await fetch(
        `${apiUrl}/operational-plan/update/${props.itemId}`,
        {
          method: "PUT",
          headers: {
            "X-User-Language": localStorage.getItem("language") || "sv",
            "Content-Type": "application/json",
            Authorization: `Bearer ${token}`,
          },
          body: JSON.stringify({
            name,
            masterPlanId: parseInt(masterPlan),
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
      window.dispatchEvent(new Event("operational-plan-list-updated"));
      notify(
        "success",
        t("Common/Operational plan") + t("Modal/updated1"),
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

  // --- COMPONENTS ---
  // --- DragChip ---
  const DragChip = ({
    label,
    onDelete,
    isDragging = false,
    dragging = false,
  }: {
    label: string;
    onDelete: () => void;
    isDragging?: boolean;
    dragging?: boolean;
  }) => {
    const disableHover = dragging && !isDragging;

    return (
      <>
        <button
          disabled={isDragging}
          className={`${roundedButtonClass} group w-auto gap-2 bg-(--bg-modal-link)! px-4`}
          onClick={onDelete}
        >
          <span
            className={`${disableHover ? "" : !isDragging && "group-hover:text-(--accent-color)"} truncate font-semibold transition-colors duration-(--fast)`}
          >
            {label}
          </span>
          <XMarkIcon
            className={`${disableHover ? "" : !isDragging && "group-hover:text-(--accent-color)"} h-6 w-6 transition-[color,rotate] duration-(--fast)`}
          />
        </button>
      </>
    );
  };

  // --- SET/UNSET IS DIRTY ---
  const areArraysEqual = function <T>(a: T[], b: T[]): boolean {
    if (a.length !== b.length) {
      return false;
    }

    const sortedA = [...a].sort();
    const sortedB = [...b].sort();
    return sortedA.every((val, index) => val === sortedB[index]);
  };

  useEffect(() => {
    if (props.itemId === null || props.itemId === undefined) {
      const dirty = name !== "" || masterPlan !== "" || isHidden !== false;

      setIsDirty(dirty);
      return;
    }

    const dirty =
      name !== originalName ||
      masterPlan !== originalMasterPlan ||
      isHidden !== originalIsHidden;

    setIsDirty(dirty);
  }, [
    props.itemId,
    name,
    masterPlan,
    isHidden,
    originalName,
    originalMasterPlan,
    originalIsHidden,
  ]);

  return (
    <>
      {props.isOpen && (
        <form
          ref={formRef}
          onSubmit={(e) =>
            props.itemId ? updateOperationalPlan(e) : createOperationalPlan(e)
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
                ? t("Common/Edit") + " " + t("Common/operational plan")
                : t("Common/Add") + " " + t("Common/operational plan")
            }
            confirmOnClose
            isDirty={isDirty}
          >
            <ModalBase.Content>
              <div className="flex items-center gap-2">
                <hr className="w-12 text-(--border-tertiary)" />
                <h3 className="text-sm whitespace-nowrap text-(--text-secondary)">
                  {t("OperationalPlanModal/Info1")}
                </h3>
                <hr className="w-full text-(--border-tertiary)" />
              </div>

              <div className="xs:grid-cols-2 mb-8 grid grid-cols-1 gap-6">
                <Input
                  label={t("Common/Name")}
                  value={name}
                  onChange={(val) => setName(String(val))}
                  onModal
                  required
                  {...masterPlanConstraints.name}
                />

                <SingleDropdown
                  id="masterPlan"
                  label={t("Common/Master plan")}
                  value={masterPlan}
                  onChange={(val) => {
                    setMasterPlan(String(val));
                  }}
                  onModal
                  options={masterPlans.map((mp) => ({
                    label: mp.name,
                    value: String(mp.id),
                  }))}
                />
              </div>

              <div className="flex items-center gap-2">
                <hr className="w-12 text-(--border-tertiary)" />
                <h3 className="text-sm whitespace-nowrap text-(--text-secondary)">
                  {t("OperationalPlanModal/Info2")}
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
                    {t("OperationalPlanModal/Hide operational plan")}
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

export default OperationalPlanModal;
