"use client";

import { useEffect, useMemo, useRef, useState } from "react";
import * as signalR from "@microsoft/signalr";
import { useToast } from "../components/toast/ToastProvider";
import { useAuth } from "../context/AuthContext";
import { useDragControls } from "framer-motion";
import { useParams } from "next/navigation";
import * as XLSX from "xlsx-js-style";

type HistorySnapshot = {
  masterPlans: any[];
  removedElementIds: (number | string)[];
  selectedId: string | null;
  editMode: "element" | "group";
  isKeepSeparate: boolean;
  currentPage: number;
};

type MasterPlanElement = {
  id: number | string;
  status?: MasterPlanElementStatus | null;
  values: {
    masterPlanFieldId: number;
    masterPlanFieldName: string;
    value: string;
    originalValue?: string | null;
  }[];
  groupId?: number | null;
  struckElement?: boolean;
  currentElement?: boolean;
  nextElement?: boolean;
  isNew?: boolean;
  originalOrder?: number;
  originalGroupId?: number | null;
  originalStruckElement?: boolean | null;
};

type MasterPlanRevision = {
  id: number;
  revisionNumber: number;
  label: string;
  archivedAt: string;
  archivedBy: string;
};

type ProductListTab = "all" | "products" | "product-groups";

type ProductListItem = {
  id: number | string;
  name: string;
  kind: "product" | "product-group";
  masterPlanFields: { id: number; value: string | null }[];
  rows?: {
    id: number | string;
    name: string;
    masterPlanFields: { id: number; value: string | null }[];
  }[];
};

type ProductGroupListItemDto = {
  id: number;
  name: string;
  isHidden: boolean;
};

type ProductGroupFetchDto = {
  id: number;
  name: string;
  isHidden: boolean;
  products?: { id: number; name: string }[];
  productGroupFieldValues: {
    productId: number;
    masterPlanFieldId: number;
    value: string;
  }[];
};

export type MasterPlanElementStatus = "NotStarted" | "InProgress" | "Finished";

