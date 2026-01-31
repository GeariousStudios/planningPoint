"use client";

import { useToast } from "../../../../components/toast/ToastProvider";
import useManage from "@/app/hooks/useManage";
import { MasterPlanFilters, MasterPlanItem } from "@/app/types/manageTypes"; // <-- Unique.
import {
  deleteContent,
  fetchContent,
  fetchUnits,
  fetchUnitGroups,
  fetchMasterPlanFields,
  fetchProducts,
  fetchPlannedStops,
  fetchMasterPlanProducts,
  fetchMasterPlanPlannedStops,
  UnitOption,
  UnitGroupOption,
  MasterPlanFieldOption,
  MasterPlanProductOption,
  MasterPlanPlannedStopOption,
  ProductOption,
  PlannedStopOption,
} from "@/app/apis/manage/masterPlansApi"; // <-- Unique.
import ManageBase from "@/app/components/manage/ManageBase";
import MasterPlanModal from "@/app/components/modals/admin/plan/MasterPlanModal"; // <-- Unique.
import DeleteModal from "@/app/components/modals/DeleteModal";
import { badgeClass } from "@/app/components/manage/ManageClasses";
import { useEffect, useRef, useState } from "react";
import { utcIsoToLocalDateTime } from "@/app/helpers/timeUtils";
import useTN from "@/app/hooks/useTN";
import useTheme from "@/app/hooks/useTheme";
import { useHandbook } from "@/app/context/HandbookContext";
import MenuDropdown from "@/app/components/common/MenuDropdown/MenuDropdown";
import CustomTooltip from "@/app/components/common/CustomTooltip";

type Props = {
  isConnected: boolean | null;
};

