"use client";

import { useToast } from "../../../components/toast/ToastProvider";
import useManage from "@/app/hooks/useManage";
import { UnitFilters, UnitItem } from "@/app/types/manageTypes"; // <-- Unique.
import {
  deleteContent,
  fetchContent,
  fetchUnitColumns,
  fetchCategories,
  fetchUnitGroups,
  fetchShifts,
  fetchMasterPlans,
  UnitColumnOption,
  CategoryOption,
  UnitGroupOption,
  ShiftOption,
  MasterPlanOption,
} from "@/app/apis/manage/unitsApi"; // <-- Unique.
import ManageBase from "@/app/components/manage/ManageBase";
import UnitModal from "@/app/components/modals/admin/units/UnitModal"; // <-- Unique.
import DeleteModal from "@/app/components/modals/DeleteModal";
import { useEffect, useState } from "react";
import { badgeClass } from "@/app/components/manage/ManageClasses";
import { utcIsoToLocalDateTime } from "@/app/helpers/timeUtils";
import useTheme from "@/app/hooks/useTheme";
import { useHandbook } from "@/app/context/HandbookContext";
<<<<<<< Updated upstream
=======
import useTN from "@/app/hooks/useTN";
>>>>>>> Stashed changes

type Props = {
  isConnected: boolean | null;
};

const UnitsClient = (props: Props) => {
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
  } = useManage<UnitItem, UnitFilters>(
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
            t("Manage/Failed to fetch") + t("entities.unit", { plural: true }),
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
    { initialSortBy: "unitGroupName", initialSortOrder: "asc" },
  );

  const { notify } = useToast();

  // --- FETCH INITIALIZATION (Unique) ---
  const [unitGroups, setUnitGroups] = useState<UnitGroupOption[]>([]);
  const [unitColumns, setUnitColumns] = useState<UnitColumnOption[]>([]);
  const [categories, setCategories] = useState<CategoryOption[]>([]);
  const [shifts, setShifts] = useState<ShiftOption[]>([]);
  const [masterPlans, setMasterPlans] = useState<MasterPlanOption[]>([]);
  useEffect(() => {
    fetchUnitGroups()
      .then(setUnitGroups)
      .catch((err) => notify("error", t("Modal/Unknown error")));

    fetchUnitColumns()
      .then(setUnitColumns)
      .catch((err) => notify("error", t("Modal/Unknown error")));

    fetchCategories()
      .then(setCategories)
      .catch((err) => notify("error", t("Modal/Unknown error")));

    fetchShifts()
      .then(setShifts)
      .catch((err) => notify("error", t("Modal/Unknown error")));

    fetchMasterPlans()
      .then(setMasterPlans)
      .catch((err) => notify("error", t("Modal/Unknown error")));
  }, []);

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
      window.dispatchEvent(new Event("unit-list-updated"));
<<<<<<< Updated upstream
      notify("success", t("Common/Unit") + t("Manage/deleted1"), 4000); // <-- Unique.
=======
      notify(
        "success",
        t("entities.unit", { capitalize: true }) + t("Manage/deleted1"),
        4000,
      ); // <-- Unique.
