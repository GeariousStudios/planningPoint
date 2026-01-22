"use client";

import { useToast } from "../../../../../components/toast/ToastProvider";
import useManage from "@/app/hooks/useManage";
import { ProductGroupFilters, ProductGroupItem } from "@/app/types/manageTypes"; // <-- Unique.
import {
  deleteContent,
  fetchContent,
  fetchMasterPlans,
  fetchProducts,
  MasterPlanOption,
  ProductOption,
} from "@/app/apis/manage/productGroupsApi"; // <-- Unique.
import ManageBase from "@/app/components/manage/ManageBase";
import ProductGroupModal from "@/app/components/modals/admin/plan/ProductGroupModal"; // <-- Unique.
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

const ProductGroupsClient = (props: Props) => {
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
  } = useManage<ProductGroupItem, ProductGroupFilters>(
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
          err.message || t("Manage/Failed to fetch") + t("Common/product groups"),
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

  // --- FETCH MASTER PLANS & PRODUCTS INITIALIZATION (Unique) ---
  const [masterPlans, setMasterPlans] = useState<MasterPlanOption[]>([]);
  const [products, setProducts] = useState<
    ProductOption[]
  >([]);
  useEffect(() => {
    fetchMasterPlans()
      .then(setMasterPlans)
      .catch((err) => notify("error", t("Modal/Unknown error")));

    fetchProducts()
      .then(setProducts)
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
      notify("success", t("Common/Product group") + t("Manage/deleted2"), 4000); // <-- Unique.
    } catch (err: any) {
      notify("error", err?.message || t("Modal/Unknown error"));
    }
  };

  // --- Theme ---
  const { currentTheme } = useTheme();

  // --- Grid Items (Unique) ---
  const gridItems = () => [
    {
      key: "name, masterPlans, products, isHidden",
      getValue: (item: ProductGroupItem) => (
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
              {t("Common/Products")}:
            </span>
            {item.products.length === 0 ? (
              <span className="-mt-2">-</span>
            ) : (
              (item.products ?? []).map((product, i) => (
                <span
                  key={i}
                  className={`${badgeClass} bg-(--badge-main) text-(--text-main-reverse)`}
                >
                  {product.name}
                </span>
              ))
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
      getValue: (item: ProductGroupItem) => (
        <p className="flex flex-col">
          <span className="font-semibold">{t("Common/Created")}</span>
          {utcIsoToLocalDateTime(item.creationDate)} {t("Common/by")}{" "}
          {item.createdBy}
        </p>
      ),
    },
    {
      key: "updateDate, updatedBy",
      getValue: (item: ProductGroupItem) => (
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
      getValue: (item: ProductGroupItem) => (
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
      getValue: (item: ProductGroupItem) => (
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
      key: "products",
      label: t("Common/Products"),
      sortingItem: "productcount",
      labelAsc: t("Manage/product amount") + t("Manage/ascending"),
      labelDesc: t("Manage/product amount") + t("Manage/descending"),
      getValue: (item: ProductGroupItem) => (
        <div className="flex flex-wrap gap-2">
          {(item.products ?? []).map((product, i) => (
            <span
              key={i}
              className={`${badgeClass} bg-(--badge-main) text-(--text-main-reverse)`}
            >
              {product.name}
            </span>
          ))}
        </div>
      ),
      responsivePriority: 3,
    },
    {
      key: "isHidden",
      label: t("Common/Status"),
      sortingItem: "visibilitycount",
      labelAsc: t("Products/visible products"),
      labelDesc: t("Products/hidden products"),
      classNameAddition: "w-[100px] min-w-[100px]",
      childClassNameAddition: "w-fit",
      getValue: (item: ProductGroupItem) => (
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

    selectedProducts: filters.productIds ?? [],
    setProductSelected: (productId: number, val: boolean) => {
      setFilters((prev) => ({
        ...prev,
        productIds: val
          ? [...(prev.productIds ?? []), productId]
          : (prev.productIds ?? []).filter(
              (id) => id !== productId,
            ),
      }));
    },
  };

  // --- Filter List (Unique)
  const filterList = () => [
    {
      label: t("Common/Status"),
      breakpoint: "ml",
      options: [
        {
          label: t("ProductGroups/Visible product groups"),
          isSelected: filterControls.showVisible,
          setSelected: filterControls.setShowVisible,
          count: counts?.visibilityCount?.["Visible"] ?? 0,
        },
        {
          label: t("ProductGroups/Hidden product groups"),
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
      label: t("Common/Products"),
      breakpoint: "xl",
      options: products.map((product) => {
        return {
          label: product.name,
          isSelected: filterControls.selectedProducts.includes(
            product.id,
          ),
          setSelected: (val: boolean) =>
            filterControls.setProductSelected(product.id, val),
          count: counts?.productCount?.[product.id],
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
      <ManageBase<ProductGroupItem> // <-- Unique.
        itemName={t("Common/product group")} // <-- Unique.
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
      <ProductGroupModal // <-- Unique.
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
            {t("ProductGroups/Confirm1")}
            <br />
            <br />
            {t("ProductGroups/Confirm2")}
            <br />
            <br />
            {t("Products/Confirm3")}
          </>
        }
      />
    </>
  );
};

export default ProductGroupsClient; // <-- Unique.