const MasterPlansClient = (props: Props) => {
  const t = useTN();

  // <-- Unique.
  // --- VARIABLES ---
  const {
    // --- Items ---
    items,
    setItems,
    selectedItems,
    setSelectedItems,

    editingItemId,
    setEditingItemId,
    isEditModalOpen,
    setIsEditModalOpen,

    deletingItemIds,
    setDeletingItemIds,
    isDeleteModalOpen,
    setIsDeleteModalOpen,

    // --- Loading ---
    isLoading,
    setIsLoading,

    // --- Pagination ---
    currentPage,
    setCurrentPage,
    itemsPerPage,
    setItemsPerPage,
    totalItems,
    setTotalItems,

    // --- Sorting ---
    sortBy,
    sortOrder,
    handleSort,

    // --- Search & Filtering ---
    searchTerm,
    setSearchTerm,
    filters,
    setFilters,
    counts,
    setCounts,
    isGrid,
    setIsGrid,

    // --- Other ---
    fetchItems,
  } = useManage<MasterPlanItem, MasterPlanFilters>(
    async (params) => {
      // <-- Unique.
      try {
        const result = await fetchContent(params);
        return {
          items: result.items,
          total: result.total,
          counts: result.counts,
        };
      } catch (err: any) {
        notify(
          "error",
          err.message ||
            t("Manage/Failed to fetch") +
              t("entities.masterPlan", { capitalize: true, plural: true }),
        ); // <-- Unique.
        return {
          items: [],
          total: 0,
          counts: {},
        };
      } finally {
        setIsLoading(false);
      }
    },
    { initialSortBy: "name", initialSortOrder: "asc" },
  );

  const { notify } = useToast();

  // --- FETCH UNITS, UNIT GROUPS, MASTER PLAN FIELDS, PRODUCTS & PLANNED STOPS INITIALIZATION (Unique) ---
  const [unitGroups, setUnitGroups] = useState<UnitGroupOption[]>([]);
  const [units, setUnits] = useState<UnitOption[]>([]);
  const [masterPlanFields, setMasterPlanFields] = useState<
    MasterPlanFieldOption[]
  >([]);
  const [products, setProducts] = useState<ProductOption[]>([]);
  const [plannedStops, setPlannedStops] = useState<PlannedStopOption[]>([]);
  const listTriggerRef = useRef<HTMLElement | null>(null);
  const [isListOpen, setIsListOpen] = useState(false);
  const [listTitle, setListTitle] = useState("");
  const [listItems, setListItems] = useState<{ id: number; name: string }[]>(
    [],
  );

  useEffect(() => {
    fetchUnitGroups()
      .then(setUnitGroups)
      .catch((err) => notify("error", t("Modal/Unknown error")));

    fetchUnits()
      .then(setUnits)
      .catch(() => notify("error", t("Modal/Unknown error")));

    fetchMasterPlanFields()
      .then(setMasterPlanFields)
      .catch(() => notify("error", t("Modal/Unknown error")));

    fetchProducts()
      .then(setProducts)
      .catch(() => notify("error", t("Modal/Unknown error")));

    fetchPlannedStops()
      .then(setPlannedStops)
      .catch(() => notify("error", t("Modal/Unknown error")));
  }, []);

  // --- HELPER --- (Unique)
  const closeList = () => {
    setIsListOpen(false);
  };

  const openProducts = async (
    e: React.MouseEvent<HTMLElement>,
    item: MasterPlanItem,
  ) => {
    listTriggerRef.current = e.currentTarget as HTMLElement;
    setListTitle(
      `${t("entities.product", { capitalize: true, plural: true })} - ${item.name}`,
    );
    setListItems([]);
    setIsListOpen(true);

    const rows: MasterPlanProductOption[] = await fetchMasterPlanProducts(
      item.id,
    );
    setListItems(rows);
  };

  const openPlannedStops = async (
    e: React.MouseEvent<HTMLElement>,
    item: MasterPlanItem,
  ) => {
    listTriggerRef.current = e.currentTarget as HTMLElement;
    setListTitle(
      `${t("entities.plannedStop", { capitalize: true, plural: true })} - ${item.name}`,
    );
    setListItems([]);
    setIsListOpen(true);

    const rows: MasterPlanPlannedStopOption[] =
      await fetchMasterPlanPlannedStops(item.id);
    setListItems(rows);
  };

  // --- TOGGLE MODAL(S) ---
  // --- Delete ---
  const toggleDeleteItemModal = (itemIds: number[] = []) => {
    setDeletingItemIds(itemIds);
    setIsDeleteModalOpen((prev) => !prev);
  };

  // --- Edit ---
  const toggleEditItemModal = (itemId: number | null = null) => {
    setEditingItemId(itemId);
    setIsEditModalOpen((prev) => !prev);
  };

  // --- Delete item(s)
  const finishDeleteContent = async (id: number) => {
    try {
      await deleteContent(id);
      await fetchItems();
      window.dispatchEvent(new Event("master-plan-list-updated"));
      notify(
        "success",
        t("entities.masterPlan", { capitalize: true }) + t("Manage/deleted1"),
        4000,
      ); // <-- Unique.
    } catch (err: any) {
      notify("error", err?.message || t("Modal/Unknown error"));
    }
  };

  // --- Theme ---
  const { currentTheme } = useTheme();

  // --- Grid Items (Unique) ---
  const gridItems = () => [
    {
      key: "name, units, isHidden, fields, unitGroupName, allowRemovingElements, allowImport",
      getValue: (item: MasterPlanItem) => (
        <div className="flex flex-col gap-4 rounded-2xl bg-(--bg-grid-header) p-4">
          <div className="flex flex-col">
            <div className="flex items-center gap-4 text-2xl font-bold">
              <span className="flex items-center">{item.name}</span>
            </div>
          </div>
          <div className="flex flex-wrap gap-2">
            <span className="w-full font-semibold">
              {t("entities.product", { capitalize: true, plural: true })}:
            </span>
            <CustomTooltip content={t("MasterPlans/Click to view products")}>
              <button
                type="button"
                className="-mt-2 underline transition-colors duration-(--fast) hover:text-(--accent-color)"
                onMouseEnter={(e) => e.stopPropagation()}
                onClick={(e) => {
                  e.stopPropagation();
                  openProducts(e, item);
                }}
              >
                {item.productCount ?? 0}
              </button>
            </CustomTooltip>
          </div>

          <div className="flex flex-wrap gap-2">
            <span className="w-full font-semibold">
              {t("entities.plannedStop", { capitalize: true, plural: true })}:
            </span>
            <CustomTooltip
              content={t("MasterPlans/Click to view planned stops")}
            >
              <button
                type="button"
                className="-mt-2 underline transition-colors duration-(--fast) hover:text-(--accent-color)"
                onMouseEnter={(e) => e.stopPropagation()}
                onClick={(e) => {
                  e.stopPropagation();
                  openPlannedStops(e, item);
                }}
              >
                {item.plannedStopCount ?? 0}
              </button>
            </CustomTooltip>
          </div>
          <div className="flex flex-wrap gap-2">
            <span className="w-full font-semibold">
              {t("entities.masterPlanField", {
                capitalize: true,
                plural: true,
              })}
              :
            </span>
            <>
              {item.fields.length === 0 ? (
                <span className="-mt-2">-</span>
              ) : (
                item.fields.map((field, i) => (
                  <span
                    key={i}
                    className={`${badgeClass} bg-(--badge-main) text-(--text-main-reverse)`}
                  >
                    {field.name}
                  </span>
                ))
              )}
            </>
          </div>
          <div className="flex flex-wrap gap-2">
            <span className="w-full font-semibold">
              {t("Manage/Used by units")}:
            </span>
            {item.units.length === 0 ? (
              <span className="-mt-2">-</span>
            ) : (
              (item.units ?? []).map((unit, i) => {
                const label = unit.name;
                const matchingUnit = units.find((u) => u.name === label);

                return (
                  <span
                    key={i}
                    className={badgeClass}
                    style={
                      matchingUnit?.reverseColor
                        ? {
                            boxShadow: `inset 0 0 0 1px ${
                              currentTheme === "dark"
                                ? matchingUnit?.darkColorHex
                                : matchingUnit?.lightColorHex
                            }`,
                            backgroundColor: "transparent",
                            color: "var(--text-main)",
                          }
                        : {
                            backgroundColor:
                              currentTheme === "dark"
                                ? matchingUnit?.darkColorHex
                                : matchingUnit?.lightColorHex,
                            color:
                              currentTheme === "dark"
                                ? matchingUnit?.darkTextColorHex
                                : matchingUnit?.lightTextColorHex,
                          }
                    }
                  >
                    {label}
                  </span>
                );
              })
            )}
          </div>
          <div className="flex flex-wrap gap-2">
            <span className="w-full font-semibold">
              {t("Manage/Used by operational plans")}:
            </span>
            {item.operationalPlans.length === 0 ? (
              <span className="-mt-2">-</span>
            ) : (
              (item.operationalPlans ?? []).map((plan, i) => {
                const label = plan.name;

                return (
                  <span
                    key={i}
                    className={`${badgeClass} bg-(--badge-main) text-(--text-main-reverse)`}
                  >
                    {label}
                  </span>
                );
              })
            )}
          </div>
          <div className="flex flex-wrap gap-2">
            <span className="w-full font-semibold">
              {t("MasterPlans/Allow removing elements")}:
            </span>
            <span
              className={`${badgeClass} ${!item.allowRemovingElements ? "bg-(--locked)" : "bg-(--unlocked)"} text-(--text-main-reverse)`}
            >
              {item.allowRemovingElements
                ? t("Manage/Allowed")
                : t("Manage/Disallowed")}
            </span>
          </div>
          <div className="flex flex-wrap gap-2">
            <span className="w-full font-semibold">
              {t("MasterPlans/Allow import")}:
            </span>
            <span
              className={`${badgeClass} ${!item.allowImport ? "bg-(--locked)" : "bg-(--unlocked)"} text-(--text-main-reverse)`}
            >
              {item.allowImport ? t("Manage/Allowed") : t("Manage/Disallowed")}
            </span>
          </div>
          <div className="flex flex-wrap gap-2">
            <span className="w-full font-semibold">
              {t("Units/Belongs to group")}:
            </span>
            <span className="-mt-2">{item.unitGroupName}</span>
          </div>
          <div className="flex flex-wrap gap-2">
            <span className="w-full font-semibold">
              {t("status.status", { capitalize: true })}:
            </span>
            <span
              className={`${badgeClass} ${item.isHidden ? "bg-(--locked)" : "bg-(--unlocked)"} text-(--text-main-reverse)`}
            >
              {item.isHidden ? t("Manage/Hidden") : t("Manage/Visible")}
            </span>
          </div>
        </div>
      ),
    },
    {
      key: "creationDate, createdBy",
      getValue: (item: MasterPlanItem) => (
        <p className="flex flex-col">
          <span className="font-semibold">
            {t("status.created", { capitalize: true }) + ":"}
          </span>
          {utcIsoToLocalDateTime(item.creationDate)} {t("common.by")}{" "}
          {item.createdBy}
        </p>
      ),
    },
    {
      key: "updateDate, updatedBy",
      getValue: (item: MasterPlanItem) => (
        <p className="flex flex-col">
          <span className="font-semibold">
            {t("status.updated", { capitalize: true }) + ":"}
          </span>
          {utcIsoToLocalDateTime(item.updateDate)} {t("common.by")}{" "}
          {item.updatedBy}
        </p>
      ),
    },
  ];

  // --- Table Items (Unique) ---
  const tableItems = () => [
    {
      key: "name",
      label: t("common.name", { capitalize: true }),
      sortingItem: "name",
      labelAsc: t("common.name") + " Ö-A",
      labelDesc: t("common.name") + " A-Ö",
      getValue: (item: MasterPlanItem) => (
        <div className="flex items-center gap-4">{item.name}</div>
      ),
      responsivePriority: 0,
    },
    {
      key: "productCount",
      label: t("entities.product", { capitalize: true, plural: true }),
      sortingItem: "productcount",
      labelAsc: t("entities.product", "p") + " " + t("Manage/ascending"),
      labelDesc: t("entities.product", "p") + " " + t("Manage/descending"),
      classNameAddition: "w-[140px] min-w-[140px]",
      childClassNameAddition: "w-fit",
      getValue: (item: MasterPlanItem) => (
        <CustomTooltip content={t("MasterPlans/Click to view products")}>
          <button
            type="button"
            className="underline transition-colors duration-(--fast) hover:text-(--accent-color)"
            onMouseEnter={(e) => {
              e.stopPropagation();
            }}
            onClick={(e) => {
              e.stopPropagation();

              openProducts(e, item);
            }}
          >
            {item.productCount ?? 0}
          </button>
        </CustomTooltip>
      ),
      responsivePriority: 2,
    },
    {
      key: "plannedStopCount",
      label: t("entities.plannedStop", { capitalize: true, plural: true }),
      sortingItem: "plannedstopcount",
      labelAsc: t("entities.plannedStop", "p") + " " + t("Manage/ascending"),
      labelDesc: t("entities.plannedStop", "p") + " " + t("Manage/descending"),
      classNameAddition: "w-[160px] min-w-[160px]",
      childClassNameAddition: "w-fit",
      getValue: (item: MasterPlanItem) => (
        <CustomTooltip content={t("MasterPlans/Click to view planned stops")}>
          <button
            type="button"
            className="underline transition-colors duration-(--fast) hover:text-(--accent-color)"
            onMouseEnter={(e) => {
              e.stopPropagation();
            }}
            onClick={(e) => {
              e.stopPropagation();

              openPlannedStops(e, item);
            }}
          >
            {item.plannedStopCount ?? 0}
          </button>
        </CustomTooltip>
      ),
      responsivePriority: 3,
    },
    {
      key: "fields",
      label: t("entities.masterPlanField", { capitalize: true, plural: true }),
      sortingItem: "fieldcount",
      labelAsc:
        t("MasterPlans/master plan field amount") + t("Manage/ascending"),
      labelDesc:
        t("MasterPlans/master plan field amount") + t("Manage/descending"),
      getValue: (item: MasterPlanItem) => (
        <div className="flex flex-wrap gap-2">
          {item.fields.map((field, i) => (
            <span
              key={i}
              className={`${badgeClass} bg-(--badge-main) text-(--text-main-reverse)`}
            >
              {field.name}
            </span>
          ))}
        </div>
      ),
      responsivePriority: 4,
    },
    {
      key: "units",
      label: t("Manage/Used by units"),
      sortingItem: "unitcount",
      labelAsc: t("Manage/unit amount") + t("Manage/ascending"),
      labelDesc: t("Manage/unit amount") + t("Manage/descending"),
      getValue: (item: MasterPlanItem) => (
        <div className="flex flex-wrap gap-2">
          {(item.units ?? []).map((unit, i) => {
            const label = unit.name;
            const matchingUnit = units.find((u) => u.name === label);

            return (
              <span
                key={i}
                className={badgeClass}
                style={
                  matchingUnit?.reverseColor
                    ? {
                        boxShadow: `inset 0 0 0 1px ${
                          currentTheme === "dark"
                            ? matchingUnit?.darkColorHex
                            : matchingUnit?.lightColorHex
                        }`,
                        backgroundColor: "transparent",
                        color: "var(--text-main)",
                      }
                    : {
                        backgroundColor:
                          currentTheme === "dark"
                            ? matchingUnit?.darkColorHex
                            : matchingUnit?.lightColorHex,
                        color:
                          currentTheme === "dark"
                            ? matchingUnit?.darkTextColorHex
                            : matchingUnit?.lightTextColorHex,
                      }
                }
              >
                {label}
              </span>
            );
          })}
        </div>
      ),
      responsivePriority: 6,
    },
    {
      key: "operationalPlans",
      label: t("Manage/Used by operational plans"),
      sortingItem: "operationalplancount",
      labelAsc: t("Manage/operational plan amount") + t("Manage/ascending"),
      labelDesc: t("Manage/operational plan amount") + t("Manage/descending"),
      classNameAddition: "w-[248px] min-w-[248px]",
      getValue: (item: MasterPlanItem) => (
        <div className="flex flex-wrap gap-2">
          {(item.operationalPlans ?? []).map((plan, i) => {
            const label = plan.name;

            return (
              <span
                key={i}
                className={`${badgeClass} bg-(--badge-main) text-(--text-main-reverse)`}
              >
                {label}
              </span>
            );
          })}
        </div>
      ),
      responsivePriority: 6,
    },
    {
      key: "allowRemovingElements",
      label: t("MasterPlans/Allow removing elements"),
      sortingItem: "allowremovingelementscount",
      labelAsc: t("MasterPlans/allowed master plans"),
      labelDesc: t("MasterPlans/disallowed master plans"),
      classNameAddition: "w-[248px] min-w-[248px]",
      childClassNameAddition: "w-fit",
      getValue: (item: MasterPlanItem) => (
        <span
          className={`${badgeClass} ${item.allowRemovingElements ? "bg-(--unlocked)" : "bg-(--locked)"} w-full text-(--text-main-reverse)`}
        >
          {item.allowRemovingElements
            ? t("Manage/Allowed")
            : t("Manage/Disallowed")}
        </span>
      ),
      responsivePriority: 5,
    },
    {
      key: "allowImport",
      label: t("MasterPlans/Allow import"),
      sortingItem: "allowimportcount",
      labelAsc: t("MasterPlans/allowed master plans"),
      labelDesc: t("MasterPlans/disallowed master plans"),
      classNameAddition: "w-[216px] min-w-[216px]",
      childClassNameAddition: "w-fit",
      getValue: (item: MasterPlanItem) => (
        <span
          className={`${badgeClass} ${item.allowImport ? "bg-(--unlocked)" : "bg-(--locked)"} w-full text-(--text-main-reverse)`}
        >
          {item.allowImport ? t("Manage/Allowed") : t("Manage/Disallowed")}
        </span>
      ),
      responsivePriority: 7,
    },
    {
      key: "unitGroupName",
      label: t("Units/Belongs to group"),
      sortingItem: "unitgroupname",
      labelAsc: t("entities.group") + " Ö-A",
      labelDesc: t("entities.group") + " A-Ö",
      getValue: (item: MasterPlanItem) => item.unitGroupName,
      responsivePriority: 7,
    },
    {
      key: "isHidden",
      label: t("status.status", { capitalize: true }),
      sortingItem: "visibilitycount",
      labelAsc: t("MasterPlans/visible master plans"),
      labelDesc: t("MasterPlans/hidden master plans"),
      classNameAddition: "w-[100px] min-w-[100px]",
      childClassNameAddition: "w-fit",
      getValue: (item: MasterPlanItem) => (
        <span
          className={`${badgeClass} ${item.isHidden ? "bg-(--locked)" : "bg-(--unlocked)"} w-full text-(--text-main-reverse)`}
        >
          {item.isHidden ? t("Manage/Hidden") : t("Manage/Visible")}
        </span>
      ),
      responsivePriority: 1,
    },
  ];

  // --- Filter Controls (Unique) ---
  const filterControls = {
    showVisible: filters.isHidden === false,
    setShowVisible: (val: boolean) => {
      setFilters((prev) => ({
        ...prev,
        isHidden: val ? false : undefined,
      }));
    },

    showHidden: filters.isHidden === true,
    setShowHidden: (val: boolean) => {
      setFilters((prev) => ({
        ...prev,
        isHidden: val ? true : undefined,
      }));
    },

    showAllowedRemove: filters.allowRemovingElements === true,
    setShowAllowedRemove: (val: boolean) => {
      setFilters((prev) => ({
        ...prev,
        allowRemovingElements: val ? true : undefined,
      }));
    },

    showDisallowedRemove: filters.allowRemovingElements === false,
    setShowDisallowedRemove: (val: boolean) => {
      setFilters((prev) => ({
        ...prev,
        allowRemovingElements: val ? false : undefined,
      }));
    },

    showAllowedImport: filters.allowImport === true,
    setShowAllowedImport: (val: boolean) => {
      setFilters((prev) => ({
        ...prev,
        allowImport: val ? true : undefined,
      }));
    },

    showDisallowedImport: filters.allowImport === false,
    setShowDisallowedImport: (val: boolean) => {
      setFilters((prev) => ({
        ...prev,
        allowImport: val ? false : undefined,
      }));
    },

    selectedUnitGroups: filters.unitGroupIds ?? [],
    toggleUnitGroup: (groupId: number) => {
      setFilters((prev) => {
        const groups = new Set(prev.unitGroupIds ?? []);
        if (groups.has(groupId)) {
          groups.delete(groupId);
        } else {
          groups.add(groupId);
        }
        return { ...prev, unitGroupIds: Array.from(groups) };
      });
    },

    selectedUnits: filters.unitIds ?? [],
    setUnitSelected: (unitId: number, val: boolean) => {
      setFilters((prev) => ({
        ...prev,
        unitIds: val
          ? [...(prev.unitIds ?? []), unitId]
          : (prev.unitIds ?? []).filter((id) => id !== unitId),
      }));
    },

    selectedFields: filters.masterPlanFieldIds ?? [],
    setFieldSelected: (fieldId: number, val: boolean) => {
      setFilters((prev) => ({
        ...prev,
        masterPlanFieldIds: val
          ? [...(prev.masterPlanFieldIds ?? []), fieldId]
          : (prev.masterPlanFieldIds ?? []).filter((id) => id !== fieldId),
      }));
    },

    selectedProducts: filters.productIds ?? [],
    setProductSelected: (productId: number, val: boolean) => {
      setFilters((prev) => ({
        ...prev,
        productIds: val
          ? [...(prev.productIds ?? []), productId]
          : (prev.productIds ?? []).filter((id) => id !== productId),
      }));
    },

    selectedPlannedStops: filters.plannedStopIds ?? [],
    setPlannedStopSelected: (plannedStopId: number, val: boolean) => {
      setFilters((prev) => ({
        ...prev,
        plannedStopIds: val
          ? [...(prev.plannedStopIds ?? []), plannedStopId]
          : (prev.plannedStopIds ?? []).filter((id) => id !== plannedStopId),
      }));
    },
  };

  // --- Filter List (Unique)
  const filterList = () => [
    {
      label: t("status.status", { capitalize: true }),
      breakpoint: "ml",
      options: [
        {
          label: t("MasterPlans/Visible master plans"),
          isSelected: filterControls.showVisible,
          setSelected: filterControls.setShowVisible,
          count: counts?.visibilityCount?.["Visible"] ?? 0,
        },
        {
          label: t("MasterPlans/Hidden master plans"),
          isSelected: filterControls.showHidden,
          setSelected: filterControls.setShowHidden,
          count: counts?.visibilityCount?.["Hidden"] ?? 0,
        },
      ],
    },
    {
      label: t("entities.product", { capitalize: true, plural: true }),
      breakpoint: "lg",
      options: products.map((p) => ({
        label: p.name,
        isSelected: filterControls.selectedProducts.includes(p.id),
        setSelected: (val: boolean) =>
          filterControls.setProductSelected(p.id, val),
        count: counts?.productIdsCount?.[p.id] ?? 0,
      })),
    },
    {
      label: t("entities.plannedStop", { capitalize: true, plural: true }),
      breakpoint: "lg",
      options: plannedStops.map((ps) => ({
        label: ps.name,
        isSelected: filterControls.selectedPlannedStops.includes(ps.id),
        setSelected: (val: boolean) =>
          filterControls.setPlannedStopSelected(ps.id, val),
        count: counts?.plannedStopIdsCount?.[ps.id] ?? 0,
      })),
    },
    {
      label: t("entities.masterPlanField", { capitalize: true, plural: true }),
      breakpoint: "xl",
      options: masterPlanFields.map((field) => ({
        label: field.name,
        isSelected: filterControls.selectedFields.includes(field.id),
        setSelected: (val: boolean) =>
          filterControls.setFieldSelected(field.id, val),
        count: counts?.fieldCount?.[field.id],
      })),
    },
    {
      label: t("Manage/Used by units"),
      breakpoint: "3xl",
      options: units.map((unit) => {
        const label = unit.name;

        return {
          label,
          isSelected: filterControls.selectedUnits.includes(unit.id),
          setSelected: (val: boolean) =>
            filterControls.setUnitSelected(unit.id, val),
          // count: counts?.unitCount?.[unit.id],
          count: counts?.unitCount?.[(unit.masterPlanId ?? unit.id) as number],
        };
      }),
    },
    {
      label: t("Manage/Used by operational plans"),
      breakpoint: "3xl",
      options: units.map((unit) => {
        const label = unit.name;

        return {
          label,
          isSelected: filterControls.selectedUnits.includes(unit.id),
          setSelected: (val: boolean) =>
            filterControls.setUnitSelected(unit.id, val),
          // count: counts?.unitCount?.[unit.id],
          count: counts?.unitCount?.[(unit.masterPlanId ?? unit.id) as number],
        };
      }),
    },
    {
      label: t("MasterPlans/Allow removing elements"),
      breakpoint: "2xl",
      options: [
        {
          label: t("MasterPlans/Allowed master plans"),
          isSelected: filterControls.showAllowedRemove,
          setSelected: filterControls.setShowAllowedRemove,
          count: counts?.allowRemovingElementsCount?.["Allowed"] ?? 0,
        },
        {
          label: t("MasterPlans/Disallowed master plans"),
          isSelected: filterControls.showDisallowedRemove,
          setSelected: filterControls.setShowDisallowedRemove,
          count: counts?.allowRemovingElementsCount?.["Disallowed"] ?? 0,
        },
      ],
    },
    {
      label: t("MasterPlans/Allow import"),
      breakpoint: "4xl",
      options: [
        {
          label: t("MasterPlans/Allowed master plans"),
          isSelected: filterControls.showAllowedImport,
          setSelected: filterControls.setShowAllowedImport,
          count: counts?.allowImportCount?.["Allowed"] ?? 0,
        },
        {
          label: t("MasterPlans/Disallowed master plans"),
          isSelected: filterControls.showDisallowedImport,
          setSelected: filterControls.setShowDisallowedImport,
          count: counts?.allowImportCount?.["Disallowed"] ?? 0,
        },
      ],
    },
    {
      label: t("Units/Belongs to group"),
      breakpoint: "4xl",
      options: unitGroups.map((group) => ({
        label: group.name,
        isSelected: filterControls.selectedUnitGroups.includes(group.id),
        setSelected: (val: boolean) => {
          setFilters((prev) => ({
            ...prev,
            unitGroupIds: val
              ? [...(prev.unitGroupIds ?? []), group.id]
              : (prev.unitGroupIds ?? []).filter((id) => id !== group.id),
          }));
        },
        count: counts?.unitGroupCount?.[group.name],
      })),
    },
  ];

  // const anySelectedInUse = () => {
  //   // <-- Unique.
  //   return items.some(
  //     (item) => deletingItemIds.includes(item.id) && item.units.length > 0,
  //   );
  // };

  // --- Update handbook (Unique) ---
  const { setHandbook } = useHandbook();

  useEffect(() => {
    setHandbook("Master plans");
  }, []);

  return (
    <>
      <ManageBase<MasterPlanItem> // <-- Unique.
        itemName={t("entities.masterPlan")} // <-- Unique.
        items={items}
        selectedItems={selectedItems}
        setSelectedItems={setSelectedItems}
        toggleEditItemModal={toggleEditItemModal}
        toggleDeleteItemModal={toggleDeleteItemModal}
        isLoading={isLoading}
        isConnected={props.isConnected === true}
        selectMessage="Manage/Select1" // <-- Unique.
        editLimitMessage="Manage/Edit limit1" // <-- Unique.
        isGrid={isGrid}
        setIsGrid={setIsGrid}
        gridItems={gridItems()}
        tableItems={tableItems()}
        showCheckbox
        showInfoButton={false}
        getIsDisabled={() => false} // <-- Unique.
        pagination={{
          currentPage,
          setCurrentPage,
          itemsPerPage,
          setItemsPerPage,
          totalItems: totalItems ?? 0,
        }}
        sortBy={sortBy}
        sortOrder={sortOrder}
        onSort={handleSort}
        searchTerm={searchTerm}
        onSearchChange={(val) => setSearchTerm(val)}
        filters={filterList()}
      />

      {/* --- MODALS --- */}
      <MasterPlanModal // <-- Unique.
        isOpen={isEditModalOpen}
        onClose={toggleEditItemModal}
        itemId={editingItemId}
        onItemUpdated={() => {
          fetchItems();
          fetchMasterPlanFields().then(setMasterPlanFields);
        }}
      />

      <DeleteModal
        isOpen={isDeleteModalOpen}
        onClose={() => {
          toggleDeleteItemModal();
          setDeletingItemIds([]);
        }}
        onConfirm={async () => {
          for (const id of deletingItemIds) {
            await finishDeleteContent(id);
          }

          fetchMasterPlanFields().then(setMasterPlanFields);
          setIsDeleteModalOpen(false);
          setDeletingItemIds([]);
          setSelectedItems([]);
        }}
        confirmOnDelete // <-- Unique.
        confirmDeleteMessage={
          <>
            {t("MasterPlans/Confirm1")}
            <br />
            <br />
            {t("MasterPlans/Confirm2")}
            <br />
            <br />
            {t("MasterPlans/Confirm3")}
          </>
        }
      />

      {/* --- LIST MODAL --- (Unique) */}
      <MenuDropdown
        isOpen={isListOpen}
        onClose={closeList}
        triggerRef={listTriggerRef}
        closeOnScroll
        alignLeft
      >
        <div className="flex flex-col gap-3">
          {listItems.length === 0 ? (
            <span>{t("Manage/Empty")}</span>
          ) : (
            <div className="flex flex-col gap-2">
              {listItems.map((x) => (
                <div key={x.id}>- &nbsp; {x.name}</div>
              ))}
            </div>
          )}
        </div>
      </MenuDropdown>
    </>
  );
};

export default MasterPlansClient; // <-- Unique.
