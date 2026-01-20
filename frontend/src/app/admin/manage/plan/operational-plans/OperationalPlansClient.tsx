"use client";

import { useToast } from "../../../../components/toast/ToastProvider";
import useManage from "@/app/hooks/useManage";
import {
  OperationalPlanFilters,
  OperationalPlanItem,
} from "@/app/types/manageTypes"; // <-- Unique.
import {
  deleteContent,
  fetchContent,
  fetchUnitGroups,
  fetchMasterPlans,
  UnitGroupOption,
  MasterPlanOption,
} from "@/app/apis/manage/operationalPlansApi"; // <-- Unique.
import ManageBase from "@/app/components/manage/ManageBase";
import OperationalPlanModal from "@/app/components/modals/admin/plan/OperationalPlanModal"; // <-- Unique.
import DeleteModal from "@/app/components/modals/DeleteModal";
import { badgeClass } from "@/app/components/manage/ManageClasses";
import { useEffect, useState } from "react";
import { utcIsoToLocalDateTime } from "@/app/helpers/timeUtils";
import { useTranslations } from "next-intl";
import useTheme from "@/app/hooks/useTheme";
import { useHandbook } from "@/app/context/HandbookContext";

type Props = {
  isConnected: boolean | null;
};

const OperationalPlansClient = (props: Props) => {
  const t = useTranslations();

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
  } = useManage<OperationalPlanItem, OperationalPlanFilters>(
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
            t("Manage/Failed to fetch") + t("Common/operational plans"),
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

  // --- FETCH MASTER PLANS & UNIT GROUPS INITIALIZATION (Unique) ---
  const [unitGroups, setUnitGroups] = useState<UnitGroupOption[]>([]);
  const [masterPlans, setMasterPlans] = useState<MasterPlanOption[]>([]);
  useEffect(() => {
    fetchUnitGroups()
      .then(setUnitGroups)
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
      window.dispatchEvent(new Event("operational-plan-list-updated"));
      notify(
        "success",
        t("Common/Operational plan") + t("Manage/deleted1"),
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
      key: "name, unitGroupName, masterPlanName, isHidden",
      getValue: (item: OperationalPlanItem) => (
        <div className="flex flex-col gap-4 rounded-2xl bg-(--bg-grid-header) p-4">
          <div className="flex flex-col">
            <div className="flex items-center gap-4 text-2xl font-bold">
              <span className="flex items-center">{item.name}</span>
            </div>
          </div>
          <div className="flex flex-wrap gap-2">
            <span className="w-full font-semibold">
              {t("Units/Belongs to group")}:
            </span>
            <span className="-mt-2">{item.unitGroupName}</span>
          </div>
          <div className="flex flex-wrap gap-2">
            <span className="w-full font-semibold">
              {t("OperationalPlans/Belongs to master plan")}:
            </span>

            {item.masterPlanName === "" ? (
              <span className="-mt-2">-</span>
            ) : (
              <span className="-mt-2">{item.masterPlanName}</span>
            )}
          </div>
          <div className="flex flex-wrap gap-2">
            <span className="w-full font-semibold">{t("Common/Status")}:</span>
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
      getValue: (item: OperationalPlanItem) => (
        <p className="flex flex-col">
          <span className="font-semibold">{t("Common/Created")}</span>
          {utcIsoToLocalDateTime(item.creationDate)} {t("Common/by")}{" "}
          {item.createdBy}
        </p>
      ),
    },
    {
      key: "updateDate, updatedBy",
      getValue: (item: OperationalPlanItem) => (
        <p className="flex flex-col">
          <span className="font-semibold">{t("Common/Updated")}</span>
          {utcIsoToLocalDateTime(item.updateDate)} {t("Common/by")}{" "}
          {item.updatedBy}
        </p>
      ),
    },
  ];

  // --- Table Items (Unique) ---
  const tableItems = () => [
    {
      key: "name",
      label: t("Common/Name"),
      sortingItem: "name",
      labelAsc: t("Common/name") + " Ö-A",
      labelDesc: t("Common/name") + " A-Ö",
      getValue: (item: OperationalPlanItem) => (
        <div className="flex items-center gap-4">{item.name}</div>
      ),
      responsivePriority: 0,
    },
    {
      key: "unitGroupName",
      label: t("Units/Belongs to group"),
      sortingItem: "unitgroupname",
      labelAsc: t("Common/group") + " Ö-A",
      labelDesc: t("Common/group") + " A-Ö",
      getValue: (item: OperationalPlanItem) => item.unitGroupName,
      responsivePriority: 2,
    },
    {
      key: "masterPlanName",
      label: t("OperationalPlans/Belongs to master plan"),
      sortingItem: "masterplanname",
      labelAsc: t("Common/master plan") + " Ö-A",
      labelDesc: t("Common/master plan") + " A-Ö",
      getValue: (item: OperationalPlanItem) => item.masterPlanName,
      responsivePriority: 3,
    },
    {
      key: "isHidden",
      label: t("Common/Status"),
      sortingItem: "visibilitycount",
      labelAsc: t("OperationalPlans/visible operational plans"),
      labelDesc: t("OperationalPlans/hidden operational plans"),
      classNameAddition: "w-[100px] min-w-[100px]",
      childClassNameAddition: "w-[72px] min-w-[72px]",
      getValue: (item: OperationalPlanItem) => (
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

    selectedMasterPlan: filters.masterPlanIds ?? [],
    toggleMasterPlan: (planId: number) => {
      setFilters((prev) => {
        const plans = new Set(prev.masterPlanIds ?? []);
        if (plans.has(planId)) {
          plans.delete(planId);
        } else {
          plans.add(planId);
        }
        return { ...prev, masterPlanIds: Array.from(plans) };
      });
    },
  };

  // --- Filter List (Unique)
  const filterList = () => [
    {
      label: t("Common/Status"),
      breakpoint: "ml",
      options: [
        {
          label: t("OperationalPlans/Visible operational plans"),
          isSelected: filterControls.showVisible,
          setSelected: filterControls.setShowVisible,
          count: counts?.visibilityCount?.["Visible"] ?? 0,
        },
        {
          label: t("OperationalPlans/Hidden operational plans"),
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
      label: t("OperationalPlans/Belongs to master plan"),
      breakpoint: "xl",
      options: masterPlans.map((group) => ({
        label: group.name,
        isSelected: filterControls.selectedMasterPlan.includes(group.id),
        setSelected: (val: boolean) => {
          setFilters((prev) => ({
            ...prev,
            masterPlanIds: val
              ? [...(prev.masterPlanIds ?? []), group.id]
              : (prev.masterPlanIds ?? []).filter((id) => id !== group.id),
          }));
        },
        count: counts?.masterPlanCount?.[group.name],
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
    setHandbook("Operational plans");
  }, []);

  return (
    <>
      <ManageBase<OperationalPlanItem> // <-- Unique.
        itemName={t("Common/operational plan")} // <-- Unique.
        items={items}
        selectedItems={selectedItems}
        setSelectedItems={setSelectedItems}
        toggleEditItemModal={toggleEditItemModal}
        toggleDeleteItemModal={toggleDeleteItemModal}
        isLoading={isLoading}
        isConnected={props.isConnected === true}
        selectMessage="Manage/Select4" // <-- Unique.
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
      <OperationalPlanModal // <-- Unique.
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
        confirmOnDelete // <-- Unique.
        confirmDeleteMessage={
          <>
            {t("OperationalPlans/Confirm1")}
            <br />
            <br />
            {t("OperationalPlans/Confirm2")}
            <br />
            <br />
            {t("OperationalPlans/Confirm3")}
          </>
        }
      />
    </>
  );
};

export default OperationalPlansClient; // <-- Unique.
