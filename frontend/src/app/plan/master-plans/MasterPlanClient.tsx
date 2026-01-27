"use client";

import { useTranslations } from "next-intl";
import Input from "@/app/components/common/Input";
import {
  buttonDeletePrimaryClass,
  buttonDeleteSecondaryClass,
  buttonPrimaryClass,
  buttonSecondaryClass,
  iconButtonPrimaryClass,
  roundedButtonClass,
  switchClass,
  switchKnobClass,
  textPrimaryButtonClass,
  textSecondaryButtonClass,
} from "@/app/styles/buttonClasses";
import * as Outline from "@heroicons/react/24/outline";
import * as Solid from "@heroicons/react/24/solid";
import * as SmallerSolid from "@heroicons/react/20/solid";
import { motion } from "framer-motion";
import React, { createRef, useEffect, useMemo, useRef, useState } from "react";
import {
  AllFilter,
  Filter,
  FilterChip,
  TdCell,
  ThCell,
} from "../../components/manage/ManageComponents";
import Message from "../../components/common/Message";
import SingleDropdown from "../../components/common/SingleDropdown";
import CustomTooltip from "@/app/components/common/CustomTooltip";
import HoverIcon from "@/app/components/common/HoverIcon";
import { useParams } from "next/navigation";
import {
  MasterPlanElementStatus,
  useMasterPlan,
} from "@/app/hooks/useMasterPlan";
import {
  badgeClass,
  filterClass,
  filterIconClass,
  tdClass,
  thClass,
} from "@/app/components/manage/ManageClasses";
import { useHandbook } from "@/app/context/HandbookContext";
import SideMenu from "@/app/components/sideMenu/SideMenu";
import MenuDropdown from "@/app/components/common/MenuDropdown/MenuDropdown";
import { FocusTrap } from "focus-trap-react";

type Props = {
  isAuthReady: boolean | null;
  isLoggedIn: boolean | null;
  isConnected: boolean | null;
  isMasterPlanner: boolean | null;
};

