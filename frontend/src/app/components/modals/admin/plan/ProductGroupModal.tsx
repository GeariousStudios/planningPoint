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
import { productGroupConstraints } from "@/app/helpers/inputConstraints";
import LoadingSpinner from "@/app/components/common/LoadingSpinner";
import { XMarkIcon } from "@heroicons/react/20/solid";
import MultiDropdown from "@/app/components/common/MultiDropdown";
import React from "react";
import DragDrop from "@/app/components/common/DragDrop";
import Message from "@/app/components/common/Message";
import CustomTooltip from "@/app/components/common/CustomTooltip";

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

type ProductOption = {
  id: number;
  name: string;
};

type MasterPlanField = {
  id: number;
  name: string;
  dataType: string;
  masterPlanIds: number[];
};

type ProductGroupFieldValue = {
  productId: number;
  masterPlanFieldId: number;
  value: string;
};

type ProductGroupFetchResult = {
  id: number;
  name: string;
  masterPlans: { id: number; name: string }[];
  products: { id: number; name: string }[];
  isHidden: boolean;
  productGroupFieldValues?: {
    productId: number;
    masterPlanFieldId: number;
    name?: string;
    dataType?: string;
    value?: string;
  }[];
};

const ProductGroupModal = (props: Props) => {
  const t = useTranslations();

  // --- VARIABLES ---
  // --- Refs ---
  const formRef = useRef<HTMLFormElement>(null);
  const modalRef = useRef<ModalBaseHandle>(null);
  const getScrollEl = () => modalRef.current?.getScrollEl() ?? null;

  // --- States ---
  const [isAnyDragging, setIsAnyDragging] = useState(false);
  const [isSaving, setIsSaving] = useState(false);
  const [name, setName] = useState("");

  const [masterPlanOptions, setMasterPlanOptions] = useState<
    MasterPlanOption[]
  >([]);
  const [masterPlanIds, setMasterPlanIds] = useState<number[]>([]);

  const [productOptions, setProductOptions] = useState<ProductOption[]>([]);
  const [productIds, setProductIds] = useState<number[]>([]);

  const [allFields, setAllFields] = useState<MasterPlanField[]>([]);
  const [requiredFieldIdsByProduct, setRequiredFieldIdsByProduct] = useState<
    Record<number, number[]>
  >({});
  const [requiredFieldIdsUnion, setRequiredFieldIdsUnion] = useState<number[]>(
    [],
  );

  const [activeProductId, setActiveProductId] = useState<number | null>(null);

  const [fieldValueByKey, setFieldValueByKey] = useState<
    Record<string, string>
  >({});
  const [touchedKeys, setTouchedKeys] = useState<string[]>([]);

  const [missingByMasterPlan, setMissingByMasterPlan] = useState<
    Record<number, number[]>
  >({});
  const [isHidden, setIsHidden] = useState(false);

  const [originalName, setOriginalName] = useState("");
  const [originalMasterPlanIds, setOriginalMasterPlanIds] = useState<number[]>(
    [],
  );
  const [originalProductIds, setOriginalProductIds] = useState<number[]>([]);
  const [originalFieldValueByKey, setOriginalFieldValueByKey] = useState<
    Record<string, string>
  >({});
  const [originalTouchedKeys, setOriginalTouchedKeys] = useState<string[]>([]);

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
    fetchProducts();
    fetchMasterPlanFields();

    if (props.itemId !== null && props.itemId !== undefined) {
      fetchProductGroup();
    } else {
      setName("");
      setOriginalName("");

      setMasterPlanIds([]);
      setOriginalMasterPlanIds([]);

      setProductIds([]);
      setOriginalProductIds([]);

      setRequiredFieldIdsByProduct({});
      setRequiredFieldIdsUnion([]);

      setActiveProductId(null);

      setFieldValueByKey({});
      setOriginalFieldValueByKey({});

      setTouchedKeys([]);
      setOriginalTouchedKeys([]);

      setIsHidden(false);
      setOriginalIsHidden(false);
    }
  }, [props.isOpen, props.itemId]);

  // --- BACKEND ---
  // --- Create product group ---
  const createProductGroup = async (event: FormEvent) => {
    event.preventDefault();
    setIsSaving(true);

    try {
      const response = await fetch(`${apiUrl}/product-group/create`, {
        method: "POST",
        headers: {
          "X-User-Language": localStorage.getItem("language") || "sv",
          "Content-Type": "application/json",
          Authorization: `Bearer ${token}`,
        },
        body: JSON.stringify({
          name,
          masterPlanIds,
          productIds,
          productGroupFieldValues: buildProductGroupFieldValues(
            touchedKeys,
            fieldValueByKey,
            productIds,
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
      notify("success", t("Common/Product group") + t("Modal/created1"), 4000);
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

  const fetchProducts = async () => {
    try {
      const response = await fetch(`${apiUrl}/product`, {
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

      const products: ProductOption[] = Array.isArray(items)
        ? items.map((x: any) => ({
            id: Number(x.id),
            name: String(x.name ?? ""),
          }))
        : [];

      products.sort((a, b) => a.name.localeCompare(b.name));
      setProductOptions(products);
    } catch {
      notify("error", t("Modal/Unknown error"));
    }
  };

  // --- Fetch master plan fields ---
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

  // --- Fetch required fields for selected products ---
  const fetchRequiredFieldsForProducts = async (ids: number[]) => {
    try {
      if (ids.length === 0) {
        setRequiredFieldIdsByProduct({});
        setRequiredFieldIdsUnion([]);
        return;
      }

      const requests = ids.map(async (pid) => {
        const qs = `productIds=${encodeURIComponent(String(pid))}`;

        const response = await fetch(
          `${apiUrl}/product/required-fields?${qs}`,
          {
            headers: {
              "X-User-Language": localStorage.getItem("language") || "sv",
              "Content-Type": "application/json",
              Authorization: `Bearer ${token}`,
            },
          },
        );

        if (response.status === 401) {
          localStorage.removeItem("token");
          return { pid, fieldIds: [] as number[] };
        }

        if (!response.ok) {
          return { pid, fieldIds: [] as number[] };
        }

        const result = await response.json();

        const fieldIds = Array.isArray(result?.fieldIds)
          ? result.fieldIds.map(Number).filter((x: any) => !Number.isNaN(x))
          : [];

        fieldIds.sort((a: number, b: number) => a - b);

        return { pid, fieldIds };
      });

      const rows = await Promise.all(requests);

      const byProduct: Record<number, number[]> = {};
      for (const r of rows) {
        byProduct[r.pid] = r.fieldIds;
      }

      const union = Array.from(new Set(rows.flatMap((r) => r.fieldIds))).sort(
        (a, b) => a - b,
      );

      setRequiredFieldIdsByProduct(byProduct);
      setRequiredFieldIdsUnion(union);
    } catch {
      notify("error", t("Modal/Unknown error"));
    }
  };

  useEffect(() => {
    if (!props.isOpen) {
      return;
    }

    fetchRequiredFieldsForProducts(productIds);

    if (productIds.length === 0) {
      setActiveProductId(null);
      return;
    }

    setActiveProductId((prev) => {
      if (prev && productIds.includes(prev)) return prev;
      return productIds[0];
    });
  }, [props.isOpen, productIds]);

  // --- Fetch product group ---
  const fetchProductGroup = async () => {
    try {
      const response = await fetch(
        `${apiUrl}/product-group/fetch/${props.itemId}`,
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
        fillProductGroupData(result as ProductGroupFetchResult);
      }
    } catch (err) {
      notify("error", t("Modal/Unknown error"));
    }
  };

  const fillProductGroupData = (result: ProductGroupFetchResult) => {
    setName(result.name ?? "");
    setOriginalName(result.name ?? "");

    const mpIds = Array.isArray(result.masterPlans)
      ? result.masterPlans.map((mp) => mp.id)
      : [];

    setMasterPlanIds(mpIds);
    setOriginalMasterPlanIds(mpIds);

    const pIds = Array.isArray(result.products)
      ? result.products.map((p) => p.id)
      : [];

    setProductIds(pIds);
    setOriginalProductIds(pIds);

    const values = Array.isArray(result.productGroupFieldValues)
      ? result.productGroupFieldValues.map((x) => ({
          productId: Number(x.productId),
          masterPlanFieldId: Number(x.masterPlanFieldId),
          value: String(x.value ?? ""),
        }))
      : [];

    const map: Record<string, string> = {};
    const touched: string[] = [];

    for (const v of values) {
      const key = makeKey(v.productId, v.masterPlanFieldId);
      map[key] = v.value ?? "";
      touched.push(key);
    }

    const uniqTouched = Array.from(new Set(touched)).sort();

    setFieldValueByKey(map);
    setOriginalFieldValueByKey(map);

    setTouchedKeys(uniqTouched);
    setOriginalTouchedKeys(uniqTouched);

    setIsHidden(result.isHidden ?? false);
    setOriginalIsHidden(result.isHidden ?? false);

    setActiveProductId((prev) => {
      if (prev && pIds.includes(prev)) return prev;
      return pIds.length > 0 ? pIds[0] : null;
    });
  };

  // --- Update product group ---
  const updateProductGroup = async (event: FormEvent) => {
    event.preventDefault();
    setIsSaving(true);

    try {
      const response = await fetch(
        `${apiUrl}/product-group/update/${props.itemId}`,
        {
          method: "PUT",
          headers: {
            "X-User-Language": localStorage.getItem("language") || "sv",
            "Content-Type": "application/json",
            Authorization: `Bearer ${token}`,
          },
          body: JSON.stringify({
            name,
            masterPlanIds,
            productIds,
            productGroupFieldValues: buildProductGroupFieldValues(
              touchedKeys,
              fieldValueByKey,
              productIds,
            ),
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
      notify("success", t("Common/Product group") + t("Modal/updated1"), 4000);
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

  const deleteProduct = (id: number) => {
    setProductIds((prev) => prev.filter((x) => x !== id));
  };

  const makeKey = (productId: number, fieldId: number) =>
    `${productId}:${fieldId}`;

  const getFieldValue = (productId: number, fieldId: number) => {
    return fieldValueByKey[makeKey(productId, fieldId)] ?? "";
  };

  const updateFieldValue = (
    productId: number,
    fieldId: number,
    value: string,
  ) => {
    const key = makeKey(productId, fieldId);

    setFieldValueByKey((prev) => ({
      ...prev,
      [key]: value,
    }));

    setTouchedKeys((prev) => (prev.includes(key) ? prev : [...prev, key]));
  };

  const clearFieldOverride = (productId: number, fieldId: number) => {
    const key = makeKey(productId, fieldId);

    setFieldValueByKey((prev) => ({
      ...prev,
      [key]: "",
    }));

    setTouchedKeys((prev) => prev.filter((x) => x !== key));
  };

  const buildProductGroupFieldValues = (
    keys: string[],
    map: Record<string, string>,
    allowedProductIds: number[],
  ): ProductGroupFieldValue[] => {
    const allowed = new Set(allowedProductIds);

    return keys
      .slice()
      .sort()
      .filter((key) => {
        const [p] = key.split(":");
        return allowed.has(Number(p));
      })
      .map((key) => {
        const [p, f] = key.split(":");
        const productId = Number(p);
        const masterPlanFieldId = Number(f);

        return {
          productId,
          masterPlanFieldId,
          value: map[key] ?? "",
        };
      });
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

  useEffect(() => {
    if (!props.isOpen) return;

    if (masterPlanIds.length === 0) {
      setMissingByMasterPlan({});
      return;
    }

    const missing = computeMissing(masterPlanIds, requiredFieldIdsUnion);

    setMissingByMasterPlan(missing);
  }, [props.isOpen, masterPlanIds, allFields, requiredFieldIdsUnion]);

  const activeFieldIds =
    activeProductId !== null
      ? (requiredFieldIdsByProduct[activeProductId] ?? [])
      : [];

  const missingByMasterPlanForActiveProduct = (() => {
    if (masterPlanIds.length === 0) return {};
    if (activeFieldIds.length === 0) return {};
    return computeMissing(masterPlanIds, activeFieldIds);
  })();

  const hasMissingFieldsForActiveProduct = (() => {
    if (masterPlanIds.length === 0) return false;
    if (productIds.length === 0) return false;
    if (activeProductId === null) return false;

    if (activeFieldIds.length === 0) return true;

    const missingEntries = Object.entries(
      missingByMasterPlanForActiveProduct,
    ).filter(([, ids]) => Array.isArray(ids) && ids.length > 0);

    return missingEntries.length > 0;
  })();

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
            {t("ProductGroupModal/needs to be assigned")}{" "}
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

  // --- ProductChip ---
  const ProductChip = ({
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
  useEffect(() => {
    const normalizeIds = (ids: number[]) => ids.slice().sort((a, b) => a - b);
    const normalizeKeys = (keys: string[]) => keys.slice().sort();

    const currMp = normalizeIds(masterPlanIds);
    const origMp = normalizeIds(originalMasterPlanIds);

    const currP = normalizeIds(productIds);
    const origP = normalizeIds(originalProductIds);

    const currTouched = normalizeKeys(touchedKeys);
    const origTouched = normalizeKeys(originalTouchedKeys);

    const currValues = buildProductGroupFieldValues(
      currTouched,
      fieldValueByKey,
      productIds,
    );
    const origValues = buildProductGroupFieldValues(
      origTouched,
      originalFieldValueByKey,
      originalProductIds,
    );

    const fieldsDirty =
      JSON.stringify(currTouched) !== JSON.stringify(origTouched) ||
      JSON.stringify(currValues) !== JSON.stringify(origValues);

    if (props.itemId === null || props.itemId === undefined) {
      const dirty =
        name !== "" ||
        JSON.stringify(currMp) !== JSON.stringify(origMp) ||
        JSON.stringify(currP) !== JSON.stringify(origP) ||
        fieldsDirty ||
        isHidden !== false;

      setIsDirty(dirty);
      return;
    }

    const dirty =
      name !== originalName ||
      JSON.stringify(currMp) !== JSON.stringify(origMp) ||
      JSON.stringify(currP) !== JSON.stringify(origP) ||
      fieldsDirty ||
      isHidden !== originalIsHidden;

    setIsDirty(dirty);
  }, [
    props.itemId,
    name,
    masterPlanIds,
    productIds,
    touchedKeys,
    fieldValueByKey,
    isHidden,
    originalName,
    originalMasterPlanIds,
    originalProductIds,
    originalTouchedKeys,
    originalFieldValueByKey,
    originalIsHidden,
  ]);

  return (
    <>
      {props.isOpen && (
        <form
          ref={formRef}
          onSubmit={(e) =>
            props.itemId ? updateProductGroup(e) : createProductGroup(e)
          }
        >
          <ModalBase
            ref={modalRef}
            isOpen={props.isOpen}
            onClose={() => props.onClose()}
            icon={props.itemId ? Outline.PencilSquareIcon : Outline.PlusIcon}
            label={
              props.itemId
                ? t("Common/Edit") + " " + t("Common/product group")
                : t("Common/Add") + " " + t("Common/product group")
            }
            confirmOnClose
            isDirty={isDirty}
          >
            <ModalBase.Content>
              <div className="flex items-center gap-2">
                <hr className="w-12 text-(--border-tertiary)" />
                <h3 className="text-sm whitespace-nowrap text-(--text-secondary)">
                  {t("ProductGroupModal/Info1")}
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
                    {...productGroupConstraints.name}
                  />
                </div>
              </div>

              <div className="flex items-center gap-2">
                <hr className="w-12 text-(--border-tertiary)" />
                <h3 className="text-sm whitespace-nowrap text-(--text-secondary)">
                  {t("ProductGroupModal/Info2")}
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
                    .slice()
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
                  {t("ProductGroupModal/Info3")}
                </h3>
                <hr className="w-full text-(--border-tertiary)" />
              </div>

              <MultiDropdown
                scrollContainer={getScrollEl}
                label={t("Common/Products")}
                options={productOptions.map((p) => ({
                  value: String(p.id),
                  label: p.name,
                }))}
                value={productIds.map(String)}
                onChange={(val: string[]) => setProductIds(val.map(Number))}
                onModal
              />

              {productIds.length > 0 && (
                <div className="flex flex-col gap-4">
                  <DragDrop
                    items={productIds}
                    getId={(id) => String(id)}
                    onReorder={(newList) => setProductIds(newList)}
                    onDraggingChange={setIsAnyDragging}
                    renderItem={(id, isDragging) => {
                      const label =
                        productOptions.find((p) => p.id === id)?.name ??
                        `#${id}`;

                      return (
                        <ProductChip
                          label={label}
                          isDragging={isDragging}
                          dragging={isAnyDragging}
                          onDelete={() => deleteProduct(id)}
                        />
                      );
                    }}
                  />

                  <span className="text-sm text-(--text-secondary) italic">
                    {t("Modal/Drag and drop1") +
                      t("Common/column") +
                      t("Modal/Drag and drop3")}
                  </span>
                </div>
              )}

              <div className="mt-8 flex items-center gap-2">
                <hr className="w-12 text-(--border-tertiary)" />
                <h3 className="text-sm whitespace-nowrap text-(--text-secondary)">
                  {t("ProductGroupModal/Info4")}
                </h3>
                <hr className="w-full text-(--border-tertiary)" />
              </div>

              {productIds.length === 0 || activeProductId === null ? (
                <div className="-mt-4 text-sm">
                  {t("ProductGroupModal/Choose a product")}
                </div>
              ) : (
                <div className="flex flex-col gap-6 rounded-2xl bg-(--bg-main) p-8">
                  <h3 className="text-sm whitespace-nowrap text-(--text-secondary)">
                    {t("ProductGroupModal/Override values")}
                  </h3>

                  <div className="mb-4 flex flex-wrap gap-2">
                    {productIds.map((id) => {
                      const label =
                        productOptions.find((p) => p.id === id)?.name ??
                        `#${id}`;
                      const isActive = id === activeProductId;
                      const relevantFieldIds =
                        requiredFieldIdsByProduct[id] ?? [];
                      const relevantFieldIdSet = new Set(relevantFieldIds);

                      const hasOverride = touchedKeys.some((k) => {
                        const [p, f] = k.split(":");
                        return (
                          Number(p) === id && relevantFieldIdSet.has(Number(f))
                        );
                      });

                      return (
                        <button
                          key={id}
                          type="button"
                          className={`${roundedButtonClass} ${isActive ? "!bg-(--accent-color) text-(--text-main-reverse)" : ""} relative w-fit min-w-[40px] px-4`}
                          onClick={() => setActiveProductId(id)}
                          title={label}
                        >
                          {hasOverride && (
                            <CustomTooltip
                              content={t("ProductGroupModal/Has overrides")}
                            >
                              <span
                                className={`${isActive ? "bg-(--note-info)" : "bg-(--accent-color)"} absolute top-1 right-1 h-2 w-2 rounded-full`}
                                aria-hidden="true"
                              />
                            </CustomTooltip>
                          )}
                          {label}
                        </button>
                      );
                    })}
                  </div>

                  {activeFieldIds.length === 0 ? (
                    <div className="-mt-4 text-sm">
                      {t("ProductGroupModal/Missing fields")}
                    </div>
                  ) : hasMissingFieldsForActiveProduct ? (
                    <div className="-mt-4 text-sm">
                      {t("ProductGroupModal/Missing fields")}
                    </div>
                  ) : (
                    <div className="grid grid-cols-1 gap-6">
                      {activeFieldIds
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

                          const current = getFieldValue(activeProductId, id);
                          const isTouched = touchedKeys.includes(
                            makeKey(activeProductId, id),
                          );

                          if (inputType === "checkbox") {
                            const checked = current === "true";
                            return (
                              <div key={id}>
                                <div className="flex items-center gap-4">
                                  <button
                                    type="button"
                                    role="switch"
                                    aria-checked={checked}
                                    className={switchClass(checked)}
                                    onClick={() =>
                                      updateFieldValue(
                                        activeProductId,
                                        id,
                                        checked ? "false" : "true",
                                      )
                                    }
                                  >
                                    <div className={switchKnobClass(checked)} />
                                  </button>

                                  <span>{f.name}</span>
                                </div>

                                {isTouched && (
                                  <button
                                    type="button"
                                    className="group mt-2 text-sm text-(--text-secondary) transition-colors duration-(--fast) hover:text-(--accent-color)"
                                    onClick={() =>
                                      clearFieldOverride(activeProductId, id)
                                    }
                                  >
                                    <span className="text-(--text-main)">
                                      {f.name}
                                    </span>
                                  </button>
                                )}
                              </div>
                            );
                          }

                          return (
                            <div key={id}>
                              <Input
                                label={f.name}
                                value={current}
                                onChange={(val) =>
                                  updateFieldValue(
                                    activeProductId,
                                    id,
                                    String(val),
                                  )
                                }
                                type={inputType as any}
                              />

                              {isTouched && (
                                <button
                                  type="button"
                                  className="mt-2 text-sm text-(--text-secondary) transition-colors duration-(--fast) hover:text-(--accent-color)"
                                  onClick={() =>
                                    clearFieldOverride(activeProductId, id)
                                  }
                                >
                                  {t("ProductGroupModal/Clear override")}{" "}
                                  <span className="text-(--text-main)">
                                    {f.name}
                                  </span>
                                </button>
                              )}
                            </div>
                          );
                        })}
                    </div>
                  )}
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
                    {t("ProductGroupModal/Hide product group")}
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

export default ProductGroupModal;
