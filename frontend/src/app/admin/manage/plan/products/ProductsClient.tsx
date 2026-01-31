"use client";

import { useToast } from "../../../../components/toast/ToastProvider";
import useManage from "@/app/hooks/useManage";
import { ProductFilters, ProductItem } from "@/app/types/manageTypes"; // <-- Unique.
import {
  deleteContent,
  fetchContent,
  fetchMasterPlans,
  fetchMasterPlanFields,
  MasterPlanOption,
  MasterPlanFieldOption,
} from "@/app/apis/manage/productsApi"; // <-- Unique.
import ManageBase from "@/app/components/manage/ManageBase";
import ProductModal from "@/app/components/modals/admin/plan/ProductModal"; // <-- Unique.
import DeleteModal from "@/app/components/modals/DeleteModal";
import { badgeClass } from "@/app/components/manage/ManageClasses";
import { useEffect, useState } from "react";
import { utcIsoToLocalDateTime } from "@/app/helpers/timeUtils";
import useTN from "@/app/hooks/useTN";
import useTheme from "@/app/hooks/useTheme";
import { useHandbook } from "@/app/context/HandbookContext";

type Props = {
  isConnected: boolean | null;
};

const ProductsClient = (props: Props) => {
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
  } = useManage<ProductItem, ProductFilters>(
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
            t("Manage/Failed to fetch") + t("entities.product", "p"),
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

  // --- FETCH MASTER PLANS & MASTER PLAN FIELDS INITIALIZATION (Unique) ---
  const [masterPlans, setMasterPlans] = useState<MasterPlanOption[]>([]);
  const [masterPlanFields, setMasterPlanFields] = useState<
    MasterPlanFieldOption[]
  >([]);
  useEffect(() => {
    fetchMasterPlans()
      .then(setMasterPlans)
      .catch((err) => notify("error", t("Modal/Unknown error")));

    fetchMasterPlanFields()
      .then(setMasterPlanFields)
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
      notify(
        "success",
        t("entities.product", { capitalize: true }) + t("Manage/deleted2"),
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
      key: "name, masterPlans, masterPlanFields, isHidden",
      getValue: (item: ProductItem) => (
        <div className="flex flex-col gap-4 rounded-2xl bg-(--bg-grid-header) p-4">
          {/* <div className="flex flex-col"> */}
          <div className="flex items-center gap-4 text-2xl font-bold">
            <span className="flex items-center">{item.name}</span>
          </div>
          {/* </div> */}
          <div className="flex flex-wrap gap-2">
            <span className="w-full font-semibold">
              {t("Manage/Master plans")}:
            </span>
            {item.masterPlans.length === 0 ? (
              <span className="-mt-2">-</span>
            ) : (
              (item.masterPlans ?? []).map((masterPlan, i) => (
                <span
                  key={i}
                  className={`${badgeClass} bg-(--badge-main) text-(--text-main-reverse)`}
                >
                  {masterPlan.name}
                </span>
              ))
            )}
          </div>
          <div className="flex flex-wrap gap-2">
            <span className="w-full font-semibold">
              {t("entities.masterPlanField", {
                capitalize: true,
                plural: true,
              })}
              :
            </span>
            {item.masterPlanFields.length === 0 ? (
              <span className="-mt-2">-</span>
            ) : (
              (item.masterPlanFields ?? []).map((masterPlanField, i) => (
                <span
                  key={i}
                  className={`${badgeClass} bg-(--badge-main) text-(--text-main-reverse)`}
                >
                  {masterPlanField.name}
                </span>
              ))
            )}
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
      getValue: (item: ProductItem) => (
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
      getValue: (item: ProductItem) => (
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
      getValue: (item: ProductItem) => (
        <div className="flex items-center gap-4">{item.name}</div>
      ),
      responsivePriority: 0,
    },
    {
      key: "masterPlans",
      label: t("Manage/Master plans"),
      sortingItem: "masterplancount",
      labelAsc: t("Manage/master plan amount") + t("Manage/ascending"),
      labelDesc: t("Manage/master plan amount") + t("Manage/descending"),
      getValue: (item: ProductItem) => (
        <div className="flex flex-wrap gap-2">
          {(item.masterPlans ?? []).map((masterPlan, i) => (
            <span
              key={i}
              className={`${badgeClass} bg-(--badge-main) text-(--text-main-reverse)`}
            >
              {masterPlan.name}
            </span>
          ))}
        </div>
      ),
      responsivePriority: 2,
    },
    {
      key: "masterPlanFields",
      label: t("entities.masterPlanField", { capitalize: true, plural: true }),
      sortingItem: "masterplanfieldcount",
      labelAsc: t("Manage/master plan field amount") + t("Manage/ascending"),
      labelDesc: t("Manage/master plan field amount") + t("Manage/descending"),
      getValue: (item: ProductItem) => (
        <div className="flex flex-wrap gap-2">
          {(item.masterPlanFields ?? []).map((masterPlanField, i) => (
            <span
              key={i}
              className={`${badgeClass} bg-(--badge-main) text-(--text-main-reverse)`}
            >
              {masterPlanField.name}
            </span>
          ))}
        </div>
      ),
      responsivePriority: 3,
    },
    {
      key: "isHidden",
      label: t("status.status", { capitalize: true }),
      sortingItem: "visibilitycount",
      labelAsc: t("Products/visible products"),
      labelDesc: t("Products/hidden products"),
      classNameAddition: "w-[100px] min-w-[100px]",
      childClassNameAddition: "w-fit",
      getValue: (item: ProductItem) => (
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

    selectedMasterPlans: filters.masterPlanIds ?? [],
    setMasterPlanSelected: (masterPlanId: number, val: boolean) => {
      setFilters((prev) => ({
        ...prev,
        masterPlanIds: val
          ? [...(prev.masterPlanIds ?? []), masterPlanId]
          : (prev.masterPlanIds ?? []).filter((id) => id !== masterPlanId),
      }));
    },

    selectedMasterPlanFields: filters.masterPlanFieldIds ?? [],
    setMasterPlanFieldSelected: (masterPlanFieldId: number, val: boolean) => {
      setFilters((prev) => ({
        ...prev,
        masterPlanFieldIds: val
          ? [...(prev.masterPlanFieldIds ?? []), masterPlanFieldId]
          : (prev.masterPlanFieldIds ?? []).filter(
              (id) => id !== masterPlanFieldId,
            ),
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
          label: t("Products/Visible products"),
          isSelected: filterControls.showVisible,
          setSelected: filterControls.setShowVisible,
          count: counts?.visibilityCount?.["Visible"] ?? 0,
        },
        {
          label: t("Products/Hidden products"),
          isSelected: filterControls.showHidden,
          setSelected: filterControls.setShowHidden,
          count: counts?.visibilityCount?.["Hidden"] ?? 0,
        },
      ],
    },
    {
      label: t("Manage/Master plans"),
      breakpoint: "lg",
      options: masterPlans.map((masterPlan) => {
        return {
          label: masterPlan.name,
          isSelected: filterControls.selectedMasterPlans.includes(
            masterPlan.id,
          ),
          setSelected: (val: boolean) =>
            filterControls.setMasterPlanSelected(masterPlan.id, val),
          count: counts?.masterPlanCount?.[masterPlan.id],
        };
      }),
    },
    {
      label: t("entities.masterPlanField", { capitalize: true, plural: true }),
      breakpoint: "xl",
      options: masterPlanFields.map((masterPlanField) => {
        return {
          label: masterPlanField.name,
          isSelected: filterControls.selectedMasterPlanFields.includes(
            masterPlanField.id,
          ),
          setSelected: (val: boolean) =>
            filterControls.setMasterPlanFieldSelected(masterPlanField.id, val),
          count: counts?.masterPlanFieldCount?.[masterPlanField.id],
        };
      }),
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
    setHandbook("Products");
  }, []);

  return (
    <>
      <ManageBase<ProductItem> // <-- Unique.
        itemName={t("entities.product")} // <-- Unique.
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
      <ProductModal // <-- Unique.
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
            {t("Products/Confirm1")}
            <br />
            <br />
            {t("Products/Confirm2")}
            <br />
            <br />
            {t("Products/Confirm3")}
          </>
        }
      />
    </>
  );
};

export default ProductsClient; // <-- Unique.