export const useMasterPlan = (
  t: any,
  apiUrl: string | undefined,
  token: string | null,
  masterPlanId: string | string[] | undefined,
) => {
  // --- VARIABLES ---
  // --- Refs ---
  const skipNextInfoRef = useRef(false);
  const constraintsRef = useRef(null);
  const isViewingRevisionRef = useRef(false);
  const dragControls = useDragControls();
  const undoStackRef = useRef<HistorySnapshot[]>([]);
  const redoStackRef = useRef<HistorySnapshot[]>([]);

  // --- States ---
  const [historyTick, setHistoryTick] = useState(0);
  const [productSearch, setProductSearch] = useState("");
  const [productTab, setProductTab] = useState<ProductListTab>("all");
  const [productList, setProductList] = useState<ProductListItem[]>([]);
  const [isProductListOpen, setIsProductListOpen] = useState(false);
  const [isProductListLoading, setIsProductListLoading] = useState(false);
  const [isHidden, setIsHidden] = useState(false);
  const [isInvalid, setIsInvalid] = useState(false);
  const [importing, setImporting] = useState(false);
  const [exporting, setExporting] = useState(false);
  const [isCheckingOut, setIsCheckingOut] = useState(false);
  const [isCheckingIn, setIsCheckingIn] = useState(false);
  const [isLoading, setIsLoading] = useState(false);
  const [isManualRefresh, setIsManualRefresh] = useState(false);
  const [refetchTick, setRefetchTick] = useState(0);
  const [masterPlans, setMasterPlans] = useState<
    { id: number | string; elements: MasterPlanElement[]; [key: string]: any }[]
  >([]);
  const [fieldOptions, setFieldOptions] = useState<
    {
      id: number;
      label: string;
      value: string;
      dataType?: string;
      localIncremental?: boolean;
      globalIncremental?: boolean;
      alignment?: "Left" | "Center" | "Right";
      isHidden?: boolean;
    }[]
  >([]);
  const [selectedFields, setSelectedFields] = useState<string[]>([]);
  const [showHidden, setShowHidden] = useState(false);
  const [sortBy, setSortBy] = useState<string>("name");
  const [sortOrder, setSortOrder] = useState<"asc" | "desc">("asc");
  const [hasSearched, setHasSearched] = useState(false);
  const [totalItems, setTotalItems] = useState(0);
  const [currentPage, setCurrentPage] = useState(1);
  const [itemsPerPage, setItemsPerPage] = useState(16);
  const [isEditing, setIsEditing] = useState(false);
  const [groupCounter, setGroupCounter] = useState(1);
  const [isStrikeMode, setIsStrikeMode] = useState(false);
  const [firstFetch, setFirstFetch] = useState(true);
  const [checkedOutBy, setCheckedOutBy] = useState<string | null>(null);
  const [removedElementIds, setRemovedElementIds] = useState<
    (number | string)[]
  >([]);
  const [isExpanded, setIsExpanded] = useState(false);
  const [selectedId, setSelectedId] = useState<string | null>(null);
  const [editMode, setEditMode] = useState<"element" | "group">("element");
  const selectedElement = masterPlans[0]?.elements.find(
    (el) => String(el.id) === selectedId,
  );
  const isSelectedStruck = selectedElement?.struckElement ?? false;
  const [isKeepSeparate, setIsKeepSeparate] = useState(false);
  const [holdInterval, setHoldInterval] = useState<NodeJS.Timeout | null>(null);
  const minDelay = 100;
  const startDelay = 600;
  const acceleration = 100;
  const [revisions, setRevisions] = useState<MasterPlanRevision[]>([]);
  const [selectedRevisionId, setSelectedRevisionId] =
    useState<string>("latest");
  const [isViewingRevision, setIsViewingRevision] = useState(false);
  const [searchTerm, setSearchTerm] = useState("");
  const [statusFilters, setStatusFilters] = useState<MasterPlanElementStatus[]>(
    [],
  );
  const [filterAllOpen, setFilterAllOpen] = useState(false);

  // --- Other ---
  const { groupId } = useParams() as { groupId?: string };
  const parsedGroupId = groupId ? Number(groupId) : undefined;

  const { notify } = useToast();
  const { username } = useAuth();
  const checkedOutByMe = checkedOutBy !== null && checkedOutBy === username;
  const showForceColor =
    !isCheckingOut &&
    !isCheckingIn &&
    !isEditing &&
    checkedOutBy &&
    !checkedOutByMe;

  const getStatusBadge = (
    status: MasterPlanElementStatus | null | undefined,
  ) => {
    const s: MasterPlanElementStatus = status ?? "NotStarted";

    if (s === "Finished") {
      return {
        label: t("MasterPlan/Finished"),
        className: "bg-(--finished) text-(--text-main-reverse)",
      };
    }

    if (s === "InProgress") {
      return {
        label: t("MasterPlan/In progress"),
        className: "bg-(--inProgress) text-(--text-main-reverse)",
      };
    }

    return {
      label: t("MasterPlan/Not started"),
      className: "bg-(--notStarted) !text-(--text-main)",
    };
  };

  // --- Initialization ---
  useEffect(() => {
    const fetchMasterPlan = async () => {
      if (!masterPlanId) {
        setIsInvalid(true);
        if (firstFetch) {
          setIsLoading(false);
          setFirstFetch(false);
        }
        return;
      }

      try {
        if (firstFetch) {
          setIsLoading(true);
        }

        const response = await fetch(
          `${apiUrl}/master-plan/fetch/${masterPlanId}`,
          {
            headers: {
              "Content-Type": "application/json",
              "X-User-Language": localStorage.getItem("language") || "sv",
              Authorization: `Bearer ${token}`,
            },
          },
        );

        if (!response.ok) {
          setIsInvalid(true);
          return;
        }

        const data = await response.json();

        const apiGroupId = Number(data?.unitGroupId);

        if (
          parsedGroupId !== undefined &&
          Number.isFinite(parsedGroupId) &&
          Number.isFinite(apiGroupId) &&
          apiGroupId !== parsedGroupId
        ) {
          setIsHidden(false);
          setIsInvalid(true);
          return;
        }

        setIsInvalid(false);
        const hidden = Boolean(data?.isHidden);
        setIsHidden(hidden);

        if (hidden) {
          return;
        }

        if (!isViewingRevisionRef.current) {
          applyPlanToState(data);
          setIsViewingRevision(false);
          setSelectedRevisionId("latest");
        }

        if (!Array.isArray(masterPlanId)) {
          fetchRevisions(String(masterPlanId));
        }

        setTotalItems(data.elements?.length ?? 0);

        const options =
          data.fields?.map((f: any) => ({
            label: f.name,
            value: f.id.toString(),
            dataType: f.dataType,
            localIncremental: f.localIncremental ?? false,
            globalIncremental: f.globalIncremental ?? false,
            alignment: f.alignment,
            isHidden: f.isHidden ?? false,
            id: f.id,
          })) ?? [];

        setFieldOptions(options);

        // --- Check initial check status ---
        const checkInitialStatus = async () => {
          if (!masterPlanId || !apiUrl) {
            return;
          }

          try {
            const response = await fetch(
              `${apiUrl}/master-plan/check/status/${masterPlanId}`,
              {
                method: "GET",
                headers: {
                  "Content-Type": "application/json",
                  "X-User-Language": localStorage.getItem("language") || "sv",
                  Authorization: `Bearer ${token}`,
                },
              },
            );

            if (!response.ok) {
              return;
            }

            const data = await response.json();
            setIsEditing(data.isCheckedOutByMe || false);
            setCheckedOutBy(data.checkedOutBy || null);
          } catch {}
        };

        if (!isViewingRevision) {
          checkInitialStatus();
        }
      } finally {
        setIsManualRefresh(false);

        if (firstFetch) {
          setIsLoading(false);
          setFirstFetch(false);
        }
      }
    };

    fetchMasterPlan();
  }, [
    refetchTick,
    masterPlanId,
    apiUrl,
    token,
    isViewingRevision,
    parsedGroupId,
  ]);

  // --- Handle import file ---
  const handleImport = async (file: File) => {
    if (!file) {
      return;
    }

    if (isViewingRevision) {
      return;
    }

    setImporting(true);

    try {
      const rulesRes = await fetch(
        `${apiUrl}/master-plan/import-rules/${masterPlanId}`,
        {
          headers: {
            "Content-Type": "application/json",
            "X-User-Language": localStorage.getItem("language") || "sv",
            Authorization: `Bearer ${token}`,
          },
        },
      );

      if (!rulesRes.ok) {
        notify("error", t("MasterPlan/Failed import"));
        return;
      }

      const rules = await rulesRes.json();
      const groupFieldId: number | null = rules.groupFieldId ?? null;
      const replaceOnImport: boolean = !!rules.replaceOnImport;

      const masterPlanIdValue = Array.isArray(masterPlanId)
        ? masterPlanId[0]
        : masterPlanId;

      if (!masterPlanIdValue) {
        notify("error", t("MasterPlan/Failed import"));
        return;
      }

      const existingElements = replaceOnImport
        ? []
        : (masterPlans[0]?.elements ?? []);

      if (replaceOnImport) {
        const idsToDelete = (masterPlans[0]?.elements ?? [])
          .map((e) => e.id)
          .filter((id) => !isNaN(Number(id)));

        setRemovedElementIds((prev) => {
          const set = new Set(prev.map(String));
          for (const id of idsToDelete) set.add(String(id));
          return Array.from(set);
        });

        setSelectedId(null);

        setMasterPlans((prev) =>
          prev.map((p) =>
            String(p.id) === String(masterPlanIdValue)
              ? { ...p, elements: [] }
              : p,
          ),
        );

        setCurrentPage(1);
      }

      const form = new FormData();
      form.append("file", file);
      form.append("masterPlanId", masterPlanIdValue);

      const res = await fetch(`${apiUrl}/master-plan/import-rules/import`, {
        method: "POST",
        headers: { Authorization: `Bearer ${token}` },
        body: form,
      });

      if (!res.ok) {
        notify("error", t("MasterPlan/Failed import"));
        return;
      }

      const rows = await res.json();

      const nextGroupId = () => {
        const maxId = existingElements.length
          ? Math.max(...existingElements.map((e) => e.groupId || 0))
          : 0;
        return maxId + 1;
      };

      let currentGroupId = nextGroupId();
      const groupIdByKey = new Map<string, number>();

      let failedRows = 0;

      for (const row of [...rows].reverse()) {
        try {
          const dict: Record<number, string> = {};
          for (const [fieldId, value] of Object.entries(row.values)) {
            dict[Number(fieldId)] = value as string;
          }

          let finalGroupId: number | null = null;

          if (groupFieldId) {
            const raw = (dict[groupFieldId] ?? "").trim();
            if (raw) {
              const key = raw.toLowerCase();
              if (!groupIdByKey.has(key)) {
                groupIdByKey.set(key, currentGroupId);
                currentGroupId++;
              }
              finalGroupId = groupIdByKey.get(key) ?? null;
            } else {
              finalGroupId = currentGroupId;
              currentGroupId++;
            }
          } else {
            finalGroupId = currentGroupId;
            currentGroupId++;
          }

          handleAddElement(Number(masterPlanIdValue), finalGroupId, dict);
        } catch {
          failedRows++;
        }
      }

      if (failedRows > 0) {
        notify("error", t("MasterPlan/Failed import"));
      } else {
        notify("success", t("MasterPlan/Successful import"));
      }
    } catch {
      notify("error", t("MasterPlan/Failed import"));
    } finally {
      setImporting(false);
    }
  };

  // --- Handle export file ---
  const handleExport = () => {
    const plan = masterPlans[0];
    if (!plan) return;

    const planNameRaw = String(
      plan.name ??
        plan.title ??
        plan.label ??
        plan.id ??
        t("entities.masterPlan", { capitalize: true }),
    );
    const planName = planNameRaw.replace(/[\\/:*?"<>|]/g, "-").trim();

    const pad = (n: number) => String(n).padStart(2, "0");
    const now = new Date();
    const stamp = `${now.getFullYear()}-${pad(now.getMonth() + 1)}-${pad(now.getDate())} ${pad(now.getHours())}.${pad(now.getMinutes())}.${pad(now.getSeconds())}`;

    const cols = fieldOptions.filter((f) => !f.isHidden);

    const rows = elements
      .filter((el) => !removedElementIds.includes(el.id))
      .map((el) => {
        const row: Record<string, any> = {};
        for (const f of cols) {
          row[f.label] =
            el.values?.find((v) => v.masterPlanFieldId === f.id)?.value ?? "";
        }
        return row;
      });

    const ws = XLSX.utils.json_to_sheet(rows);

    const headerLabels = cols.map((c) => c.label);
    const maxLenByCol = headerLabels.map((h) => String(h ?? "").length);

    for (const r of rows) {
      for (let i = 0; i < headerLabels.length; i++) {
        const key = headerLabels[i];
        const v = r[key];
        const len = String(v ?? "").length;
        if (len > maxLenByCol[i]) maxLenByCol[i] = len;
      }
    }

    ws["!cols"] = maxLenByCol.map((len) => ({
      wch: Math.min(60, Math.max(1, len + 1)),
    }));

    const range = XLSX.utils.decode_range(ws["!ref"] ?? "A1:A1");

    const headerStyle = {
      font: { bold: true, color: { rgb: "ffffff" } },
      fill: { patternType: "solid", fgColor: { rgb: "0063be" } },
      alignment: { vertical: "center", horizontal: "left" },
      border: {
        top: { style: "thin", color: { rgb: "6a6a6a" } },
        bottom: { style: "thin", color: { rgb: "6a6a6a" } },
        left: { style: "thin", color: { rgb: "6a6a6a" } },
        right: { style: "thin", color: { rgb: "6a6a6a" } },
      },
    };

    const cellStyle = {
      fill: { patternType: "solid", fgColor: { rgb: "e1e1e1" } },
      alignment: { vertical: "center", horizontal: "left", wrapText: false },
      border: {
        top: { style: "thin", color: { rgb: "6a6a6a" } },
        bottom: { style: "thin", color: { rgb: "6a6a6a" } },
        left: { style: "thin", color: { rgb: "6a6a6a" } },
        right: { style: "thin", color: { rgb: "6a6a6a" } },
      },
    };

    for (let C = range.s.c; C <= range.e.c; C++) {
      const addr = XLSX.utils.encode_cell({ r: 0, c: C });
      if (ws[addr]) ws[addr].s = headerStyle;
    }

    for (let R = 1; R <= range.e.r; R++) {
      for (let C = range.s.c; C <= range.e.c; C++) {
        const addr = XLSX.utils.encode_cell({ r: R, c: C });
        if (ws[addr]) ws[addr].s = cellStyle;
      }
    }

    ws["!rows"] = [{ hpt: 20 }];

    const ref = XLSX.utils.encode_range({
      s: { r: 0, c: 0 },
      e: { r: rows.length, c: headerLabels.length - 1 },
    });

    ws["!autofilter"] = { ref };
    ws["!freeze"] = { xSplit: 0, ySplit: 1 };

    const wb = XLSX.utils.book_new();
    XLSX.utils.book_append_sheet(
      wb,
      ws,
      t("entities.masterPlan", { capitalize: true }),
    );

    XLSX.writeFile(
      wb,
      `${t("entities.masterPlan", { capitalize: true })} - ${planName} - ${stamp}.xlsx`,
    );
  };

  // --- Revision management ---
  const fetchRevisions = async (id: string) => {
    const res = await fetch(`${apiUrl}/master-plan/${id}/revisions`, {
      headers: {
        "Content-Type": "application/json",
        "X-User-Language": localStorage.getItem("language") || "sv",
        Authorization: `Bearer ${token}`,
      },
    });

    if (!res.ok) return;

    const data = await res.json();
    setRevisions(data.items ?? []);
  };

  const fetchRevisionSnapshot = async (id: string, revisionId: string) => {
    const res = await fetch(
      `${apiUrl}/master-plan/${id}/revisions/${revisionId}`,
      {
        headers: {
          "Content-Type": "application/json",
          "X-User-Language": localStorage.getItem("language") || "sv",
          Authorization: `Bearer ${token}`,
        },
      },
    );

    if (!res.ok) return null;

    const data = await res.json();
    return data.masterPlan ?? null;
  };

  const applyPlanToState = (data: any) => {
    resetHistory();

    setMasterPlans([
      {
        ...data,
        elements: (data.elements ?? []).map((el: any, index: number) => ({
          ...el,
          originalOrder: index,
          originalGroupId: el.groupId,
          originalStruckElement: el.struckElement,
          values: (el.values ?? []).map((v: any) => ({
            ...v,
            originalValue: v.value,
          })),
        })),
      },
    ]);

    setTotalItems(data.elements?.length ?? 0);

    const options =
      data.fields?.map((f: any) => ({
        label: f.name,
        value: f.id.toString(),
        dataType: f.dataType,
        localIncremental: f.localIncremental ?? false,
        globalIncremental: f.globalIncremental ?? false,
        alignment: f.alignment,
        isHidden: f.isHidden ?? false,
        id: f.id,
      })) ?? [];

    setFieldOptions(options);
  };

  const selectRevision = async (value: string) => {
    const id = Array.isArray(masterPlanId) ? masterPlanId[0] : masterPlanId;
    if (!id) {
      return;
    }

    if (value === "latest") {
      setSelectedRevisionId("latest");
      setIsViewingRevision(false);
      isViewingRevisionRef.current = false;
      resetHistory();
      requestRefetch();
      return;
    }

    setIsLoading(true);
    try {
      const snapshot = await fetchRevisionSnapshot(String(id), value);
      if (!snapshot) {
        return;
      }

      setSelectedRevisionId(value);
      setIsViewingRevision(true);
      isViewingRevisionRef.current = true;
      setIsEditing(false);
      setEditMode("element");
      resetHistory();
      clearRemovedElements();
      setSelectedId(null);
      applyPlanToState(snapshot);
    } finally {
      setIsLoading(false);
    }
  };

  useEffect(() => {
    isViewingRevisionRef.current = isViewingRevision;
  }, [isViewingRevision]);

  const refreshRevisions = async () => {
    const id = Array.isArray(masterPlanId) ? masterPlanId[0] : masterPlanId;
    if (!id) return;
    await fetchRevisions(String(id));
  };

  // --- Handle search ---
  const handleSearch = async () => {
    try {
      setIsLoading(true);
      const params = new URLSearchParams();
      if (showHidden) params.append("isHidden", "true");
      if (selectedFields.length > 0)
        selectedFields.forEach((id) => params.append("fieldIds", id));
      params.append("page", String(currentPage));
      params.append("pageSize", String(itemsPerPage));

      const response = await fetch(
        `${apiUrl}/master-plan?${params.toString()}`,
        {
          headers: {
            "Content-Type": "application/json",
            "X-User-Language": localStorage.getItem("language") || "sv",
            Authorization: `Bearer ${token}`,
          },
        },
      );

      if (!response.ok) return;

      const data = await response.json();

      setMasterPlans(data.items ?? []);
      setTotalItems(data.totalCount ?? 0);
      setHasSearched(true);
    } finally {
      setIsLoading(false);
    }
  };

  // --- Handle reset ---
  const handleReset = () => {
    setSelectedFields([]);
    setShowHidden(false);
    setMasterPlans([]);
    setTotalItems(0);
    setHasSearched(false);
    setCurrentPage(1);
  };

  // --- Handle add element ---
  const handleAddElement = (
    planId: number,
    groupId: number | null = null,
    values: Record<number, string> = {},
  ) => {
    pushHistory();

    setMasterPlans((prev) =>
      prev.map((p) => {
        if (p.id !== planId) return p;

        let insertIndex = 0;
        let finalGroupId: number | null = groupId;

        if (finalGroupId == null) {
          if (selectedId) {
            const selectedIndex = p.elements.findIndex(
              (el) => String(el.id) === String(selectedId),
            );
            if (selectedIndex !== -1) {
              const selected = p.elements[selectedIndex];
              const groupIdentifier = selected.groupId ?? null;

              const topIndex = p.elements.findIndex((el) =>
                groupIdentifier
                  ? el.groupId === groupIdentifier
                  : el.id === selected.id,
              );

              insertIndex = topIndex;

              if (editMode === "group" && selected.groupId != null) {
                finalGroupId = selected.groupId;
              } else {
                finalGroupId =
                  p.elements.length > 0
                    ? Math.max(...p.elements.map((el) => el.groupId || 0)) + 1
                    : 1;
              }
            }
          }

          if (!selectedId) {
            finalGroupId =
              p.elements.length > 0
                ? Math.max(...p.elements.map((el) => el.groupId || 0)) + 1
                : 1;
          }
        }

        const alloc = createIncrementalAllocator(p.elements);

        const tempId = `temp-${Date.now()}-${Math.random()}`;

        const newValues = fieldOptions.map((f) => {
          const raw = String(values[f.id] ?? "");
          const isInc = !!f.localIncremental || !!f.globalIncremental;

          const value =
            isInc && raw.trim() === ""
              ? alloc(f.id, finalGroupId, tempId)
              : raw;

          return {
            masterPlanFieldId: f.id,
            masterPlanFieldName: f.label,
            value,
          };
        });

        const newElement: MasterPlanElement = {
          id: tempId,
          groupId: finalGroupId,
          values: newValues,
          currentElement: false,
          nextElement: false,
          struckElement: false,
          isNew: true,
        };

        const updated = [...p.elements];
        updated.splice(insertIndex, 0, newElement);

        return { ...p, elements: updated };
      }),
    );
  };

  const handleAddFromProductListItem = (
    planId: number,
    item: ProductListItem,
    groupId: number | null = null,
  ) => {
    pushHistory();

    const rows =
      Array.isArray(item.rows) && item.rows.length > 0 ? item.rows : null;

    const toDict = (fields: { id: number; value: string | null }[]) => {
      const dict: Record<number, string> = {};
      for (const f of fields) {
        dict[Number(f.id)] = String(f.value ?? "");
      }
      return dict;
    };

    setMasterPlans((prev) =>
      prev.map((p) => {
        if (p.id !== planId) return p;

        let insertIndex = 0;
        let finalGroupId: number | null = groupId;

        if (finalGroupId == null) {
          if (selectedId) {
            const selectedIndex = p.elements.findIndex(
              (el) => String(el.id) === String(selectedId),
            );

            if (selectedIndex !== -1) {
              const selected = p.elements[selectedIndex];
              const groupIdentifier = selected.groupId ?? null;

              const topIndex = p.elements.findIndex((el) =>
                groupIdentifier
                  ? el.groupId === groupIdentifier
                  : el.id === selected.id,
              );

              insertIndex = topIndex;

              if (editMode === "group" && selected.groupId != null) {
                finalGroupId = selected.groupId;
              } else {
                finalGroupId =
                  p.elements.length > 0
                    ? Math.max(...p.elements.map((el) => el.groupId || 0)) + 1
                    : 1;
              }
            }
          }

          if (!selectedId) {
            finalGroupId =
              p.elements.length > 0
                ? Math.max(...p.elements.map((el) => el.groupId || 0)) + 1
                : 1;
          }
        }

        const alloc = createIncrementalAllocator(p.elements);

        const itemsToInsert = rows
          ? rows.map((r) => toDict(r.masterPlanFields))
          : [toDict(item.masterPlanFields)];

        const newElements: MasterPlanElement[] = itemsToInsert.map((values) => {
          const tempId = `temp-${Date.now()}-${Math.random()}`;

          const newValues = fieldOptions.map((f) => {
            const raw = String(values[f.id] ?? "");
            const isInc = !!f.localIncremental || !!f.globalIncremental;

            const value =
              isInc && raw.trim() === ""
                ? alloc(f.id, finalGroupId, tempId)
                : raw;

            return {
              masterPlanFieldId: f.id,
              masterPlanFieldName: f.label,
              value,
            };
          });

          return {
            id: tempId,
            groupId: finalGroupId,
            values: newValues,
            currentElement: false,
            nextElement: false,
            struckElement: false,
            isNew: true,
          };
        });

        const updated = [...p.elements];
        updated.splice(insertIndex, 0, ...newElements);

        return { ...p, elements: updated };
      }),
    );
  };

  // --- Duplicate selected ---
  const duplicateSelected = (
    planId: string,
    elementId: string,
    mode: "element" | "group",
  ) => {
    pushHistory();

    setMasterPlans((prev) =>
      prev.map((plan) => {
        if (String(plan.id) !== String(planId)) return plan;

        const target = plan.elements.find(
          (e) => String(e.id) === String(elementId),
        );
        if (!target) return plan;

        const elements = plan.elements;
        const groupIdentifier = target.groupId ?? null;

        const topIndex = elements.findIndex((el) =>
          groupIdentifier
            ? el.groupId === groupIdentifier
            : el.id === target.id,
        );

        const newGroupId =
          elements.length > 0
            ? Math.max(...elements.map((el) => el.groupId || 0)) + 1
            : 1;

        if (mode === "group") {
          const group = elements.filter((e) =>
            groupIdentifier
              ? e.groupId === groupIdentifier
              : e.id === target.id,
          );

          const copies = group.map((e) => ({
            id: `temp-${Date.now()}-${e.id}`,
            groupId: newGroupId,
            values: e.values.map((v) => ({
              masterPlanFieldId: v.masterPlanFieldId,
              masterPlanFieldName: v.masterPlanFieldName,
              value: v.value ?? "",
            })),
            struckElement: e.struckElement ?? false,
            currentElement: false,
            nextElement: false,
            isNew: true,
          }));

          const updated = [...elements];
          updated.splice(topIndex, 0, ...copies);
          return { ...plan, elements: updated };
        }

        const copyValues = target.values.map((v) => ({
          masterPlanFieldId: v.masterPlanFieldId,
          masterPlanFieldName: v.masterPlanFieldName,
          value: v.value ?? "",
        }));

        const newElement: MasterPlanElement = {
          id: `temp-${Date.now()}`,
          groupId: newGroupId,
          values: copyValues,
          struckElement: target.struckElement ?? false,
          currentElement: false,
          nextElement: false,
          isNew: true,
        };

        const updated = [...elements];
        updated.splice(topIndex, 0, newElement);
        return { ...plan, elements: updated };
      }),
    );
  };

  // --- Handle cell change ---
  const handleCellChange = (
    planId: string,
    elementId: string,
    fieldId: number,
    newValue: string,
  ) => {
    pushHistory();

    setMasterPlans((prev) =>
      prev.map((plan) =>
        String(plan.id) !== String(planId)
          ? plan
          : {
              ...plan,
              elements: plan.elements.map((el: MasterPlanElement) =>
                String(el.id) !== String(elementId)
                  ? el
                  : {
                      ...el,
                      values: el.values.map((v) =>
                        v.masterPlanFieldId === fieldId
                          ? {
                              ...v,
                              value: newValue,
                              originalValue: v.originalValue ?? v.value ?? "",
                            }
                          : v,
                      ),
                    },
              ),
            },
      ),
    );
  };

  // --- Toggle strike through ---
  const toggleStrikeThrough = (
    elementId: string,
    mode: "element" | "group",
  ) => {
    pushHistory();

    setMasterPlans((prev) =>
      prev.map((plan) => {
        const target = plan.elements.find(
          (el) => String(el.id) === String(elementId),
        );
        if (!target) return plan;

        const groupId = target.groupId ?? null;
        const currentlyStruck = !!target.struckElement;

        return {
          ...plan,
          elements: plan.elements.map((el) => {
            const shouldStrike =
              mode === "group"
                ? el.groupId === groupId
                : String(el.id) === String(elementId);

            return shouldStrike
              ? { ...el, struckElement: !currentlyStruck, hasChanges: true }
              : el;
          }),
        };
      }),
    );
  };

  // --- Toggle remove element ---
  const toggleRemoveElement = (
    elementId: string,
    mode: "element" | "group" = "element",
  ) => {
    pushHistory();

    setRemovedElementIds((prev) => {
      const updated = new Set(prev);

      const plan = masterPlans[0];
      if (!plan) return prev;

      const target = plan.elements.find((el) => String(el.id) === elementId);
      if (!target) return prev;

      const groupId = target.groupId ?? null;
      const elementsToToggle =
        mode === "group"
          ? plan.elements.filter((el) => el.groupId === groupId)
          : [target];

      const allMarked = elementsToToggle.every((el) => updated.has(el.id));

      elementsToToggle.forEach((el) => {
        if (allMarked) updated.delete(el.id);
        else updated.add(el.id);
      });

      return Array.from(updated);
    });
  };

  const clearRemovedElements = () => {
    setRemovedElementIds([]);
  };

  // --- Handle save ---
  const handleSave = async () => {
    if (!masterPlans.length) {
      return;
    }

    if (isViewingRevision) {
      return;
    }

    const plan = masterPlans[0];
    try {
      for (const id of removedElementIds) {
        if (!isNaN(Number(id))) {
          await fetch(`${apiUrl}/master-plan-element/delete/${id}`, {
            method: "DELETE",
            headers: {
              "Content-Type": "application/json",
              "X-User-Language": localStorage.getItem("language") || "sv",
              Authorization: `Bearer ${token}`,
            },
          });
        }
      }

      for (const el of plan.elements) {
        if (removedElementIds.some((id) => String(id) === String(el.id)))
          continue;

        if (isNaN(Number(el.id))) {
          const createDto = {
            groupId: el.groupId ?? null,
            struckElement: !!el.struckElement,
            currentElement: !!el.currentElement,
            nextElement: !!el.nextElement,
            order: plan.elements.indexOf(el),
            values: el.values.map((v) => ({
              masterPlanFieldId: v.masterPlanFieldId,
              value: v.value === "" ? null : v.value,
            })),
          };

          const res = await fetch(
            `${apiUrl}/master-plan-element/create/${plan.id}`,
            {
              method: "POST",
              headers: {
                "Content-Type": "application/json",
                "X-User-Language": localStorage.getItem("language") || "sv",
                Authorization: `Bearer ${token}`,
              },
              body: JSON.stringify(createDto),
            },
          );
          if (!res.ok) continue;
          const { id: newId } = await res.json();
          el.id = newId;
          el.isNew = true;
        }
      }

      for (const el of plan.elements) {
        const elementId = Number(el.id);
        if (isNaN(elementId)) continue;
        if (el.isNew) continue;

        const orderChanged = plan.elements.indexOf(el) !== el.originalOrder;
        const groupChanged = el.groupId !== el.originalGroupId;
        const struckChanged = el.struckElement !== el.originalStruckElement;
        const hasChanged =
          el.values.some((v) => v.value !== v.originalValue) ||
          orderChanged ||
          groupChanged ||
          struckChanged;

        if (!hasChanged) continue;

        const includeGroupList = orderChanged || groupChanged;
        const isFirstMover =
          includeGroupList &&
          !plan.elements.some(
            (prevEl) =>
              prevEl !== el &&
              (plan.elements.indexOf(prevEl) !== prevEl.originalOrder ||
                prevEl.groupId !== prevEl.originalGroupId),
          );

        const updateDto: any = {
          masterPlanId: plan.id,
          groupId: el.groupId ?? null,
          struckElement: !!el.struckElement,
          currentElement: !!el.currentElement,
          nextElement: !!el.nextElement,
          order: plan.elements.indexOf(el),
          values: el.values.map((v) => ({
            masterPlanFieldId: v.masterPlanFieldId,
            value: v.value === "" ? null : v.value,
          })),
        };

        if (isFirstMover) {
          updateDto.groupList = {
            elements: plan.elements.map((e, order) => ({
              elementId: Number(e.id),
              groupId: e.groupId ?? null,
              order,
            })),
          };
        }

        const res = await fetch(
          `${apiUrl}/master-plan-element/update/${elementId}`,
          {
            method: "PUT",
            headers: {
              "Content-Type": "application/json",
              "X-User-Language": localStorage.getItem("language") || "sv",
              Authorization: `Bearer ${token}`,
            },
            body: JSON.stringify(updateDto),
          },
        );

        if (!res.ok) continue;
      }

      setIsEditing(false);
      setEditMode("element");
      resetHistory();
      requestRefetch();
      await handleCheck(true);
      clearRemovedElements();
      setSelectedId(null);
    } finally {
      setIsCheckingIn(false);
    }
  };

  // --- Update status ---
  const updateStatus = async (
    elementId: number | string,
    status: MasterPlanElementStatus,
  ) => {
    if (!apiUrl || !token) {
      return;
    }

    const response = await fetch(
      `${apiUrl}/master-plan-element/update-status/${elementId}`,
      {
        method: "PUT",
        headers: {
          "Content-Type": "application/json",
          "X-User-Language": localStorage.getItem("language") || "sv",
          Authorization: `Bearer ${token}`,
        },
        body: JSON.stringify({ status }),
      },
    );
    {
      if (!response.ok) {
        return;
      }

      setMasterPlans((prev) =>
        prev.map((plan) => ({
          ...plan,
          elements: plan.elements.map((el) =>
            String(el.id) === String(elementId) ? { ...el, status } : el,
          ),
        })),
      );
    }
  };

  // --- Handle cancel ---
  const handleAbortChanges = async () => {
    setIsEditing(false);
    setEditMode("element");
    resetHistory();
    requestRefetch();
    await handleCheck(true, true);
    clearRemovedElements();
    setSelectedId(null);
  };

  // --- Check hub ---
  const handleCheck = async (force = false, cancelled = false) => {
    if (!masterPlanId || !apiUrl) {
      return;
    }

    if (isHidden) {
      return;
    }

    try {
      skipNextInfoRef.current = true;

      const response = await fetch(
        `${apiUrl}/master-plan/check/${masterPlanId}?force=${force}&cancelled=${cancelled}`,
        {
          method: "POST",
          headers: {
            "Content-Type": "application/json",
            "X-User-Language": localStorage.getItem("language") || "sv",
            Authorization: `Bearer ${token}`,
          },
        },
      );

      const data = await response.json();

      if (!response.ok) {
        notify("error", data.message, 6000);
        return;
      }

      const type = cancelled ? "info" : "success";
      notify(type, t(data.message, 6000));

      const statusRes = await fetch(
        `${apiUrl}/master-plan/check/status/${masterPlanId}`,
        {
          headers: {
            "Content-Type": "application/json",
            "X-User-Language": localStorage.getItem("language") || "sv",
            Authorization: `Bearer ${token}`,
          },
        },
      );
      if (statusRes.ok) {
        const status = await statusRes.json();
        setIsEditing(status.isCheckedOutByMe || false);
        setCheckedOutBy(status.checkedOutBy || null);
      }
    } finally {
      setIsCheckingOut(false);
      setIsCheckingIn(false);
    }
  };

  useEffect(() => {
    if (!apiUrl || !masterPlanId || isHidden) {
      return;
    }

    const connection = new signalR.HubConnectionBuilder()
      .withUrl(`${apiUrl}/hubs/master-plan`, {
        transport: signalR.HttpTransportType.WebSockets,
      })
      .withAutomaticReconnect()
      .build();

    connection.on(
      "MasterPlanForceTakenOver",
      async ({ masterPlanId: id, message, forcedBy }) => {
        if (String(id) !== String(masterPlanId)) {
          return;
        }

        if (!skipNextInfoRef.current) {
          notify("error", t(message, { forcedBy }, 6000));
        }

        skipNextInfoRef.current = false;

        setCheckedOutBy(forcedBy || null);
        setIsEditing(false);

        await refreshRevisions();

        if (!isViewingRevisionRef.current) {
          setEditMode("element");
          clearRemovedElements();
          setSelectedId(null);
          requestRefetch();
        }
      },
    );

    connection.on(
      "MasterPlanCheckedIn",
      async ({ masterPlanId: id, message, checkedInBy }) => {
        if (String(id) !== String(masterPlanId)) {
          return;
        }

        if (checkedInBy !== username && !skipNextInfoRef.current) {
          notify("info", t(message, { checkedInBy }, 6000));
        }

        skipNextInfoRef.current = false;

        setCheckedOutBy(null);
        setIsEditing(false);

        await refreshRevisions();

        if (!isViewingRevisionRef.current) {
          setEditMode("element");
          clearRemovedElements();
          setSelectedId(null);
          requestRefetch();
        }
      },
    );

    connection.on(
      "MasterPlanCheckInAborted",
      async ({ masterPlanId: id, message, checkedInBy }) => {
        if (String(id) !== String(masterPlanId)) {
          return;
        }

        if (checkedInBy !== username && !skipNextInfoRef.current) {
          notify("info", t(message, { checkedInBy }, 6000));
        }

        skipNextInfoRef.current = false;
        setIsEditing(false);

        await refreshRevisions();

        if (!isViewingRevisionRef.current) {
          setEditMode("element");
          clearRemovedElements();
          setSelectedId(null);
          requestRefetch();
        }
      },
    );

    connection.on(
      "MasterPlanCheckedOut",
      async ({ masterPlanId: id, message, checkedOutBy }) => {
        if (String(id) !== String(masterPlanId)) {
          return;
        }

        if (checkedOutBy !== username && !skipNextInfoRef.current) {
          notify("info", t(message, { checkedOutBy }, 6000));
        }

        skipNextInfoRef.current = false;

        setCheckedOutBy(checkedOutBy || null);
        setIsEditing(false);

        await refreshRevisions();

        if (!isViewingRevisionRef.current) {
          requestRefetch();
        }
      },
    );

    let stopped = false;

    connection
      .start()
      .then(() => {
        if (stopped) {
          return connection.stop().catch(() => {});
        }
      })
      .catch((err) => {
        if (!err.message?.includes("stopped during negotiation")) {
          console.warn("SignalR start error:", err);
        }
      });

    return () => {
      stopped = true;
      if (connection.state === signalR.HubConnectionState.Connected) {
        connection.stop().catch(() => {});
      }
    };
  }, [apiUrl, masterPlanId, isHidden, username]);

  // --- Move element & group ---
  const moveElement = (
    planId: string,
    elementId: string,
    direction: "up" | "down",
    keepSeparate = false,
  ) => {
    pushHistory();

    setMasterPlans((prev) =>
      prev.map((plan) => {
        if (String(plan.id) !== String(planId)) return plan;

        const elements = [...plan.elements];
        const index = elements.findIndex(
          (el) => String(el.id) === String(elementId),
        );
        if (index === -1) return plan;

        const current = elements[index];
        const currentGroupId = current.groupId ?? null;

        // --- Identify all groups ---
        const groups: (number | string)[] = [];
        const seen = new Set<string>();
        for (const el of elements) {
          const key = el.groupId ? `group-${el.groupId}` : `nogroup-${el.id}`;
          if (!seen.has(key)) {
            groups.push(el.groupId ?? `nogroup-${el.id}`);
            seen.add(key);
          }
        }

        // --- If not keepSeparate: normal single element move (with group exit) ---
        if (!keepSeparate) {
          const targetIndex = direction === "up" ? index - 1 : index + 1;

          // --- Move outside top or bottom of list: exit current group ---
          if (targetIndex < 0 || targetIndex >= elements.length) {
            const newGroupId =
              Math.max(
                1,
                ...elements.map((e) => (e.groupId ? Number(e.groupId) : 0)),
              ) + 1;

            const updated = [...elements];
            updated[index] = { ...current, groupId: newGroupId };

            const uniqueGroups = Array.from(
              new Set(
                updated.map((e) =>
                  e.groupId ? `group-${e.groupId}` : `nogroup-${e.id}`,
                ),
              ),
            );
            const movedGroup = `group-${newGroupId}`;
            const newGroupIndex = uniqueGroups.findIndex(
              (g) => g === movedGroup,
            );
            const newPage = Math.floor(newGroupIndex / itemsPerPage) + 1;
            setCurrentPage(newPage);

            return { ...plan, elements: updated };
          }

          // --- Normal swap with next/previous element ---
          const target = elements[targetIndex];
          const reordered = [...elements];
          reordered.splice(index, 1);
          reordered.splice(targetIndex, 0, current);

          // --- Adjust group if crossing group boundary ---
          const currentGroup = current.groupId ?? null;
          const targetGroup = target.groupId ?? null;
          if (currentGroup !== targetGroup) {
            reordered[targetIndex] = { ...current, groupId: targetGroup };
          }

          const moved = reordered[targetIndex];
          const groupKey = moved.groupId
            ? `group-${moved.groupId}`
            : `nogroup-${moved.id}`;
          const allGroups = Array.from(
            new Set(
              reordered.map((e) =>
                e.groupId ? `group-${e.groupId}` : `nogroup-${e.id}`,
              ),
            ),
          );
          const groupIndex = allGroups.findIndex((g) => g === groupKey);
          const newPage = Math.floor(groupIndex / itemsPerPage) + 1;
          setCurrentPage(newPage);

          return { ...plan, elements: reordered };
        }

        // --- KeepSeparate mode: jump whole groups ---
        const currentGroupKey = currentGroupId
          ? `group-${currentGroupId}`
          : `nogroup-${current.id}`;
        const currentGroupIndex = groups.findIndex(
          (g) =>
            (typeof g === "number" ? `group-${g}` : String(g)) ===
            currentGroupKey,
        );
        if (currentGroupIndex === -1) return plan;

        const targetGroupIndex =
          direction === "up" ? currentGroupIndex - 1 : currentGroupIndex + 1;

        // --- If at edge, move out into a new group (same as before) ---
        if (targetGroupIndex < 0 || targetGroupIndex >= groups.length) {
          const newGroupId =
            Math.max(
              1,
              ...elements.map((e) => (e.groupId ? Number(e.groupId) : 0)),
            ) + 1;

          const updated = [...elements];
          const updatedElements = updated.map((el) =>
            el.id === current.id ? { ...el, groupId: newGroupId } : el,
          );

          const uniqueGroups = Array.from(
            new Set(
              updatedElements.map((e) =>
                e.groupId ? `group-${e.groupId}` : `nogroup-${e.id}`,
              ),
            ),
          );
          const movedGroup = `group-${newGroupId}`;
          const newGroupIndex = uniqueGroups.findIndex((g) => g === movedGroup);
          const newPage = Math.floor(newGroupIndex / itemsPerPage) + 1;
          setCurrentPage(newPage);

          return { ...plan, elements: updatedElements };
        }

        const targetGroup = groups[targetGroupIndex];

        // --- Find first element of the target group ---
        const targetFirstIndex = elements.findIndex((el) => {
          if (targetGroup.toString().startsWith("nogroup-")) {
            const id = targetGroup.toString().replace("nogroup-", "");
            return String(el.id) === id;
          }
          return String(el.groupId) === String(targetGroup);
        });
        if (targetFirstIndex === -1) return plan;

        // --- Move current group as a whole ---
        const currentGroupElements = elements.filter((el) =>
          currentGroupId ? el.groupId === currentGroupId : el.id === current.id,
        );
        const filtered = elements.filter(
          (el) =>
            !(currentGroupId
              ? el.groupId === currentGroupId
              : el.id === current.id),
        );

        // --- Find first element of target group in the filtered list ---
        const targetIndexInFiltered = filtered.findIndex((el) => {
          if (targetGroup.toString().startsWith("nogroup-")) {
            const id = targetGroup.toString().replace("nogroup-", "");
            return String(el.id) === id;
          }
          return String(el.groupId) === String(targetGroup);
        });

        // --- Find insert index ---
        let insertIndex = targetIndexInFiltered;
        if (direction === "down" && targetIndexInFiltered !== -1) {
          const targetGroupElements = filtered.filter((el) =>
            targetGroup.toString().startsWith("nogroup-")
              ? String(el.id) === targetGroup.toString().replace("nogroup-", "")
              : String(el.groupId) === String(targetGroup),
          );
          insertIndex = targetIndexInFiltered + targetGroupElements.length;
        }

        if (insertIndex === -1) insertIndex = filtered.length;

        const reordered = [
          ...filtered.slice(0, insertIndex),
          ...currentGroupElements,
          ...filtered.slice(insertIndex),
        ];

        const newPage = Math.floor(targetGroupIndex / itemsPerPage) + 1;
        setCurrentPage(newPage);

        return { ...plan, elements: reordered };
      }),
    );
  };

  const moveGroup = (
    planId: string,
    groupId: number | string | null,
    direction: "up" | "down",
  ) => {
    pushHistory();

    setMasterPlans((prev) =>
      prev.map((plan) => {
        if (String(plan.id) !== String(planId)) return plan;
        const elements: MasterPlanElement[] = [...plan.elements];

        const groups: (number | string)[] = [];
        const seenGroups = new Set<string>();

        for (const el of elements) {
          const key = el.groupId ? `group-${el.groupId}` : `nogroup-${el.id}`;
          if (!seenGroups.has(key)) {
            groups.push(el.groupId ?? `nogroup-${el.id}`);
            seenGroups.add(key);
          }
        }

        const index = groups.findIndex((g) => String(g) === String(groupId));
        if (index === -1) return plan;

        const targetIndex = direction === "up" ? index - 1 : index + 1;
        if (targetIndex < 0 || targetIndex >= groups.length) return plan;

        const newGroups = [...groups];
        [newGroups[index], newGroups[targetIndex]] = [
          newGroups[targetIndex],
          newGroups[index],
        ];

        const reordered = [...elements].sort((a, b) => {
          const aKey = a.groupId ?? `nogroup-${a.id}`;
          const bKey = b.groupId ?? `nogroup-${b.id}`;
          return newGroups.indexOf(aKey) - newGroups.indexOf(bKey);
        });

        const newGroupIndex = newGroups.findIndex(
          (g) => String(g) === String(groupId),
        );
        const newPage = Math.floor(newGroupIndex / itemsPerPage) + 1;
        setCurrentPage(newPage);

        return { ...plan, elements: reordered };
      }),
    );
  };

  const handleHoldStart = (direction: "up" | "down") => {
    if (!selectedId || !masterPlans[0]?.elements) return;
    let currentDelay = startDelay;

    const performMove = () => {
      if (editMode === "group") {
        const selectedElement = masterPlans[0].elements.find(
          (el) => String(el.id) === selectedId,
        );
        const groupId = selectedElement?.groupId
          ? String(selectedElement.groupId)
          : String(selectedElement?.id ?? "");
        moveGroup(String(masterPlans[0]?.id), groupId, direction);
      } else {
        moveElement(
          String(masterPlans[0]?.id),
          selectedId,
          direction,
          isKeepSeparate,
        );
      }

      currentDelay = Math.max(minDelay, currentDelay - acceleration);
      const next = setTimeout(performMove, currentDelay);
      setHoldInterval(next);
    };

    performMove();
  };

  const handleHoldEnd = () => {
    if (holdInterval) {
      clearTimeout(holdInterval);
      setHoldInterval(null);
    }
  };

  // --- PRODUCT LIST ---
  const fetchProductsForThisMasterPlan = async () => {
    const planId = masterPlans?.[0]?.id;
    if (!apiUrl || !token || !planId) {
      setProductList([]);
      return;
    }

    setIsProductListLoading(true);

    try {
      const params = new URLSearchParams();
      params.append("sortBy", "name");
      params.append("sortOrder", "asc");
      params.append("page", "1");
      params.append("pageSize", "1000");
      params.append("masterPlanIds", String(planId));

      const productsRes = await fetch(
        `${apiUrl}/product?${params.toString()}`,
        {
          headers: {
            "Content-Type": "application/json",
            "X-User-Language": localStorage.getItem("language") || "sv",
            Authorization: `Bearer ${token}`,
          },
        },
      );

      let products: ProductListItem[] = [];

      if (productsRes.ok) {
        const productsData = await productsRes.json();
        const items = Array.isArray(productsData?.items)
          ? productsData.items
          : [];

        products = items
          .filter((p: any) => !p.isHidden)
          .map((p: any) => ({
            id: Number(p.id),
            name: String(p.name ?? ""),
            kind: "product" as const,
            masterPlanFields: Array.isArray(p.masterPlanFields)
              ? p.masterPlanFields.map((f: any) => ({
                  id: Number(f.id),
                  value: f.value ?? "",
                }))
              : [],
          }));
      }

      const productFieldMap = new Map<
        number,
        { id: number; value: string | null }[]
      >(products.map((p) => [Number(p.id), p.masterPlanFields]));

      const groupAsProducts =
        await fetchProductGroupsAsProductsForThisMasterPlan(productFieldMap);

      const merged = [...products, ...groupAsProducts].sort((a, b) =>
        String(a.name ?? "").localeCompare(String(b.name ?? ""), undefined, {
          sensitivity: "base",
        }),
      );

      setProductList(merged);
    } finally {
      setIsProductListLoading(false);
    }
  };

  const filteredProductList = useMemo(() => {
    const q = productSearch.trim().toLowerCase();

    const byTab = productList.filter((p) => {
      if (productTab === "products") return p.kind === "product";
      if (productTab === "product-groups") return p.kind === "product-group";
      return true;
    });

    if (!q) return byTab;

    return byTab.filter((p) =>
      String(p.name ?? "")
        .toLowerCase()
        .includes(q),
    );
  }, [productList, productSearch, productTab]);

  // --- PRODUCT GROUPS ---
  const fetchProductGroupsAsProductsForThisMasterPlan = async (
    productFieldMap: Map<number, { id: number; value: string | null }[]>,
  ): Promise<ProductListItem[]> => {
    const planId = masterPlans?.[0]?.id;
    if (!apiUrl || !token || !planId) {
      return [];
    }

    const params = new URLSearchParams();
    params.append("sortBy", "name");
    params.append("sortOrder", "asc");
    params.append("page", "1");
    params.append("pageSize", "1000");
    params.append("masterPlanIds", String(planId));
    params.append("isHidden", "false");

    const res = await fetch(`${apiUrl}/product-group?${params.toString()}`, {
      headers: {
        "Content-Type": "application/json",
        "X-User-Language": localStorage.getItem("language") || "sv",
        Authorization: `Bearer ${token}`,
      },
    });

    if (!res.ok) {
      return [];
    }

    const data = await res.json();
    const items: ProductGroupListItemDto[] = Array.isArray(data?.items)
      ? data.items
      : [];
    const visible = items.filter((x) => !x.isHidden);

    const detailResults = await Promise.all(
      visible.map(async (g) => {
        const r = await fetch(`${apiUrl}/product-group/fetch/${g.id}`, {
          headers: {
            "Content-Type": "application/json",
            "X-User-Language": localStorage.getItem("language") || "sv",
            Authorization: `Bearer ${token}`,
          },
        });

        if (!r.ok) {
          return null;
        }

        const d: ProductGroupFetchDto = await r.json();
        if (d.isHidden) {
          return null;
        }

        const products = Array.isArray(d.products) ? d.products : [];

        const productIdsInGroup = products
          .map((p) => Number(p.id))
          .filter((id) => Number.isFinite(id));

        const missingIds = productIdsInGroup.filter(
          (id) => !productFieldMap.has(id),
        );

        if (missingIds.length > 0) {
          const params = new URLSearchParams();
          for (const id of missingIds) {
            params.append("productIds", String(id));
          }

          const fvRes = await fetch(
            `${apiUrl}/product/field-values?${params.toString()}`,
            {
              headers: {
                "Content-Type": "application/json",
                "X-User-Language": localStorage.getItem("language") || "sv",
                Authorization: `Bearer ${token}`,
              },
            },
          );

          if (fvRes.ok) {
            const fvData = await fvRes.json();
            const byProduct = fvData?.byProduct ?? {};

            for (const [pidStr, fields] of Object.entries(byProduct)) {
              const pid = Number(pidStr);
              const arr = Array.isArray(fields)
                ? fields.map((f: any) => ({
                    id: Number(f.id),
                    value: f.value ?? "",
                  }))
                : [];
              productFieldMap.set(pid, arr);
            }
          }
        }

        const overridesByProduct = new Map<number, Map<number, string>>();
        for (const fv of Array.isArray(d.productGroupFieldValues)
          ? d.productGroupFieldValues
          : []) {
          const productId = Number(fv.productId);
          const fieldId = Number(fv.masterPlanFieldId);
          const value = String(fv.value ?? "");

          if (!overridesByProduct.has(productId)) {
            overridesByProduct.set(productId, new Map<number, string>());
          }

          overridesByProduct.get(productId)!.set(fieldId, value);
        }

        const rows = products
          .map((p) => {
            const productId = Number(p.id);

            const base =
              productFieldMap.get(productId) ??
              fieldOptions.map((f) => ({ id: f.id, value: "" }));

            const overrides =
              overridesByProduct.get(productId) ?? new Map<number, string>();

            const mergedMap = new Map<number, string | null>();
            for (const bf of base) mergedMap.set(Number(bf.id), bf.value ?? "");

            for (const [fieldId, val] of overrides.entries()) {
              mergedMap.set(Number(fieldId), val);
            }

            const mergedFields = Array.from(mergedMap.entries())
              .map(([id, value]) => ({ id, value }))
              .sort((a, b) => a.id - b.id);

            return {
              id: `pg-${d.id}-${productId}`,
              name: String(p.name ?? `#${productId}`),
              masterPlanFields: mergedFields,
            };
          })
          .filter((x): x is NonNullable<typeof x> => !!x);

        if (rows.length === 0) {
          return null;
        }

        const groupItem: ProductListItem = {
          id: `pg-${d.id}`,
          name: d.name,
          kind: "product-group",
          masterPlanFields: [],
          rows,
        };

        return groupItem;
      }),
    );

    return detailResults.filter((x): x is ProductListItem => !!x);
  };

  // --- HELPERS ---
  const openProductList = async () => {
    // setProductTab("all");
    setIsProductListOpen(true);
    await fetchProductsForThisMasterPlan();
  };

  const closeProductList = () => {
    setProductSearch("");
    setIsProductListOpen(false);
  };

  const normalizedSearch = useMemo(
    () => searchTerm.trim().toLowerCase(),
    [searchTerm],
  );

  useEffect(() => {
    setCurrentPage(1);
  }, [normalizedSearch, statusFilters]);

  const allElements = masterPlans[0]?.elements ?? [];

  const elements = useMemo(() => {
    let result = allElements;

    if (statusFilters.length > 0) {
      const set = new Set(statusFilters);
      result = result.filter((el) =>
        set.has((el.status ?? "NotStarted") as MasterPlanElementStatus),
      );
    }

    if (normalizedSearch) {
      result = result.filter((el) => {
        const statusText = String(el.status ?? "").toLowerCase();
        const valuesText = (el.values ?? [])
          .map((v) => String(v.value ?? ""))
          .join(" ")
          .toLowerCase();

        return `${statusText} ${valuesText}`.includes(normalizedSearch);
      });
    }

    return result;
  }, [allElements, normalizedSearch, statusFilters]);

  const statusCounts = useMemo(() => {
    let base = allElements;

    if (normalizedSearch) {
      base = base.filter((el) => {
        const statusText = String(el.status ?? "").toLowerCase();
        const valuesText = (el.values ?? [])
          .map((v) => String(v.value ?? ""))
          .join(" ")
          .toLowerCase();

        return `${statusText} ${valuesText}`.includes(normalizedSearch);
      });
    }

    const counts = {
      all: base.length,
      notStarted: 0,
      inProgress: 0,
      finished: 0,
    };

    for (const el of base) {
      const s = (el.status ?? "NotStarted") as MasterPlanElementStatus;
      if (s === "NotStarted") counts.notStarted++;
      if (s === "InProgress") counts.inProgress++;
      if (s === "Finished") counts.finished++;
    }

    return counts;
  }, [allElements, normalizedSearch]);

  const filters = useMemo(() => {
    return [
      {
        label: t("status.status", { capitalize: true }),
        breakpoint: "2xs",
        options: [
          {
            label: t("MasterPlan/Not started"),
            isSelected: statusFilters.includes("NotStarted"),
            setSelected: (val: boolean) => {
              setStatusFilters((prev) => {
                const has = prev.includes("NotStarted");
                if (val) return has ? prev : [...prev, "NotStarted"];
                return has ? prev.filter((x) => x !== "NotStarted") : prev;
              });
            },
            count: statusCounts.notStarted,
          },
          {
            label: t("MasterPlan/In progress"),
            isSelected: statusFilters.includes("InProgress"),
            setSelected: (val: boolean) => {
              setStatusFilters((prev) => {
                const has = prev.includes("InProgress");
                if (val) return has ? prev : [...prev, "InProgress"];
                return has ? prev.filter((x) => x !== "InProgress") : prev;
              });
            },
            count: statusCounts.inProgress,
          },
          {
            label: t("MasterPlan/Finished"),
            isSelected: statusFilters.includes("Finished"),
            setSelected: (val: boolean) => {
              setStatusFilters((prev) => {
                const has = prev.includes("Finished");
                if (val) return has ? prev : [...prev, "Finished"];
                return has ? prev.filter((x) => x !== "Finished") : prev;
              });
            },
            count: statusCounts.finished,
          },
        ],
      },
    ];
  }, [statusFilters, statusCounts, t]);

  const filterChips = useMemo(() => {
    return (
      filters.flatMap((group) =>
        group.options
          .filter((opt) => opt.isSelected)
          .map((opt) => ({
            label: opt.label,
            onClear: () => opt.setSelected(false),
          })),
      ) ?? []
    );
  }, [filters]);

  const clearFilters = () => {
    filters.forEach((group) =>
      group.options.forEach((opt) => opt.setSelected(false)),
    );
  };

  // --- Undo/Redo ---
  const cloneValue = <T>(v: T): T => {
    const sc = (globalThis as any).structuredClone;
    if (typeof sc === "function") return sc(v);
    return JSON.parse(JSON.stringify(v));
  };

  const makeSnapshot = (): HistorySnapshot => ({
    masterPlans: cloneValue(masterPlans),
    removedElementIds: cloneValue(removedElementIds),
    selectedId,
    editMode,
    isKeepSeparate,
    currentPage,
  });

  const resetHistory = () => {
    undoStackRef.current = [];
    redoStackRef.current = [];
    setHistoryTick((x) => x + 1);
  };

  const pushHistory = () => {
    undoStackRef.current.push(makeSnapshot());
    if (undoStackRef.current.length > 50) undoStackRef.current.shift();
    redoStackRef.current = [];
    setHistoryTick((x) => x + 1);
  };

  const undo = () => {
    const prev = undoStackRef.current.pop();
    if (!prev) return;

    redoStackRef.current.push(makeSnapshot());

    setMasterPlans(prev.masterPlans);
    setRemovedElementIds(prev.removedElementIds);
    setSelectedId(prev.selectedId);
    setEditMode(prev.editMode);
    setIsKeepSeparate(prev.isKeepSeparate);
    setCurrentPage(prev.currentPage);

    setHistoryTick((x) => x + 1);
  };

  const redo = () => {
    const next = redoStackRef.current.pop();
    if (!next) return;

    undoStackRef.current.push(makeSnapshot());

    setMasterPlans(next.masterPlans);
    setRemovedElementIds(next.removedElementIds);
    setSelectedId(next.selectedId);
    setEditMode(next.editMode);
    setIsKeepSeparate(next.isKeepSeparate);
    setCurrentPage(next.currentPage);

    setHistoryTick((x) => x + 1);
  };

  const canUndo = undoStackRef.current.length > 0;
  const canRedo = redoStackRef.current.length > 0;

  const groups: MasterPlanElement[][] = [];
  const seenGroups = new Set<string>();

  for (const el of elements) {
    const key = el.groupId ? `group-${el.groupId}` : `nogroup-${el.id}`;
    if (!seenGroups.has(key)) {
      const group = elements.filter((e) =>
        el.groupId ? e.groupId === el.groupId : e.id === el.id,
      );
      groups.push(group);
      seenGroups.add(key);
    }
  }
  const groupedElements = groups;

  const startGroupIndex = (currentPage - 1) * itemsPerPage;
  const visibleGroups = groupedElements.slice(
    startGroupIndex,
    startGroupIndex + itemsPerPage,
  );

  const visibleElements = visibleGroups.flat();

  const totalGroups = groupedElements.length;
  const totalPages = Math.max(1, Math.ceil(totalGroups / itemsPerPage));

  const incrementalValueMap = useMemo(() => {
    const incFields = fieldOptions.filter(
      (f) => !f.isHidden && (!!f.localIncremental || !!f.globalIncremental),
    );

    if (incFields.length === 0) return new Map<string, string>();

    const base = elements.filter((el) => !removedElementIds.includes(el.id));
    const map = new Map<string, string>();

    const getStored = (el: MasterPlanElement, fieldId: number) => {
      const raw =
        el.values?.find((v) => v.masterPlanFieldId === fieldId)?.value ?? "";
      return String(raw ?? "").trim();
    };

    const toInt = (s: string) => {
      const n = Number(String(s).trim());
      return Number.isFinite(n) ? n : null;
    };

    for (const f of incFields) {
      if (f.globalIncremental) {
        let maxExisting = 0;
        const needsNumber: MasterPlanElement[] = [];

        for (const el of base) {
          const stored = getStored(el, f.id);
          if (stored !== "") {
            map.set(`${el.id}:${f.id}`, stored);
            const n = toInt(stored);
            if (n != null) maxExisting = Math.max(maxExisting, n);
          } else {
            needsNumber.push(el);
          }
        }

        let n = maxExisting + 1;
        for (const el of needsNumber) {
          map.set(`${el.id}:${f.id}`, String(n));
          n++;
        }
      }

      if (f.localIncremental) {
        const byGroup = new Map<string, MasterPlanElement[]>();

        for (const el of base) {
          const k =
            el.groupId && el.groupId !== 0
              ? String(el.groupId)
              : `nogroup-${el.id}`;
          const arr = byGroup.get(k);
          if (arr) arr.push(el);
          else byGroup.set(k, [el]);
        }

        let maxExisting = 0;

        const groupStored = new Map<string, string>();

        for (const [gk, els] of byGroup) {
          const firstNonEmpty = els
            .map((el) => getStored(el, f.id))
            .find((s) => s !== "");

          if (firstNonEmpty) {
            groupStored.set(gk, firstNonEmpty);
            const n = toInt(firstNonEmpty);
            if (n != null) maxExisting = Math.max(maxExisting, n);
          }
        }

        let next = maxExisting + 1;

        for (const [gk, els] of byGroup) {
          const value = groupStored.get(gk) ?? String(next++);
          for (const el of els) {
            map.set(`${el.id}:${f.id}`, value);
          }
        }
      }
    }

    return map;
  }, [elements, fieldOptions, removedElementIds]);

  const createIncrementalAllocator = (planElements: MasterPlanElement[]) => {
    const base = planElements;

    const incFields = fieldOptions.filter(
      (f) => !f.isHidden && (!!f.localIncremental || !!f.globalIncremental),
    );

    const getStored = (el: MasterPlanElement, fieldId: number) => {
      const raw =
        el.values?.find((v) => v.masterPlanFieldId === fieldId)?.value ?? "";
      return String(raw ?? "").trim();
    };

    const toInt = (s: string) => {
      const n = Number(String(s).trim());
      if (!Number.isFinite(n)) return null;
      const i = Math.floor(n);
      return i >= 0 ? i : null;
    };

    const globalNext = new Map<number, number>();
    const localValueByGroup = new Map<string, number>();
    const localNextByField = new Map<number, number>();

    for (const f of incFields) {
      if (f.globalIncremental) {
        let max = 0;

        for (const el of base) {
          const parsed = toInt(getStored(el, f.id));
          if (parsed != null) max = Math.max(max, parsed);
        }

        globalNext.set(f.id, max + 1);
      }

      if (f.localIncremental) {
        const byGroup = new Map<string, MasterPlanElement[]>();

        for (const el of base) {
          const k =
            el.groupId && el.groupId !== 0
              ? String(el.groupId)
              : `nogroup-${el.id}`;
          const arr = byGroup.get(k);
          if (arr) arr.push(el);
          else byGroup.set(k, [el]);
        }

        let max = 0;

        for (const [gk, els] of byGroup) {
          const firstNonEmpty = els
            .map((el) => getStored(el, f.id))
            .find((s) => s !== "");

          const parsed = firstNonEmpty ? toInt(firstNonEmpty) : null;
          if (parsed != null) {
            localValueByGroup.set(`${f.id}:${gk}`, parsed);
            max = Math.max(max, parsed);
          }
        }

        localNextByField.set(f.id, max + 1);
      }
    }

    return (fieldId: number, groupId: number | null, fallbackKey?: string) => {
      const fo = fieldOptions.find((x) => x.id === fieldId);
      if (!fo) return "";

      if (fo.globalIncremental) {
        const next = globalNext.get(fieldId) ?? 1;
        globalNext.set(fieldId, next + 1);
        return String(next);
      }

      if (fo.localIncremental) {
        const gk =
          groupId && groupId !== 0
            ? String(groupId)
            : fallbackKey
              ? `nogroup-${fallbackKey}`
              : "nogroup";

        const key = `${fieldId}:${gk}`;
        const existing = localValueByGroup.get(key);
        if (existing != null) return String(existing);

        const next = localNextByField.get(fieldId) ?? 1;
        localNextByField.set(fieldId, next + 1);
        localValueByGroup.set(key, next);
        return String(next);
      }

      return "";
    };
  };

  const getDisplayValue = (el: any, f: any) => {
    const isIncremental = !!f.localIncremental || !!f.globalIncremental;

    if (isIncremental) {
      const computed = incrementalValueMap.get(`${el.id}:${f.id}`);
      if (computed != null) return computed;
    }

    const stored =
      el.values?.find((v: any) => v.masterPlanFieldId === f.id)?.value ?? "";

    return stored;
  };

  const requestRefetch = () => setRefetchTick((x) => x + 1);

  const isBootstrapping = firstFetch;

  const canShowInvalid = !isBootstrapping && isInvalid;
  const canShowLock = !isBootstrapping && !isInvalid && isHidden;
  const isReady = !isBootstrapping && !isInvalid && !isHidden;

  return {
    isBootstrapping,
    canShowInvalid,
    canShowLock,
    isReady,
    setIsCheckingOut,
    setIsCheckingIn,
    isCheckingOut,
    isCheckingIn,
    isLoading,
    isManualRefresh,
    requestRefetch,
    refetchTick,
    masterPlans,
    fieldOptions,
    selectedFields,
    showHidden,
    sortBy,
    sortOrder,
    hasSearched,
    totalItems,
    totalGroups,
    currentPage,
    itemsPerPage,
    isEditing,
    groupCounter,
    isStrikeMode,
    setShowHidden,
    setIsExpanded,
    setCurrentPage,
    setItemsPerPage,
    setIsEditing,
    setIsManualRefresh,
    setGroupCounter,
    setIsStrikeMode,
    checkedOutBy,
    checkedOutByMe,
    handleSearch,
    handleReset,
    handleAddElement,
    handleAddFromProductListItem,
    handleCellChange,
    toggleStrikeThrough,
    handleSave,
    handleAbortChanges,
    handleCheck,
    moveElement,
    moveGroup,
    toggleRemoveElement,
    clearRemovedElements,
    visibleElements,
    totalPages,
    removedElementIds,
    dragControls,
    constraintsRef,
    isSelectedStruck,
    selectedElement,
    editMode,
    setEditMode,
    isKeepSeparate,
    setIsKeepSeparate,
    showForceColor,
    selectedId,
    setSelectedId,
    isExpanded,
    handleHoldStart,
    handleHoldEnd,
    duplicateSelected,
    handleImport,
    importing,
    setImporting,
    handleExport,
    exporting,
    setExporting,
    revisions,
    selectedRevisionId,
    isViewingRevision,
    selectRevision,
    getStatusBadge,
    updateStatus, // TEMP!
    searchTerm,
    setSearchTerm,
    statusFilters,
    setStatusFilters,
    statusCounts,
    filters,
    filterChips,
    clearFilters,
    filterAllOpen,
    setFilterAllOpen,
    productList,
    isProductListOpen,
    setIsProductListOpen,
    isProductListLoading,
    openProductList,
    closeProductList,
    fetchProductsForThisMasterPlan,
    productSearch,
    setProductSearch,
    filteredProductList,
    productTab,
    setProductTab,
    undo,
    redo,
    canUndo,
    canRedo,
    getDisplayValue,
  };
};
