"use client";

import { FormEvent, useEffect, useRef, useState } from "react";
import * as Outline from "@heroicons/react/24/outline";
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
import { useTranslations } from "next-intl";
import { productConstraints } from "@/app/helpers/inputConstraints";
import LoadingSpinner from "@/app/components/common/LoadingSpinner";
import { XMarkIcon } from "@heroicons/react/20/solid";
import MultiDropdown from "@/app/components/common/MultiDropdown";
import React from "react";

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

type MasterPlanField = {
  id: number;
  name: string;
  dataType: string;
  masterPlanIds: number[];
};

type ProductFieldValue = {
  masterPlanFieldId: number;
  value: string;
};

const ProductModal = (props: Props) => {
  const t = useTranslations();

  // --- VARIABLES ---
  // --- Refs ---
  const formRef = useRef<HTMLFormElement>(null);
  const modalRef = useRef<ModalBaseHandle>(null);
  const getScrollEl = () => modalRef.current?.getScrollEl() ?? null;

  // --- States ---
  const [isSaving, setIsSaving] = useState(false);
  const [name, setName] = useState("");
  const [masterPlanOptions, setMasterPlanOptions] = useState<
    MasterPlanOption[]
  >([]);
  const [masterPlanIds, setMasterPlanIds] = useState<number[]>([]);
  const [selectedFieldIds, setSelectedFieldIds] = useState<number[]>([]);
  const [fieldValueById, setFieldValueById] = useState<Record<number, string>>(
    {},
  );
  const [allFields, setAllFields] = useState<MasterPlanField[]>([]);
  const [missingByMasterPlan, setMissingByMasterPlan] = useState<
    Record<number, number[]>
  >({});
  const [isHidden, setIsHidden] = useState(false);

  const [originalName, setOriginalName] = useState("");
  const [originalMasterPlanIds, setOriginalMasterPlanIds] = useState<number[]>(
    [],
  );
  const [originalSelectedFieldIds, setOriginalSelectedFieldIds] = useState<
    number[]
  >([]);
  const [originalFieldValueById, setOriginalFieldValueById] = useState<
    Record<number, string>
  >({});
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
    fetchMasterPlanFields();

    if (props.itemId !== null && props.itemId !== undefined) {
      fetchProduct();
    } else {
      setName("");
      setOriginalName("");

      setMasterPlanIds([]);
      setOriginalMasterPlanIds([]);

      setSelectedFieldIds([]);
      setOriginalSelectedFieldIds([]);

      setFieldValueById({});
      setOriginalFieldValueById({});

      setIsHidden(false);
      setOriginalIsHidden(false);
    }
  }, [props.isOpen, props.itemId]);

  // --- BACKEND ---
  // --- Create product ---
  const createProduct = async (event: FormEvent) => {
    event.preventDefault();
    setIsSaving(true);

    try {
      const response = await fetch(`${apiUrl}/product/create`, {
        method: "POST",
        headers: {
          "X-User-Language": localStorage.getItem("language") || "sv",
          "Content-Type": "application/json",
          Authorization: `Bearer ${token}`,
        },
        body: JSON.stringify({
          name,
          masterPlanIds,
          productFieldValues: buildProductFieldValues(
            selectedFieldIds,
            fieldValueById,
          ),
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
      notify("success", t("Common/Product") + t("Modal/created1"), 4000);
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

  const fetchMasterPlanFields = async () => {
    try {
      const response = await fetch(`${apiUrl}/master-plan-field`, {
        headers: {
          "X-User-Language": localStorage.getItem("language") || "sv",
          "Content-Type": "application/json",
          Authorization: `Bearer ${token}`,
        },
      });

      if (response.status === 401) {
        localStorage.removeItem("token");
        return;
      }

      const result = await response.json();
      const items =
        result?.items ?? result?.data?.items ?? result?.data ?? result ?? [];

      const fields: MasterPlanField[] = Array.isArray(items)
        ? items.map((x: any) => ({
            id: Number(x.id),
            name: String(x.name ?? ""),
            dataType: String(x.dataType ?? ""),
            masterPlanIds: Array.isArray(x.masterPlanIds)
              ? x.masterPlanIds.map(Number)
              : [],
          }))
        : [];

      fields.sort((a, b) => a.name.localeCompare(b.name));
      setAllFields(fields);
    } catch {
      notify("error", t("Modal/Unknown error"));
    }
  };

  // --- Fetch product ---
  const fetchProduct = async () => {
    try {
      const response = await fetch(`${apiUrl}/product/fetch/${props.itemId}`, {
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
        fillProductData(result);
      }
    } catch (err) {
      notify("error", t("Modal/Unknown error"));
    }
  };

  const fillProductData = (result: any) => {
    setName(result.name ?? "");
    setOriginalName(result.name ?? "");

    const ids = Array.isArray(result.masterPlans)
      ? result.masterPlans.map((mp: { id: number }) => mp.id)
      : [];

    setMasterPlanIds(ids);
    setOriginalMasterPlanIds(ids);

    const values: ProductFieldValue[] = Array.isArray(result.masterPlanFields)
      ? result.masterPlanFields.map((f: any) => ({
          masterPlanFieldId: Number(f.id),
          value: f.value ?? "",
        }))
      : [];

    const fieldIds = values.map((x) => x.masterPlanFieldId);

    const map: Record<number, string> = {};
    for (const v of values) {
      map[v.masterPlanFieldId] = v.value ?? "";
    }

    setSelectedFieldIds(fieldIds);
    setFieldValueById(map);

    setOriginalSelectedFieldIds(fieldIds);
    setOriginalFieldValueById(map);

    setIsHidden(result.isHidden ?? false);
    setOriginalIsHidden(result.isHidden ?? false);
  };

  // --- Update product ---
  const updateProduct = async (event: FormEvent) => {
    event.preventDefault();
    setIsSaving(true);

    try {
      const response = await fetch(`${apiUrl}/product/update/${props.itemId}`, {
        method: "PUT",
        headers: {
          "X-User-Language": localStorage.getItem("language") || "sv",
          "Content-Type": "application/json",
          Authorization: `Bearer ${token}`,
        },
        body: JSON.stringify({
          name,
          masterPlanIds,
          productFieldValues: buildProductFieldValues(
            selectedFieldIds,
            fieldValueById,
          ),
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
      notify("success", t("Common/Product") + t("Modal/updated1"), 4000);
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

  const getInputType = (dataType: string) => {
    const dt = String(dataType).toLowerCase();
    if (dt === "date") return "date";
    if (dt === "number") return "number";
    if (dt === "boolean") return "checkbox";
    return "text";
  };

  const getFieldValue = (fieldId: number) => {
    return fieldValueById[fieldId] ?? "";
  };

  const updateFieldValue = (fieldId: number, value: string) => {
    setFieldValueById((prev) => ({
      ...prev,
      [fieldId]: value,
    }));
  };

  const computeMissing = (mpIds: number[], fieldIds: number[]) => {
    const missing: Record<number, number[]> = {};
    for (const mpId of mpIds) {
      for (const fieldId of fieldIds) {
        const f = allFields.find((x) => x.id === fieldId);
        const hasField = f ? f.masterPlanIds.includes(mpId) : false;
        if (!hasField) {
          if (!missing[mpId]) missing[mpId] = [];
          missing[mpId].push(fieldId);
        }
      }
    }
    return missing;
  };

  const buildProductFieldValues = (
    ids: number[],
    map: Record<number, string>,
  ) => {
    return ids
      .slice()
      .sort((a, b) => a - b)
      .map((id) => ({
        masterPlanFieldId: id,
        value: map[id] ?? "",
      }));
  };

  useEffect(() => {
    if (!props.isOpen) return;

    if (masterPlanIds.length === 0) {
      setMissingByMasterPlan({});
      return;
    }

    const missing = computeMissing(masterPlanIds, selectedFieldIds);

    setMissingByMasterPlan(missing);
  }, [props.isOpen, masterPlanIds, allFields, selectedFieldIds]);

  const validationError = (() => {
    if (masterPlanIds.length === 0) return null;

    const missingEntries = Object.entries(missingByMasterPlan).filter(
      ([, ids]) => ids.length > 0,
    );

    if (missingEntries.length === 0) return null;

    const mpName = (id: number) =>
      masterPlanOptions.find((x) => x.id === id)?.name ?? `#${id}`;

    const fieldName = (id: number) =>
      allFields.find((x) => x.id === id)?.name ?? `#${id}`;

    const parts = missingEntries
      .sort((a, b) => Number(a[0]) - Number(b[0]))
      .map(([mpIdStr, fieldIds]) => {
        const mpId = Number(mpIdStr);
        const names = fieldIds
          .slice()
          .sort((a, b) => a - b)
          .map(fieldName)
          .join(", ");

        return { mpId, names };
      });

    return (
      <>
        {parts.map((p) => (
          <p className="text-(--note-error)" key={p.mpId}>
            {t("Common/Master plan")} <b>{mpName(p.mpId)}</b>{" "}
            {t("ProductModal/needs to be assigned")}{" "}
            <span className="text-(--text-main)">{p.names}</span>
          </p>
        ))}
      </>
    );
  })();

  const canSave = !validationError && !isSaving;

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
    const normalizeIds = (ids: number[]) => ids.slice().sort((a, b) => a - b);

    const currIds = normalizeIds(selectedFieldIds);
    const origIds = normalizeIds(originalSelectedFieldIds);

    const currValues = buildProductFieldValues(currIds, fieldValueById);
    const origValues = buildProductFieldValues(origIds, originalFieldValueById);

    const fieldsDirty =
      JSON.stringify(currIds) !== JSON.stringify(origIds) ||
      JSON.stringify(currValues) !== JSON.stringify(origValues);

    if (props.itemId === null || props.itemId === undefined) {
      const dirty =
        name !== "" ||
        JSON.stringify(masterPlanIds) !==
          JSON.stringify(originalMasterPlanIds) ||
        fieldsDirty ||
        isHidden !== false;

      setIsDirty(dirty);
      return;
    }

    const dirty =
      name !== originalName ||
      JSON.stringify(masterPlanIds) !== JSON.stringify(originalMasterPlanIds) ||
      fieldsDirty ||
      isHidden !== originalIsHidden;

    setIsDirty(dirty);
  }, [
    props.itemId,
    name,
    masterPlanIds,
    selectedFieldIds,
    fieldValueById,
    isHidden,
    originalName,
    originalMasterPlanIds,
    originalSelectedFieldIds,
    originalFieldValueById,
    originalIsHidden,
  ]);

  return (
    <>
      {props.isOpen && (
        <form
          ref={formRef}
          onSubmit={(e) => (props.itemId ? updateProduct(e) : createProduct(e))}
        >
          <ModalBase
            ref={modalRef}
            isOpen={props.isOpen}
            onClose={() => props.onClose()}
            icon={props.itemId ? Outline.PencilSquareIcon : Outline.PlusIcon}
            label={
              props.itemId
                ? t("Common/Edit") + " " + t("Common/product")
                : t("Common/Add") + " " + t("Common/product")
            }
            confirmOnClose
            isDirty={isDirty}
          >
            <ModalBase.Content>
              <div className="flex items-center gap-2">
                <hr className="w-12 text-(--border-tertiary)" />
                <h3 className="text-sm whitespace-nowrap text-(--text-secondary)">
                  {t("ProductModal/Info1")}
                </h3>
                <hr className="w-full text-(--border-tertiary)" />
              </div>

              <div className="xs:grid-cols-2 mb-8 grid grid-cols-1 gap-6">
                <div className="xs:col-span-2">
                  <Input
                    label={t("Common/Name")}
                    value={name}
                    onChange={(val) => {
                      setName(String(val));
                    }}
                    onModal
                    required
                    {...productConstraints.name}
                  />
                </div>
              </div>

              <div className="flex items-center gap-2">
                <hr className="w-12 text-(--border-tertiary)" />
                <h3 className="text-sm whitespace-nowrap text-(--text-secondary)">
                  {t("ProductModal/Info2")}
                </h3>
                <hr className="w-full text-(--border-tertiary)" />
              </div>

              <MultiDropdown
                scrollContainer={getScrollEl}
                label={t("Common/Master plans")}
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
                  {t("ProductModal/Info3")}
                </h3>
                <hr className="w-full text-(--border-tertiary)" />
              </div>

              <MultiDropdown
                scrollContainer={getScrollEl}
                label={t("Common/Master plan fields")}
                options={allFields.map((f) => ({
                  value: String(f.id),
                  label: f.name,
                }))}
                value={selectedFieldIds.map(String)}
                onChange={(val: string[]) => {
                  const ids = val.map(Number);
                  setSelectedFieldIds(ids);
                }}
                onModal
              />

              {selectedFieldIds.length > 0 && (
                <div className="flex flex-col gap-6 rounded-2xl bg-(--bg-main) p-8">
                  <h3 className="text-sm whitespace-nowrap text-(--text-secondary)">
                    {t("ProductModal/Selected fields")}
                  </h3>

                  <div className="grid grid-cols-1 gap-6">
                    {selectedFieldIds
                      .map((id) => ({
                        id,
                        f: allFields.find((x) => x.id === id),
                      }))
                      .filter(
                        (x): x is { id: number; f: MasterPlanField } => !!x.f,
                      )
                      .sort((a, b) => a.f.name.localeCompare(b.f.name))
                      .map(({ id, f }) => {
                        const dt = String(f.dataType).toLowerCase();
                        const inputType =
                          dt === "date"
                            ? "date"
                            : dt === "number"
                              ? "number"
                              : dt === "boolean"
                                ? "checkbox"
                                : "text";

                        const current = getFieldValue(id);

                        if (inputType === "checkbox") {
                          const checked = current === "true";
                          return (
                            <div
                              key={id}
                              className="flex items-center justify-between gap-6 rounded-2xl bg-(--bg-secondary) p-4"
                            >
                              <span className="truncate font-semibold">
                                {f.name}
                              </span>
                              <button
                                type="button"
                                role="switch"
                                aria-checked={checked}
                                className={switchClass(checked)}
                                onClick={() =>
                                  updateFieldValue(
                                    id,
                                    checked ? "false" : "true",
                                  )
                                }
                              >
                                <div className={switchKnobClass(checked)} />
                              </button>
                            </div>
                          );
                        }

                        return (
                          <div
                            key={id}
                            className="rounded-2xl bg-(--bg-secondary)"
                          >
                            <Input
                              label={f.name}
                              value={current}
                              onChange={(val) =>
                                updateFieldValue(id, String(val))
                              }
                              type={inputType as any}
                            />
                          </div>
                        );
                      })}
                  </div>
                </div>
              )}

              <div className="mt-8 flex items-center gap-2">
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
                    {t("ProductModal/Hide product")}
                  </span>
                </div>
              </div>
            </ModalBase.Content>

            <ModalBase.Footer>
              <button
                type="button"
                onClick={handleSaveClick}
                className={`${buttonPrimaryClass} xs:col-span-2 col-span-3`}
                disabled={!canSave}
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
              {validationError && (
                <div className="xs:col-span-3 col-span-3 text-sm">
                  {validationError}
                </div>
              )}
            </ModalBase.Footer>
          </ModalBase>
        </form>
      )}
    </>
  );
};

export default ProductModal;