>>>>>>> Stashed changes
    } catch (err: any) {
      notify("error", err?.message || t("Modal/Unknown error"));
    }
  };

  // --- Theme ---
  const { currentTheme } = useTheme();

  // --- Grid Items (Unique) ---
  const gridItems = () => [
    {
      key: "name, isHidden",
      getValue: (item: UnitItem) => (
        <div className="flex flex-col gap-4 rounded-2xl bg-(--bg-grid-header) p-4">
          <div className="flex flex-col">
            <span className="flex items-center gap-4 text-2xl font-bold">
              <span
                className="h-8 min-h-8 w-8 min-w-8 rounded-full"
                style={
                  item.reverseColor
                    ? {
                        boxShadow: `inset 0 0 0 1px ${
                          currentTheme === "dark"
                            ? item.darkColorHex
                            : item.lightColorHex
                        }`,
                        backgroundColor: "transparent",
                        color: "var(--text-main)",
                      }
                    : {
                        backgroundColor:
                          currentTheme === "dark"
                            ? item.darkColorHex
                            : item.lightColorHex,
                        color:
                          currentTheme === "dark"
                            ? item.darkTextColorHex
                            : item.lightTextColorHex,
                      }
                }
              />
              <span className="flex items-center">{item.name}</span>
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
              {t("Units/Belongs to master plan")}:
            </span>

            {item.masterPlanName === null ? (
              <span className="-mt-2">-</span>
            ) : (
              <span className="-mt-2">{item.masterPlanName}</span>
            )}
          </div>
          <div className="flex flex-wrap gap-2">
            <span className="w-full font-semibold">
              {t("entities.column", { capitalize: true, plural: true })}:
            </span>
            <>
              {item.unitColumnIds.length === 0 ? (
                <span className="-mt-2">-</span>
              ) : (
                item.unitColumnIds.map((id) => {
                  const col = unitColumns.find((c) => c.id === id);
                  if (!col) {
                    return null;
                  }

                  return (
                    <span
                      key={id}
                      className={`${badgeClass} bg-(--badge-main) text-(--text-main-reverse)`}
                    >
                      {col.name}
                    </span>
                  );
                })
              )}
            </>
          </div>
          <div className="flex flex-wrap gap-2">
            <span className="w-full font-semibold">
<<<<<<< Updated upstream
              {t("Common/Categories")}:
=======
              {t("entities.category", { plural: true })}:
>>>>>>> Stashed changes
            </span>
            <>
              {categories.filter((cat) => item.categoryIds.includes(cat.id))
                .length === 0 ? (
                <span className="-mt-2">-</span>
              ) : (
                item.categoryIds.map((id) => {
                  const cat = categories.find((c) => c.id === id);
                  if (!cat) {
                    return null;
                  }

                  return (
                    <span
                      key={id}
                      className={`${badgeClass} bg-(--badge-main) text-(--text-main-reverse)`}
                    >
                      {cat.name}
                    </span>
                  );
                })
              )}
            </>
          </div>
          <div className="flex flex-wrap gap-2">
            <span className="w-full font-semibold">
              {t("entities.shift", { plural: true })}:
            </span>
            <>
              {shifts.filter((shift) => item.shiftIds.includes(shift.id))
                .length === 0 ? (
                <span className="-mt-2">-</span>
              ) : (
                item.shiftIds.map((id) => {
                  const shift = shifts.find((s) => s.id === id);
                  if (!shift) {
                    return null;
                  }

                  return (
                    <span
                      key={id}
                      className={badgeClass}
                      style={
                        shift.reverseColor
                          ? {
                              boxShadow: `inset 0 0 0 1px ${
                                currentTheme === "dark"
                                  ? shift.darkColorHex
                                  : shift.lightColorHex
                              }`,
                              backgroundColor: "transparent",
                              color: "var(--text-main)",
                            }
                          : {
                              backgroundColor:
                                currentTheme === "dark"
                                  ? shift.darkColorHex
                                  : shift.lightColorHex,
                              color:
                                currentTheme === "dark"
                                  ? shift.darkTextColorHex
                                  : shift.lightTextColorHex,
                            }
                      }
                    >
                      {shift.name}
                    </span>
                  );
                })
              )}
            </>
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
      getValue: (item: UnitItem) => (
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
      getValue: (item: UnitItem) => (
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
      getValue: (item: UnitItem) => (
        <div className="flex items-center gap-4">
          <span
            className="h-4 min-h-4 w-4 min-w-4 rounded-full"
            style={
              item.reverseColor
                ? {
                    boxShadow: `inset 0 0 0 1px ${
                      currentTheme === "dark"
                        ? item.darkColorHex
                        : item.lightColorHex
                    }`,
                    backgroundColor: "transparent",
                    color: "var(--text-main)",
                  }
                : {
                    backgroundColor:
                      currentTheme === "dark"
                        ? item.darkColorHex
                        : item.lightColorHex,
                    color:
                      currentTheme === "dark"
                        ? item.darkTextColorHex
                        : item.lightTextColorHex,
                  }
            }
          />
          {item.name}
        </div>
      ),
      responsivePriority: 0,
    },
    {
      key: "unitGroupName",
      label: t("Units/Belongs to group"),
      sortingItem: "unitgroupname",
      labelAsc: t("entities.group") + " Ö-A",
      labelDesc: t("entities.group") + " A-Ö",
      getValue: (item: UnitItem) => item.unitGroupName,
      responsivePriority: 2,
    },
    {
      key: "masterPlanName",
      label: t("Units/Belongs to master plan"),
      sortingItem: "masterplanname",
      labelAsc: t("entities.masterPlan") + " Ö-A",
      labelDesc: t("entities.masterPlan") + " A-Ö",
      getValue: (item: UnitItem) => item.masterPlanName,
      responsivePriority: 3,
    },
    {
      key: "unitColumns",
      label: t("entities.column", { capitalize: true, plural: true }),
      sortingItem: "unitcolumncount",
      labelAsc: t("Units/column amount") + t("Manage/ascending"),
      labelDesc: t("Units/column amount") + t("Manage/descending"),
      getValue: (item: UnitItem) => (
        <div className="flex flex-wrap gap-2">
          {item.unitColumnIds.map((id) => {
            const col = unitColumns.find((c) => c.id === id);
            if (!col) {
              return null;
            }

            return (
              <span
                key={id}
                className={`${badgeClass} bg-(--badge-main) text-(--text-main-reverse)`}
              >
                {col.name}
              </span>
            );
          })}
        </div>
      ),
      responsivePriority: 4,
    },
    {
      key: "categories",
<<<<<<< Updated upstream
      label: t("Common/Categories"),
=======
      label: t("entities.category", { plural: true }),
>>>>>>> Stashed changes
      sortingItem: "categorycount",
      labelAsc: t("Units/category amount") + t("Manage/ascending"),
      labelDesc: t("Units/category amount") + t("Manage/descending"),
      getValue: (item: UnitItem) => (
        <div className="flex flex-wrap gap-2">
          {item.categoryIds.map((id) => {
            const cat = categories.find((c) => c.id === id);
            if (!cat) {
              return null;
            }

            return (
              <span
                key={id}
                className={`${badgeClass} bg-(--badge-main) text-(--text-main-reverse)`}
              >
                {cat.name}
              </span>
            );
          })}
        </div>
      ),
      responsivePriority: 5,
    },
    {
      key: "shifts",
      label: t("entities.shift", { capitalize: true, plural: true }),
      sortingItem: "shiftcount",
      labelAsc: t("Units/shift amount") + t("Manage/ascending"),
      labelDesc: t("Units/shift amount") + t("Manage/descending"),
      getValue: (item: UnitItem) => (
        <div className="flex flex-wrap gap-2">
          {item.shiftIds.map((id) => {
            const shift = shifts.find((s) => s.id === id);
            if (!shift) {
              return null;
            }

            return (
              <span
                key={id}
                className={badgeClass}
                style={
                  shift.reverseColor
                    ? {
                        boxShadow: `inset 0 0 0 1px ${
                          currentTheme === "dark"
                            ? shift.darkColorHex
                            : shift.lightColorHex
                        }`,
                        backgroundColor: "transparent",
                        color: "var(--text-main)",
                      }
                    : {
                        backgroundColor:
                          currentTheme === "dark"
                            ? shift.darkColorHex
                            : shift.lightColorHex,
                        color:
                          currentTheme === "dark"
                            ? shift.darkTextColorHex
                            : shift.lightTextColorHex,
                      }
                }
              >
                {shift.name}
              </span>
            );
          })}
        </div>
      ),
      responsivePriority: 5,
    },
    {
      key: "isHidden",
      label: t("status.status", { capitalize: true }),
      sortingItem: "visibilitycount",
      labelAsc: t("Units/visible units"),
      labelDesc: t("Units/hidden units"),
      classNameAddition: "w-[100px] min-w-[100px]",
      childClassNameAddition: "w-fit",
      getValue: (item: UnitItem) => (
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

    selectedUnitColumns: filters.unitColumnIds ?? [],
    setUnitColumnSelected: (colId: number, val: boolean) => {
      setFilters((prev) => ({
        ...prev,
        unitColumnIds: val
          ? [...(prev.unitColumnIds ?? []), colId]
          : (prev.unitColumnIds ?? []).filter((id) => id !== colId),
      }));
    },

    selectedCategories: filters.categoryIds ?? [],
    setCategorySelected: (catId: number, val: boolean) => {
      setFilters((prev) => ({
        ...prev,
        categoryIds: val
          ? [...(prev.categoryIds ?? []), catId]
          : (prev.categoryIds ?? []).filter((id) => id !== catId),
      }));
    },

    selectedShifts: filters.shiftIds ?? [],
    setShiftSelected: (shiftId: number, val: boolean) => {
      setFilters((prev) => ({
        ...prev,
        shiftIds: val
          ? [...(prev.shiftIds ?? []), shiftId]
          : (prev.shiftIds ?? []).filter((id) => id !== shiftId),
      }));
    },

    selectedMasterPlans: filters.masterPlanIds ?? [],
    setMasterPlanSelected: (masterPlanId: number, val: boolean) => {
      setFilters((prev) => ({
        ...prev,
        masterPlanIds: val
          ? [...(prev.masterPlanIds ?? []), masterPlanId]
          : (prev.masterPlanIds ?? []).filter((id) => id !== masterPlanId),
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
          label: t("Units/Visible units"),
          isSelected: filterControls.showVisible,
          setSelected: filterControls.setShowVisible,
          count: counts?.visibilityCount?.["Visible"] ?? 0,
        },
        {
          label: t("Units/Hidden units"),
          isSelected: filterControls.showHidden,
          setSelected: filterControls.setShowHidden,
          count: counts?.visibilityCount?.["Hidden"] ?? 0,
        },
      ],
    },
    {
      label: t("Units/Belongs to group"),
      breakpoint: "lg",
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
    {
      label: t("Units/Belongs to master plan"),
      breakpoint: "xl",
      options: masterPlans.map((masterPlan) => ({
        label: masterPlan.name,
        isSelected: filterControls.selectedMasterPlans.includes(masterPlan.id),
        setSelected: (val: boolean) =>
          filterControls.setMasterPlanSelected(masterPlan.id, val),
        count: counts?.masterPlanCount?.[masterPlan.id],
      })),
    },
    {
      label: t("entities.column", { capitalize: true, plural: true }),
      breakpoint: "2xl",
      options: unitColumns.map((col) => ({
        label: col.name,
        isSelected: filterControls.selectedUnitColumns.includes(col.id),
        setSelected: (val: boolean) =>
          filterControls.setUnitColumnSelected(col.id, val),
        count: counts?.unitColumnCount?.[col.id],
      })),
    },
    {
<<<<<<< Updated upstream
      label: t("Common/Categories"),
=======
      label: t("entities.category", { capitalize: true, plural: true }),
>>>>>>> Stashed changes
      breakpoint: "2xl",
      options: categories.map((cat) => ({
        label: cat.name,
        isSelected: filterControls.selectedCategories.includes(cat.id),
        setSelected: (val: boolean) =>
          filterControls.setCategorySelected(cat.id, val),
        count: counts?.categoryCount?.[cat.id],
      })),
    },
    {
      label: t("entities.shift", { capitalize: true, plural: true }),
      breakpoint: "2xl",
      options: shifts.map((shift) => ({
        label: shift.name,
        isSelected: filterControls.selectedShifts.includes(shift.id),
        setSelected: (val: boolean) =>
          filterControls.setShiftSelected(shift.id, val),
        count: counts?.shiftCount?.[shift.id],
      })),
    },
  ];

  // --- Update handbook (Unique) ---
  const { setHandbook } = useHandbook();

  useEffect(() => {
    setHandbook("Units");
  }, []);

  return (
    <>
      <ManageBase<UnitItem> // <-- Unique.
        itemName={t("entities.unit")} // <-- Unique.
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
      <UnitModal // <-- Unique.
        isOpen={isEditModalOpen}
        onClose={toggleEditItemModal}
        itemId={editingItemId}
        onItemUpdated={() => {
          fetchItems();
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

          setIsDeleteModalOpen(false);
          setDeletingItemIds([]);
          setSelectedItems([]);
        }}
        confirmOnDelete
        confirmDeleteMessage={
          <>
            {t("Units/Confirm1")}
            <br />
            <br />
            {t("Units/Confirm2")}
            <br />
            <br />
            {t("Units/Confirm3")}
          </>
        }
      />
    </>
  );
};

export default UnitsClient; // <-- Unique.