const MasterPlanClient = (props: Props) => {
  const t = useTranslations();
  const { masterPlanId } = useParams();
  const apiUrl = process.env.NEXT_PUBLIC_API_URL;
  const token =
    typeof window !== "undefined" ? localStorage.getItem("token") : null;

  const c = useMasterPlan(t, apiUrl, token, masterPlanId);

  // --- Update handbook ---
  const { setHandbook } = useHandbook();

  useEffect(() => {
    if (!c.isReady) {
      return;
    }

    setHandbook("Master plan");
  }, [c.isReady, setHandbook]);

  // --- Filter logic ---
  const smallFilterRefs = useRef<React.RefObject<HTMLButtonElement | null>[]>(
    [],
  );
  const bigFilterRefs = useRef<React.RefObject<HTMLDivElement | null>[]>([]);

  const ensureRefs = (count: number) => {
    if (smallFilterRefs.current.length !== count) {
      smallFilterRefs.current = Array.from(
        { length: count },
        (_, i) => smallFilterRefs.current[i] ?? createRef<HTMLButtonElement>(),
      );
    }

    if (bigFilterRefs.current.length !== count) {
      bigFilterRefs.current = Array.from(
        { length: count },
        (_, i) => bigFilterRefs.current[i] ?? createRef<HTMLDivElement>(),
      );
    }
  };

  // --- Product logic ---
  const productListTriggerRef = useRef<HTMLButtonElement>(null);

  if (c.canShowLock) {
    return <Message icon="lock" content="lock" fullscreen />;
  }

  if (c.canShowInvalid) {
    return <Message content="invalid" fullscreen />;
  }

  if (!c.isReady) {
    return null;
  }

  ensureRefs(c.filters.length);

  return (
    <FocusTrap
      active={!!c.isEditing}
      focusTrapOptions={{
        escapeDeactivates: false,
        clickOutsideDeactivates: false,
        allowOutsideClick: true,
        fallbackFocus: () =>
          document.getElementById("edit-focus-root") as HTMLElement,
      }}
    >
      <div id="edit-focus-root" tabIndex={-1}>
        {c.isEditing && (
          <>
            <div className="fixed inset-0 z-[calc(var(--z-edit)-2)] bg-(--bg-main) opacity-90" />
            <div className="pointer-events-none fixed inset-0 z-[calc(var(--z-edit)+1)] border-6 border-(--edit-mode)" />
            <div className="pointer-events-none fixed top-0 left-0 z-[calc(var(--z-edit)+2)] w-full bg-(--edit-mode) py-2 text-center text-lg font-semibold tracking-wide text-(--text-main-reverse)">
              {t("Common/Editing")} {t("Common/master plan")}
            </div>
          </>
        )}

        <div
          className={`grid gap-4 ${c.isEditing ? "relative z-[calc(var(--z-edit)-1)]" : ""}`}
        >
          {/* --- CHECKING BAR --- */}
          {props.isMasterPlanner && (
            <>
              <div className="flex w-full flex-wrap items-center justify-between gap-4">
                <div className="flex flex-wrap gap-4">
                  <CustomTooltip
                    content={`${c.isViewingRevision ? t("MasterPlan/Viewing revision tooltip") : ""}`}
                    showOnTouch
                    shortDelay
                  >
                    <button
                      className={` ${buttonPrimaryClass} group lg:w-max lg:px-4 ${
                        c.isEditing
                          ? "!bg-(--note-success) text-(--text-main-reverse) hover:!bg-(--note-success-hover)"
                          : c.showForceColor
                            ? "!bg-(--note-error) text-(--text-main-reverse) hover:!bg-(--note-error-hover)"
                            : ""
                      } `}
                      disabled={
                        c.isCheckingOut ||
                        c.isCheckingIn ||
                        c.isLoading ||
                        c.isViewingRevision ||
                        c.importing
                      }
                      onClick={() => {
                        c.setStatusFilters([]);

                        if (!c.isEditing) {
                          if (c.checkedOutBy && !c.checkedOutByMe) {
                            c.setIsCheckingOut(true);
                            c.handleCheck(true);
                          } else {
                            c.setIsCheckingOut(true);
                            c.handleCheck(false);
                          }
                        } else {
                          c.setIsCheckingIn(true);
                          c.setIsKeepSeparate(false);
                          c.handleSave();
                        }
                      }}
                    >
                      <div className="flex items-center justify-center gap-2 truncate">
                        {(c.isCheckingOut || c.isCheckingIn) && (
                          <Outline.ArrowPathIcon className="h-6 w-6 motion-safe:animate-[spin_1s_linear_infinite]" />
                        )}

                        {!c.isCheckingOut && !c.isCheckingIn && (
                          <HoverIcon
                            outline={
                              c.isEditing
                                ? Outline.CheckIcon
                                : c.showForceColor
                                  ? Outline.ExclamationTriangleIcon
                                  : Outline.PencilIcon
                            }
                            solid={
                              c.isEditing
                                ? Solid.CheckIcon
                                : c.showForceColor
                                  ? Solid.ExclamationTriangleIcon
                                  : Solid.PencilIcon
                            }
                            className="h-6 w-6"
                          />
                        )}

                        <span className="hidden lg:block">
                          {c.isCheckingOut || c.isCheckingIn
                            ? c.isEditing && c.isCheckingIn
                              ? t("MasterPlan/Checking in")
                              : c.isCheckingOut
                                ? t("MasterPlan/Checking out")
                                : t("MasterPlan/Checking in")
                            : c.showForceColor
                              ? t("MasterPlan/Force checkout")
                              : c.isEditing
                                ? t("MasterPlan/Save and push")
                                : t("MasterPlan/Edit master plan")}
                        </span>
                      </div>
                    </button>
                  </CustomTooltip>

                  {/* --- Abort --- */}
                  {c.isEditing && !c.isCheckingIn && (
                    <button
                      className={`${buttonSecondaryClass} group lg:w-max lg:px-4`}
                      disabled={c.isCheckingIn}
                      onClick={() => {
                        c.setIsCheckingIn(true);
                        c.setIsKeepSeparate(false);
                        c.handleAbortChanges();
                      }}
                    >
                      <div className="flex items-center justify-center gap-2 truncate">
                        {c.isCheckingIn ? (
                          <Outline.ArrowPathIcon className="h-6 w-6 motion-safe:animate-[spin_1s_linear_infinite]" />
                        ) : (
                          <HoverIcon
                            outline={Outline.XMarkIcon}
                            solid={Solid.XMarkIcon}
                            className="h-6 w-6"
                          />
                        )}
                        <span className="hidden lg:block">
                          {c.isCheckingIn
                            ? t("MasterPlan/Checking in")
                            : t("MasterPlan/Abort changes")}
                        </span>
                      </div>
                    </button>
                  )}
                </div>

                {!c.isEditing && !c.isCheckingOut && !c.isCheckingIn && (
                  <div className="ml-auto flex flex-wrap gap-4">
                    <button
                      className={`${buttonSecondaryClass} lg:w-max lg:px-4`}
                      onClick={() => {
                        c.handleExport();
                      }}
                      disabled={c.exporting || c.isLoading}
                    >
                      {c.exporting ? (
                        <div className="flex items-center justify-center gap-2 truncate">
                          <Outline.ArrowPathIcon className="h-6 w-6 motion-safe:animate-[spin_1s_linear_infinite]" />{" "}
                          {t("MasterPlan/Exporting master plan")}
                        </div>
                      ) : (
                        <div className="flex items-center justify-center gap-2 truncate">
                          <HoverIcon
                            outline={Outline.ArrowDownTrayIcon}
                            solid={Solid.ArrowDownTrayIcon}
                            className="h-6 w-6"
                          />
                          <span className="xs:block hidden">
                            {t("MasterPlan/Export master plan")}
                          </span>
                        </div>
                      )}
                    </button>

                    <div className="min-w-[230px]">
                      <SingleDropdown
                        options={[
                          {
                            label: t("MasterPlan/Latest revision"),
                            value: "latest",
                          },
                          ...c.revisions.map((r) => ({
                            label: `${r.label} (${new Date(r.archivedAt).toLocaleString()})`,
                            value: String(r.id),
                          })),
                        ]}
                        value={c.selectedRevisionId}
                        onChange={(val) => c.selectRevision(String(val))}
                      />
                    </div>
                  </div>
                )}

                {/* --- Import --- */}
                {c.isEditing && !c.isCheckingIn && c.masterPlans[0]?.allowImport && (
                  <div className="flex gap-4">
                    <input
                      id="excel-import-input"
                      type="file"
                      accept=".xlsx,.xls"
                      className="hidden"
                      onChange={(e) => {
                        const file = e.target.files?.[0] ?? null;
                        if (!file) {
                          return;
                        }

                        c.handleImport(file);
                        e.currentTarget.value = "";
                      }}
                    />

                    <button
                      className={`${buttonSecondaryClass} lg:w-max lg:px-4`}
                      onClick={() => {
                        document.getElementById("excel-import-input")?.click();
                      }}
                      disabled={c.importing}
                    >
                      {c.importing ? (
                        <div className="flex items-center justify-center gap-2 truncate">
                          <Outline.ArrowPathIcon className="h-6 w-6 motion-safe:animate-[spin_1s_linear_infinite]" />{" "}
                          {t("MasterPlan/Importing master plan")}
                        </div>
                      ) : (
                        <div className="flex items-center justify-center gap-2 truncate">
                          <HoverIcon
                            outline={Outline.ArrowUpTrayIcon}
                            solid={Solid.ArrowUpTrayIcon}
                            className="h-6 w-6"
                          />
                          <span className="xs:block hidden">
                            {t("MasterPlan/Import master plan")}
                          </span>
                        </div>
                      )}
                    </button>
                  </div>
                )}
              </div>

              {/* --- Checked out by text --- */}
              {c.checkedOutBy &&
                !c.isEditing &&
                !c.isCheckingOut &&
                !c.isCheckingIn && (
                  <p className="text-sm text-(--text-secondary)">
                    {t("MasterPlan/Checked out by")}:{" "}
                    <span className="font-medium">{c.checkedOutBy}</span>
                  </p>
                )}

              {/* --- ACTION BAR --- */}
              {c.isEditing && (
                <div
                  ref={c.constraintsRef}
                  className="pointer-events-none fixed inset-0 z-[calc(var(--z-edit)+1)]"
                >
                  <motion.div
                    drag
                    dragControls={c.dragControls}
                    dragListener={false}
                    dragMomentum={false}
                    dragElastic={0}
                    dragConstraints={c.constraintsRef}
                    className="pointer-events-auto absolute bottom-4 mx-4 flex w-fit flex-col gap-4 rounded-2xl bg-(--bg-modal) p-4 shadow-[0_0_16px_0_rgba(0,0,0,0.125)] lg:left-1/2 lg:-translate-x-1/2"
                    style={{ touchAction: "none" }}
                  >
                    <div
                      className="flex cursor-move items-center justify-between gap-4"
                      onPointerDown={(e) => {
                        document.body.style.userSelect = "none";
                        c.dragControls.start(e);
                        const handleUp = () => {
                          document.body.style.userSelect = "";
                          window.removeEventListener("pointerup", handleUp);
                        };
                        window.addEventListener("pointerup", handleUp);
                      }}
                    >
                      <span className="text-xl font-semibold lg:w-lg">
                        {t("MasterPlan/Master Plan Toolbar")}
                      </span>
                      <Outline.Bars3Icon className="h-6 w-6 opacity-50" />
                    </div>

                    <hr className="-ml-4 flex w-[calc(100%+2rem)] text-(--border-tertiary)" />

                    <div className="flex flex-wrap items-center justify-end gap-x-6 gap-y-2">
                      {/* --- Undo/Redo --- */}
                      <div className="flex gap-4">
                        <CustomTooltip
                          content={t("Common/Undo")}
                          showOnTouch
                          longDelay
                        >
                          <button
                            type="button"
                            className={`${buttonSecondaryClass} group flex items-center justify-center gap-2 whitespace-nowrap 2xl:w-full 2xl:px-4`}
                            onClick={() => c.undo()}
                            disabled={!c.canUndo}
                          >
                            <HoverIcon
                              outline={Outline.ArrowUturnLeftIcon}
                              solid={Solid.ArrowUturnLeftIcon}
                              className="h-6 w-6"
                            />
                            <span className="hidden 2xl:block">
                              {t("Common/Undo")}
                            </span>
                          </button>
                        </CustomTooltip>

                        <CustomTooltip
                          content={t("Common/Redo")}
                          showOnTouch
                          longDelay
                        >
                          <button
                            type="button"
                            className={`${buttonSecondaryClass} group flex items-center justify-center gap-2 whitespace-nowrap 2xl:w-full 2xl:px-4`}
                            onClick={() => c.redo()}
                            disabled={!c.canRedo}
                          >
                            <HoverIcon
                              outline={Outline.ArrowUturnRightIcon}
                              solid={Solid.ArrowUturnRightIcon}
                              className="h-6 w-6"
                            />
                            <span className="hidden 2xl:block">
                              {t("Common/Redo")}
                            </span>
                          </button>
                        </CustomTooltip>
                      </div>

                      {/* --- Don't join groups --- */}
                      <div
                        className={`${c.editMode === "group" ? "cursor-not-allowed opacity-25" : ""}`}
                      >
                        <CustomTooltip
                          content={`${c.editMode === "element" ? t("MasterPlan/Do not join groups tooltip") : ""}`}
                          showOnTouch
                          longDelay
                        >
                          <div className="flex items-center gap-2 truncate">
                            <button
                              type="button"
                              role="switch"
                              aria-checked={c.isKeepSeparate}
                              className={`${switchClass(c.isKeepSeparate)} `}
                              onClick={() => c.setIsKeepSeparate((prev) => !prev)}
                              disabled={c.editMode === "group"}
                            >
                              <div
                                className={switchKnobClass(c.isKeepSeparate)}
                              />
                            </button>
                            <span className="mb-0.5">
                              {t("MasterPlan/Do not join groups")}
                            </span>
                          </div>
                        </CustomTooltip>
                      </div>

                      <div className="flex gap-2">
                        {/* --- Edit mode --- */}
                        <CustomTooltip
                          content={t("MasterPlan/Element mode tooltip")}
                          showOnTouch
                          longDelay
                        >
                          <button
                            className={`${c.editMode === "element" ? `${textPrimaryButtonClass} underline` : `${textSecondaryButtonClass}`}`}
                            onClick={() => c.setEditMode("element")}
                          >
                            {t("MasterPlan/Element mode")}
                          </button>
                        </CustomTooltip>
                        |
                        <CustomTooltip
                          content={t("MasterPlan/Group mode tooltip")}
                          showOnTouch
                          longDelay
                        >
                          <button
                            className={`${c.editMode === "group" ? `${textPrimaryButtonClass} underline` : `${textSecondaryButtonClass}`}`}
                            onClick={() => {
                              c.setEditMode("group");
                              c.setIsKeepSeparate(false);
                            }}
                          >
                            {t("MasterPlan/Group mode")}
                          </button>
                        </CustomTooltip>
                      </div>
                    </div>

                    <hr className="-ml-4 flex w-[calc(100%+2rem)] text-(--border-tertiary)" />

                    <div className="flex w-full flex-col gap-4">
                      <div className="flex gap-4 lg:grid lg:grid-cols-3">
                        <div className="col-span-2 flex w-full gap-1">
                          {/* --- Add element --- */}
                          <CustomTooltip
                            content={t("MasterPlan/Add element tooltip")}
                            showOnTouch
                            longDelay
                          >
                            <button
                              className={`${buttonPrimaryClass} group flex w-full items-center justify-center gap-2 px-4`}
                              onClick={() => {
                                const topGroup =
                                  c.editMode === "group"
                                    ? (c.masterPlans[0]?.elements?.[0]?.groupId ??
                                      null)
                                    : null;
                                c.handleAddElement(
                                  c.masterPlans[0]?.id as number,
                                  topGroup,
                                );
                              }}
                            >
                              <HoverIcon
                                outline={Outline.PlusIcon}
                                solid={Solid.PlusIcon}
                                className="h-6 w-6"
                              />
                              <span className="2xs:hidden block">
                                {t("Common/Add")}
                              </span>
                              <span className="2xs:block hidden">
                                {t("MasterPlan/Add element")}
                              </span>
                            </button>
                          </CustomTooltip>

                          {/* --- Add element from product list--- */}
                          <CustomTooltip
                            content={t(
                              "MasterPlan/Add from product list tooltip",
                            )}
                            showOnTouch
                            longDelay
                          >
                            <button
                              ref={productListTriggerRef}
                              className={`${buttonPrimaryClass} group flex w-full flex-1 items-center justify-center gap-2 lg:px-4`}
                              type="button"
                              onClick={() => {
                                c.setProductSearch("");
                                c.openProductList();
                              }}
                            >
                              <HoverIcon
                                outline={Outline.ChevronDownIcon}
                                solid={Solid.ChevronDownIcon}
                                className="h-6 min-h-6 w-6 min-w-6"
                              />
                            </button>
                          </CustomTooltip>
                        </div>

                        <MenuDropdown
                          isOpen={c.isProductListOpen}
                          onClose={c.closeProductList}
                          triggerRef={productListTriggerRef}
                          center
                          maxHeight="50svh"
                          autoWidth
                        >
                          {c.isProductListLoading ? (
                            <span>{t("Message/Loading")}</span>
                          ) : c.filteredProductList.length === 0 ? (
                            <div className="flex flex-col gap-4">
                              <div className="flex items-center gap-2 truncate">
                                <button
                                  type="button"
                                  className={
                                    c.productTab === "all"
                                      ? `${textPrimaryButtonClass} underline`
                                      : `${textSecondaryButtonClass}`
                                  }
                                  onClick={() => {
                                    c.setProductSearch("");
                                    c.setProductTab("all");
                                  }}
                                >
                                  {t("Common/All")}
                                </button>

                                <span className="opacity-40">|</span>

                                <button
                                  type="button"
                                  className={
                                    c.productTab === "products"
                                      ? `${textPrimaryButtonClass} underline`
                                      : `${textSecondaryButtonClass}`
                                  }
                                  onClick={() => {
                                    c.setProductSearch("");
                                    c.setProductTab("products");
                                  }}
                                >
                                  {t("Common/Products")}
                                </button>

                                <span className="opacity-40">|</span>

                                <button
                                  type="button"
                                  className={
                                    c.productTab === "product-groups"
                                      ? `${textPrimaryButtonClass} underline`
                                      : `${textSecondaryButtonClass}`
                                  }
                                  onClick={() => {
                                    c.setProductSearch("");
                                    c.setProductTab("product-groups");
                                  }}
                                >
                                  {t("Common/Product groups")}
                                </button>
                              </div>

                              <Input
                                placeholder={`${
                                  c.productTab === "products"
                                    ? t("Common/Search") +
                                      " " +
                                      t("Common/products") +
                                      "..."
                                    : c.productTab === "product-groups"
                                      ? t("Common/Search") +
                                        " " +
                                        t("Common/product groups") +
                                        "..."
                                      : t("Common/Search") + "..."
                                }`}
                                value={c.productSearch}
                                onChange={(val) =>
                                  c.setProductSearch(String(val))
                                }
                              />
                              <span>{t("Manage/No content")}</span>
                            </div>
                          ) : (
                            <div className="flex flex-col gap-4">
                              <div className="flex items-center gap-2 truncate">
                                <button
                                  type="button"
                                  className={
                                    c.productTab === "all"
                                      ? `${textPrimaryButtonClass} underline`
                                      : `${textSecondaryButtonClass}`
                                  }
                                  onClick={() => {
                                    c.setProductSearch("");
                                    c.setProductTab("all");
                                  }}
                                >
                                  {t("Common/All")}
                                </button>

                                <span className="opacity-40">|</span>

                                <button
                                  type="button"
                                  className={
                                    c.productTab === "products"
                                      ? `${textPrimaryButtonClass} underline`
                                      : `${textSecondaryButtonClass}`
                                  }
                                  onClick={() => {
                                    c.setProductSearch("");
                                    c.setProductTab("products");
                                  }}
                                >
                                  {t("Common/Products")}
                                </button>

                                <span className="opacity-40">|</span>

                                <button
                                  type="button"
                                  className={
                                    c.productTab === "product-groups"
                                      ? `${textPrimaryButtonClass} underline`
                                      : `${textSecondaryButtonClass}`
                                  }
                                  onClick={() => {
                                    c.setProductSearch("");
                                    c.setProductTab("product-groups");
                                  }}
                                >
                                  {t("Common/Product groups")}
                                </button>
                              </div>

                              <Input
                                placeholder={`${
                                  c.productTab === "products"
                                    ? t("Common/Search") +
                                      " " +
                                      t("Common/products") +
                                      "..."
                                    : c.productTab === "product-groups"
                                      ? t("Common/Search") +
                                        " " +
                                        t("Common/product groups") +
                                        "..."
                                      : t("Common/Search") + "..."
                                }`}
                                value={c.productSearch}
                                onChange={(val) =>
                                  c.setProductSearch(String(val))
                                }
                              />
                              <div className="mt-2 flex flex-col gap-2">
                                {c.filteredProductList.map((p) => (
                                  <button
                                    key={p.id}
                                    type="button"
                                    className={`${badgeClass} w-fit cursor-pointer justify-start bg-(--badge-main) text-(--text-main-reverse) transition-colors duration-(--fast) hover:bg-(--note-info-reverse) hover:text-(--text-main)`}
                                    onClick={() => {
                                      const topGroup =
                                        c.editMode === "group"
                                          ? (c.masterPlans[0]?.elements?.[0]
                                              ?.groupId ?? null)
                                          : null;

                                      c.handleAddFromProductListItem(
                                        c.masterPlans[0]?.id as number,
                                        p,
                                        topGroup,
                                      );
                                    }}
                                  >
                                    {p.name}
                                  </button>
                                ))}
                              </div>
                            </div>
                          )}
                        </MenuDropdown>

                        {/* --- Duplicate object */}
                        <CustomTooltip
                          content={t("MasterPlan/Tooltip duplicate object")}
                          showOnTouch
                          longDelay
                        >
                          <button
                            className={`${buttonSecondaryClass} group col-span-1 flex items-center justify-center gap-2 lg:w-full lg:px-4`}
                            onClick={() => {
                              if (c.selectedId !== null) {
                                c.duplicateSelected(
                                  String(c.masterPlans[0]?.id),
                                  c.selectedId,
                                  c.editMode,
                                );
                              }
                            }}
                            disabled={c.selectedId === null}
                          >
                            <HoverIcon
                              outline={Outline.SquaresPlusIcon}
                              solid={Solid.SquaresPlusIcon}
                              className="h-6 w-6"
                            />
                            <span className="hidden lg:block">
                              {t("MasterPlan/Duplicate object")}
                            </span>
                          </button>
                        </CustomTooltip>
                      </div>

                      <hr className="-mr-4 -ml-4 flex w-[calc(100%+2rem)] text-(--border-tertiary)" />

                      <div className="grid gap-4">
                        {/* --- Move up --- */}
                        <CustomTooltip
                          content={t("MasterPlan/Move up tooltip")}
                          showOnTouch
                          longDelay
                        >
                          <button
                            className={`${buttonSecondaryClass} group flex w-full items-center justify-center gap-2 px-4`}
                            onMouseDown={() => c.handleHoldStart("up")}
                            onMouseUp={c.handleHoldEnd}
                            onMouseLeave={c.handleHoldEnd}
                            disabled={c.selectedId === null}
                          >
                            <HoverIcon
                              outline={Outline.ArrowUpIcon}
                              solid={Solid.ArrowUpIcon}
                              className="h-6 w-6"
                            />
                            {t("MasterPlan/Move up")}
                          </button>
                        </CustomTooltip>

                        {/* --- Move down --- */}
                        <CustomTooltip
                          content={t("MasterPlan/Move down tooltip")}
                          showOnTouch
                          longDelay
                        >
                          <button
                            className={`${buttonSecondaryClass} group flex w-full items-center justify-center gap-2 px-4`}
                            onMouseDown={() => c.handleHoldStart("down")}
                            onMouseUp={c.handleHoldEnd}
                            onMouseLeave={c.handleHoldEnd}
                            disabled={c.selectedId === null}
                          >
                            <HoverIcon
                              outline={Outline.ArrowDownIcon}
                              solid={Solid.ArrowDownIcon}
                              className="h-6 w-6"
                            />
                            {t("MasterPlan/Move down")}
                          </button>
                        </CustomTooltip>
                      </div>

                      <hr className="-mr-4 -ml-4 flex w-[calc(100%+2rem)] text-(--border-tertiary)" />

                      <div
                        className={`${c.masterPlans[0]?.allowRemovingElements ? "lg:grid-cols-3" : ""} flex gap-4 lg:grid`}
                      >
                        {/* --- Strike mode --- */}
                        <CustomTooltip
                          content={t("MasterPlan/Strike tooltip")}
                          showOnTouch
                          longDelay
                        >
                          <button
                            className={`${
                              c.isSelectedStruck
                                ? buttonPrimaryClass
                                : buttonSecondaryClass
                            } ${c.masterPlans[0]?.allowRemovingElements ? "lg:w-full" : "w-full"} group col-span-1 flex items-center justify-center gap-2 lg:px-4`}
                            onClick={() => {
                              if (c.selectedId !== null) {
                                c.toggleStrikeThrough(
                                  String(c.selectedId),
                                  c.editMode,
                                );
                              }
                            }}
                            disabled={c.selectedId === null}
                          >
                            <HoverIcon
                              outline={Outline.NoSymbolIcon}
                              solid={Solid.NoSymbolIcon}
                              className="h-6 w-6"
                            />
                            <span
                              className={`${c.masterPlans[0]?.allowRemovingElements ? "hidden lg:block" : ""}`}
                            >
                              {t("MasterPlan/Strike")}
                            </span>
                          </button>
                        </CustomTooltip>

                        {/* --- Delete element --- */}
                        {c.masterPlans[0]?.allowRemovingElements && (
                          <CustomTooltip
                            content={t("MasterPlan/Mark for deletion tooltip")}
                            showOnTouch
                            longDelay
                          >
                            <button
                              className={`${
                                c.selectedId !== null &&
                                c.removedElementIds.some(
                                  (id) => String(id) === String(c.selectedId),
                                )
                                  ? buttonDeletePrimaryClass
                                  : buttonDeleteSecondaryClass
                              } group col-span-2 flex w-full items-center justify-center gap-2 px-4`}
                              onClick={() => {
                                if (c.selectedId !== null) {
                                  c.toggleRemoveElement(
                                    String(c.selectedId),
                                    c.editMode,
                                  );
                                }
                              }}
                              disabled={c.selectedId === null}
                            >
                              <HoverIcon
                                outline={Outline.TrashIcon}
                                solid={Solid.TrashIcon}
                                className="h-6 w-6"
                              />
                              {c.selectedId !== null &&
                              c.removedElementIds.some(
                                (id) => String(id) === String(c.selectedId),
                              )
                                ? t("MasterPlan/Undo mark for deletion")
                                : t("MasterPlan/Mark for deletion")}
                            </button>
                          </CustomTooltip>
                        )}
                      </div>
                    </div>
                  </motion.div>
                </div>
              )}
            </>
          )}

          {/* --- Revisions --- */}
          {!c.isEditing && !c.isCheckingOut && !c.isCheckingIn && (
            <div className="flex flex-col flex-wrap gap-4">
              {!props.isMasterPlanner && (
                <div className="ml-auto flex flex-wrap gap-4">
                  <button
                    className={`${buttonSecondaryClass} lg:w-max lg:px-4`}
                    onClick={() => {
                      c.handleExport();
                    }}
                    disabled={c.exporting || c.isLoading}
                  >
                    {c.exporting ? (
                      <div className="flex items-center justify-center gap-2 truncate">
                        <Outline.ArrowPathIcon className="h-6 w-6 motion-safe:animate-[spin_1s_linear_infinite]" />{" "}
                        {t("MasterPlan/Exporting master plan")}
                      </div>
                    ) : (
                      <div className="flex items-center justify-center gap-2 truncate">
                        <HoverIcon
                          outline={Outline.ArrowDownTrayIcon}
                          solid={Solid.ArrowDownTrayIcon}
                          className="h-6 w-6"
                        />
                        <span className="xs:block hidden">
                          {t("MasterPlan/Export master plan")}
                        </span>
                      </div>
                    )}
                  </button>

                  <div className="min-w-[230px]">
                    <SingleDropdown
                      options={[
                        {
                          label: t("MasterPlan/Latest revision"),
                          value: "latest",
                        },
                        ...c.revisions.map((r) => ({
                          label: `${r.label} (${new Date(r.archivedAt).toLocaleString()})`,
                          value: String(r.id),
                        })),
                      ]}
                      value={c.selectedRevisionId}
                      onChange={(val) => c.selectRevision(String(val))}
                    />
                  </div>
                </div>
              )}

              <div className="3xs:flex-nowrap 3xs:justify-between flex flex-wrap gap-4">
                <div className="flex w-full items-center gap-4">
                  <div className="flex w-full items-center justify-start">
                    <Input
                      icon={<SmallerSolid.MagnifyingGlassIcon />}
                      placeholder={`${t("Common/Search")}...`}
                      value={c.searchTerm}
                      onChange={(val) => c.setSearchTerm(String(val))}
                    />
                  </div>
                </div>

                <div className="2xs:flex hidden flex-wrap gap-4">
                  <div className="flex gap-4">
                    {c.filters.map((group, i) => (
                      <Filter
                        key={i}
                        filterRef={smallFilterRefs.current[i]}
                        label={group.label}
                        breakpoint={group.breakpoint ?? ""}
                        filterData={group.options.map((opt) => ({
                          label: opt.label,
                          show: opt.isSelected,
                          setShow: opt.setSelected,
                          count: opt.count,
                        }))}
                      />
                    ))}
                  </div>
                </div>

                {c.filters.length > 0 && (
                  <div className="relative">
                    <CustomTooltip
                      content={t("Manage/All filters")}
                      lgHidden
                      longDelay
                      showOnTouch
                    >
                      <button
                        className={`${roundedButtonClass} group xs:w-auto xs:px-4 gap-2`}
                        onClick={() => c.setFilterAllOpen(true)}
                      >
                        <span className={`${filterClass} xs:flex hidden`}>
                          {t("Manage/All filters")}
                        </span>
                        <Outline.AdjustmentsHorizontalIcon
                          className={`${filterIconClass}`}
                        />
                      </button>
                    </CustomTooltip>

                    <SideMenu
                      triggerRef={smallFilterRefs.current[0]}
                      isOpen={c.filterAllOpen}
                      onClose={() => c.setFilterAllOpen(false)}
                      label={t("Manage/All filters")}
                    >
                      <div className="flex h-full flex-col justify-between">
                        <div className="flex flex-col">
                          {c.filters.map((group, i) => (
                            <AllFilter
                              key={i}
                              filterRef={bigFilterRefs.current[i]}
                              label={group.label}
                              filterData={group.options.map((opt) => ({
                                label: opt.label,
                                show: opt.isSelected,
                                setShow: opt.setSelected,
                                count: opt.count,
                              }))}
                            />
                          ))}
                        </div>

                        <div className="flex flex-col gap-4 py-4 sm:flex-row">
                          <button
                            onClick={() => c.setFilterAllOpen(false)}
                            className={`${buttonPrimaryClass} w-full`}
                          >
                            {t("Manage/View")}{" "}
                            <span className="font-normal">
                              {c.totalGroups ?? 0}
                            </span>
                          </button>
                          <button
                            onClick={() => c.clearFilters()}
                            className={`${buttonSecondaryClass} w-full`}
                            disabled={
                              !c.filters.some((g) =>
                                g.options.some((o) => o.isSelected),
                              )
                            }
                          >
                            {t("Manage/Clear all")}
                          </button>
                        </div>
                      </div>
                    </SideMenu>
                  </div>
                )}
              </div>

              {c.filterChips.length > 0 && (
                <div className="flex flex-wrap gap-4">
                  <span className="flex items-center font-semibold text-(--text-secondary)">
                    {t("Manage/Active filters")}:
                  </span>

                  {c.filterChips.map((chip, idx) => (
                    <FilterChip
                      key={idx}
                      onClickEvent={chip.onClear}
                      label={chip.label}
                    />
                  ))}

                  <button
                    className="group w-auto cursor-pointer rounded-full px-4 transition-colors duration-(--fast) hover:bg-(--bg-navbar-link)"
                    onClick={() => c.clearFilters()}
                  >
                    <span className="font-semibold text-(--accent-color)">
                      {t("Manage/Clear all")}
                    </span>
                  </button>
                </div>
              )}
            </div>
          )}

          {/* --- RESULT LIST --- */}
          <div className="relative w-full overflow-x-auto rounded border border-(--border-main) bg-(--bg-grid)">
            <table className="table w-full min-w-6xl table-auto border-collapse">
              <thead className="bg-(--bg-grid-header)">
                <tr>
                  {c.isEditing && (
                    <th
                      className={`${thClass} pointer-events-none !w-[40px] !min-w-[40px] !border-l-0`}
                    />
                  )}

                  <ThCell
                    label={
                      <div className="flex items-center gap-2">
                        <span>{t("Common/Status")}</span>

                        <CustomTooltip
                          content={t("MasterPlan/Tooltip status")}
                          showOnTouch
                          shortDelay
                        >
                          <span className="group flex min-h-4 min-w-4 cursor-help">
                            <HoverIcon
                              outline={Outline.InformationCircleIcon}
                              solid={Solid.InformationCircleIcon}
                              className="h-5 w-5"
                            />
                          </span>
                        </CustomTooltip>
                      </div>
                    }
                    sortable={false}
                    classNameAddition="min-w-fit px-4 whitespace-nowrap"
                  />

                  {c.fieldOptions
                    .filter((f) => !f.isHidden)
                    .map((f, i) => (
                      <ThCell
                        key={f.value}
                        label={f.label}
                        sortable={false}
                        classNameAddition={`${
                          i === c.fieldOptions.length - 1
                            ? "w-full min-w-fit"
                            : "min-w-fit whitespace-nowrap"
                        } px-4`}
                      />
                    ))}
                </tr>
              </thead>

              <tbody>
                {c.isLoading || c.importing ? (
                  c.isEditing ? (
                    <tr>
                      <td
                        colSpan={c.fieldOptions.length + 2 || 1}
                        className="h-57 text-center text-(--text-secondary)"
                      >
                        <Message
                          icon="loading"
                          content={t("Message/Content")}
                        />
                      </td>
                    </tr>
                  ) : (
                    <tr>
                      <td
                        colSpan={c.fieldOptions.length + 1 || 1}
                        className="h-57 text-center text-(--text-secondary)"
                      >
                        <Message
                          icon="loading"
                          content={t("Message/Content")}
                        />
                      </td>
                    </tr>
                  )
                ) : c.visibleElements.length === 0 && !c.isEditing ? (
                  <tr>
                    <td
                      colSpan={c.fieldOptions.length + 1 || 1}
                      className="h-57 text-center text-(--text-secondary)"
                    >
                      <Message icon="search" content={t("Manage/No content")} />
                    </td>
                  </tr>
                ) : (
                  (() => {
                    let currentIsEven = false;
                    let lastGroupId: number | string | null = null;

                    return c.visibleElements.map((el, index) => {
                      const planId = c.masterPlans[0]?.id;

                      const groupKey =
                        el.groupId && el.groupId !== 0
                          ? `group-${el.groupId}`
                          : `nogroup-${index}`;

                      if (groupKey !== lastGroupId) {
                        currentIsEven = !currentIsEven;
                        lastGroupId = groupKey;
                      }

                      const isEven = currentIsEven;

                      const baseBg = isEven
                        ? el.status === "InProgress"
                          ? "bg-(--bg-grid-inProgress)"
                          : el.status === "Finished"
                            ? "bg-(--bg-grid-finished)"
                            : "bg-(--bg-grid)"
                        : el.status === "InProgress"
                          ? "bg-(--bg-grid-inProgress-zebra)"
                          : el.status === "Finished"
                            ? "bg-(--bg-grid-finished-zebra)"
                            : "bg-(--bg-grid-zebra)";

                      const hoverBg =
                        c.selectedId === el.id
                          ? ""
                          : el.status === "InProgress"
                            ? "hover:bg-(--bg-grid-inProgress-header-hover)"
                            : el.status === "Finished"
                              ? "hover:bg-(--bg-grid-finished-header-hover)"
                              : "hover:bg-(--bg-grid-header-hover)";

                      return (
                        <tr
                          key={`${planId}-${el.id}`}
                          className={`${baseBg} ${hoverBg} ${
                            c.removedElementIds.includes(el.id)
                              ? "!bg-(--button-delete) text-(--text-main-reverse)"
                              : ""
                          } ${c.isStrikeMode ? "cursor-pointer" : ""} transition-[background] duration-(--fast)`}
                        >
                          {/* <TdCell classNameAddition="min-w-fit whitespace-nowrap px-4 text-(--text-secondary)">
                        {String(el.id)}
                      </TdCell> */}

                          {c.isEditing && (
                            <td
                              className={`${tdClass} ${el.status === "InProgress" ? "!border-(--border-inProgress)" : el.status === "Finished" ? "!border-(--border-finished)" : ""} !w-[40px] !min-w-[40px] cursor-pointer !border-l-0`}
                              onClick={() => {
                                const id = el.id ? String(el.id) : null;
                                c.setSelectedId((prev) =>
                                  prev === id ? null : id,
                                );
                              }}
                              onKeyDown={(e) => {
                                if (e.key === "Enter" || e.key === " ") {
                                  e.preventDefault();
                                  const id = el.id ? String(el.id) : null;
                                  c.setSelectedId((prev) =>
                                    prev === id ? null : id,
                                  );
                                }
                              }}
                              tabIndex={0}
                            >
                              <div className="flex items-center justify-center">
                                <Input
                                  type="radio"
                                  name="row-selector"
                                  checked={c.selectedId === String(el.id)}
                                  readOnly
                                />
                              </div>
                            </td>
                          )}

                          <TdCell
                            classNameAddition={`${el.status === "InProgress" ? "!border-(--border-inProgress)" : el.status === "Finished" ? "!border-(--border-finished)" : ""} min-w-fit whitespace-nowrap`}
                          >
                            {(() => {
                              const badge = c.getStatusBadge(el.status);

                              const nextStatus: MasterPlanElementStatus =
                                el.status === "InProgress"
                                  ? "Finished"
                                  : el.status === "Finished"
                                    ? "NotStarted"
                                    : "InProgress";

                              return (
                                // TEMP START!
                                <button
                                  className={`${badgeClass} ${badge.className} cursor-pointer`}
                                  onClick={() => {
                                    c.updateStatus(String(el.id), nextStatus);
                                  }}
                                  onTouchEnd={() => {
                                    c.updateStatus(String(el.id), nextStatus);
                                  }}
                                >
                                  {badge.label}
                                </button>
                                // TEMP END!

                                // <span
                                //   className={`${badgeClass} ${badge.className}`}
                                // >
                                //   {badge.label}
                                // </span>
                              );
                            })()}
                          </TdCell>

                          {c.fieldOptions
                            .filter((f) => !f.isHidden)
                            .map((f, i) => {
                              const val = c.getDisplayValue(el, f);
                              return (
                                <TdCell
                                  key={`${el.id}-${f.value}`}
                                  classNameAddition={`${
                                    i === c.fieldOptions.length - 1
                                      ? "w-full min-w-fit"
                                      : "min-w-fit whitespace-nowrap"
                                  } ${f.dataType?.toLowerCase() === "date" && c.isEditing ? "!min-w-[11rem]" : ""} ${c.isEditing ? "px-2!" : ""}  ${el.status === "InProgress" ? "!border-(--border-inProgress)" : el.status === "Finished" ? "!border-(--border-finished)" : ""} `}
                                >
                                  <div
                                    className={`flex w-full ${
                                      f.alignment === "Center"
                                        ? "justify-center"
                                        : f.alignment === "Right"
                                          ? "justify-end"
                                          : f.alignment === "Left"
                                            ? "justify-start"
                                            : "justify-start"
                                    }`}
                                  >
                                    {c.isEditing ? (
                                      <div
                                        className={`relative inline-flex w-full align-middle ${
                                          el.struckElement
                                            ? "line-through opacity-60"
                                            : ""
                                        } mb-2`}
                                      >
                                        <span className="invisible whitespace-pre">
                                          {val || " "}
                                        </span>
                                        <div className="absolute w-full">
                                          {(() => {
                                            const isIncremental =
                                              !!f.localIncremental ||
                                              !!f.globalIncremental;

                                            return (
                                              <Input
                                                type={
                                                  f.dataType?.toLowerCase() ===
                                                  "decimal"
                                                    ? "decimal"
                                                    : f.dataType?.toLowerCase() ===
                                                        "number"
                                                      ? "number"
                                                      : f.dataType?.toLowerCase() ===
                                                          "date"
                                                        ? "date"
                                                        : "text"
                                                }
                                                value={val || ""}
                                                readOnly={isIncremental}
                                                tabIndex={
                                                  isIncremental ? -1 : 0
                                                }
                                                onChange={(newValue) => {
                                                  if (isIncremental) {
                                                    return;
                                                  }

                                                  c.handleCellChange(
                                                    String(planId),
                                                    String(el.id),
                                                    f.id,
                                                    newValue as string,
                                                  );
                                                }}
                                                compactWithBorder
                                                classNameAddition={`${
                                                  el.struckElement
                                                    ? "line-through opacity-60 "
                                                    : ""
                                                } ${isIncremental ? "pointer-events-none opacity-70 " : ""}${
                                                  el.status === "InProgress"
                                                    ? "!border-(--border-main)"
                                                    : el.status === "Finished"
                                                      ? "!border-(--border-main)"
                                                      : "!border-(--border-main)"
                                                } bg-(--bg-main)`}
                                              />
                                            );
                                          })()}
                                        </div>
                                      </div>
                                    ) : (
                                      <span
                                        className={`${
                                          el.struckElement
                                            ? "line-through opacity-60"
                                            : ""
                                        } ${val ? "" : "text-(--text-secondary)"}`}
                                      >
                                        {val || "—"}
                                      </span>
                                    )}
                                  </div>
                                </TdCell>
                              );
                            })}
                        </tr>
                      );
                    });
                  })()
                )}
              </tbody>
            </table>
          </div>

          {/* --- PAGINATION --- */}
          <div className="flex w-full flex-wrap justify-between gap-x-12 gap-y-4">
            <span className="flex w-[175.23px] text-(--text-secondary)">
              {t("Manage/Viewing")} {(c.currentPage - 1) * c.itemsPerPage + 1}-
              {Math.min(c.currentPage * c.itemsPerPage, c.totalGroups)}{" "}
              {t("Manage/out of")} {c.totalGroups}
            </span>

            <div className="xs:w-auto flex w-full items-center">
              <button
                type="button"
                onClick={() => c.setCurrentPage((prev) => Math.max(prev - 1, 1))}
                disabled={c.currentPage === 1}
                className={iconButtonPrimaryClass}
              >
                <SmallerSolid.ChevronLeftIcon className="min-h-full min-w-full" />
              </button>

              <div className="flex flex-wrap items-center justify-center">
                {(() => {
                  const totalPages = Math.max(
                    1,
                    Math.ceil(c.totalGroups / c.itemsPerPage),
                  );
                  const pages: (number | string)[] = [];

                  if (totalPages <= 7) {
                    for (let i = 1; i <= totalPages; i++) pages.push(i);
                  } else if (c.currentPage <= 3) {
                    pages.push(1, 2, 3, 4, "...", totalPages);
                  } else if (c.currentPage >= totalPages - 2) {
                    pages.push(
                      1,
                      "...",
                      totalPages - 3,
                      totalPages - 2,
                      totalPages - 1,
                      totalPages,
                    );
                  } else {
                    pages.push(
                      1,
                      "...",
                      c.currentPage - 1,
                      c.currentPage,
                      c.currentPage + 1,
                      "...",
                      totalPages,
                    );
                  }

                  return pages.map((page, index) =>
                    page === "..." ? (
                      <span key={index} className="flex px-2">
                        ...
                      </span>
                    ) : (
                      <button
                        key={index}
                        onClick={() => c.setCurrentPage(Number(page))}
                        className={`${
                          c.currentPage === page
                            ? "bg-(--accent-color) text-(--text-main-reverse)"
                            : "hover:text-(--accent-color)"
                        } flex min-w-7 cursor-pointer justify-center rounded-full px-1 text-lg transition-colors duration-(--fast)`}
                      >
                        {page}
                      </button>
                    ),
                  );
                })()}
              </div>

              <button
                type="button"
                onClick={() =>
                  c.setCurrentPage((prev) =>
                    Math.min(prev + 1, Math.ceil(c.totalGroups / c.itemsPerPage)),
                  )
                }
                disabled={c.currentPage >= Math.ceil(c.totalGroups / c.itemsPerPage)}
                className={iconButtonPrimaryClass}
              >
                <SmallerSolid.ChevronRightIcon className="min-h-full min-w-full" />
              </button>
            </div>

            <div className="flex items-center gap-4">
              <span>{t("Manage/Amount")}</span>
              <div className="3xs:min-w-20">
                <SingleDropdown
                  options={[
                    { label: "4", value: "4" },
                    { label: "8", value: "8" },
                    { label: "16", value: "16" },
                    { label: "32", value: "32" },
                  ]}
                  value={String(c.itemsPerPage)}
                  onChange={(val) => {
                    const newPageSize = Number(val);
                    c.setItemsPerPage(newPageSize);
                    c.setCurrentPage(1);
                  }}
                  showAbove
                />
              </div>
            </div>
          </div>
        </div>
      </div>
    </FocusTrap>
  );
};

export default MasterPlanClient;
