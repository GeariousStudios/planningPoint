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

  if (c.canShowLock) {
    return <Message icon="lock" content="lock" fullscreen />;
  }

  if (c.canShowInvalid) {
    return <Message content="invalid" fullscreen />;
  }

  if (!c.isReady) {
    return null;
  }

  const {
    setIsCheckingOut,
    setIsCheckingIn,
    isCheckingOut,
    isCheckingIn,
    isLoading,
    isManualRefresh,
    requestRefetch,
    masterPlans,
    fieldOptions,
    totalGroups,
    currentPage,
    itemsPerPage,
    isEditing,
    isStrikeMode,
    handleAddElement,
    handleCellChange,
    toggleStrikeThrough,
    handleSave,
    handleAbortChanges,
    handleCheck,
    setIsManualRefresh,
    setCurrentPage,
    setItemsPerPage,
    visibleElements,
    checkedOutBy,
    checkedOutByMe,
    toggleRemoveElement,
    removedElementIds,
    constraintsRef,
    dragControls,
    selectedId,
    setSelectedId,
    editMode,
    setEditMode,
    isKeepSeparate,
    setIsKeepSeparate,
    showForceColor,
    isSelectedStruck,
    handleHoldStart,
    handleHoldEnd,
    duplicateSelected,
    handleImport,
    importing,
    handleExport,
    exporting,
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
  } = c;

  ensureRefs(filters.length);

  return (
    <>
      {isEditing && (
        <div className="pointer-events-none">
          <div className="fixed inset-0 z-[calc(var(--z-edit)-2)] bg-(--bg-main) opacity-90" />

          <div className="pointer-events-none fixed inset-0 z-[calc(var(--z-edit)+1)] border-6 border-(--edit-mode)" />

          <div className="fixed top-0 left-0 z-(--z-edit) w-full bg-(--edit-mode) py-2 text-center text-lg font-semibold tracking-wide text-(--text-main-reverse)">
            {t("Common/Editing")} {t("Common/master plan")}
          </div>
        </div>
      )}

      <div
        className={`grid gap-4 ${isEditing ? "relative z-[calc(var(--z-edit)-1)]" : ""}`}
      >
        {/* --- CHECKING BAR --- */}
        {props.isMasterPlanner && (
          <>
            <div className="flex w-full flex-wrap items-center justify-between gap-4">
              <div className="flex flex-wrap gap-4">
                <CustomTooltip
                  content={`${isViewingRevision ? t("MasterPlan/Viewing revision tooltip") : ""}`}
                  showOnTouch
                  shortDelay
                >
                  <button
                    className={` ${buttonPrimaryClass} group lg:w-max lg:px-4 ${
                      isEditing
                        ? "!bg-(--note-success) text-(--text-main-reverse) hover:!bg-(--note-success-hover)"
                        : showForceColor
                          ? "!bg-(--note-error) text-(--text-main-reverse) hover:!bg-(--note-error-hover)"
                          : ""
                    } `}
                    disabled={
                      isCheckingOut ||
                      isCheckingIn ||
                      isLoading ||
                      isViewingRevision
                    }
                    onClick={() => {
                      setStatusFilters([]);

                      if (!isEditing) {
                        if (checkedOutBy && !checkedOutByMe) {
                          setIsCheckingOut(true);
                          handleCheck(true);
                        } else {
                          setIsCheckingOut(true);
                          handleCheck(false);
                        }
                      } else {
                        setIsCheckingIn(true);
                        setIsKeepSeparate(false);
                        handleSave();
                      }
                    }}
                  >
                    <div className="flex items-center justify-center gap-2 truncate">
                      {(isCheckingOut || isCheckingIn) && (
                        <Outline.ArrowPathIcon className="h-6 w-6 motion-safe:animate-[spin_1s_linear_infinite]" />
                      )}

                      {!isCheckingOut && !isCheckingIn && (
                        <HoverIcon
                          outline={
                            isEditing
                              ? Outline.CheckIcon
                              : showForceColor
                                ? Outline.ExclamationTriangleIcon
                                : Outline.PencilIcon
                          }
                          solid={
                            isEditing
                              ? Solid.CheckIcon
                              : showForceColor
                                ? Solid.ExclamationTriangleIcon
                                : Solid.PencilIcon
                          }
                          className="h-6 w-6"
                        />
                      )}

                      <span className="hidden lg:block">
                        {isCheckingOut || isCheckingIn
                          ? isEditing && isCheckingIn
                            ? t("MasterPlan/Checking in")
                            : isCheckingOut
                              ? t("MasterPlan/Checking out")
                              : t("MasterPlan/Checking in")
                          : showForceColor
                            ? t("MasterPlan/Force checkout")
                            : isEditing
                              ? t("MasterPlan/Save and push")
                              : t("MasterPlan/Edit master plan")}
                      </span>
                    </div>
                  </button>
                </CustomTooltip>

                {/* --- Abort --- */}
                {isEditing && !isCheckingIn && (
                  <button
                    className={`${buttonSecondaryClass} group lg:w-max lg:px-4`}
                    disabled={isCheckingIn}
                    onClick={() => {
                      setIsCheckingIn(true);
                      setIsKeepSeparate(false);
                      handleAbortChanges();
                    }}
                  >
                    <div className="flex items-center justify-center gap-2 truncate">
                      {isCheckingIn ? (
                        <Outline.ArrowPathIcon className="h-6 w-6 motion-safe:animate-[spin_1s_linear_infinite]" />
                      ) : (
                        <HoverIcon
                          outline={Outline.XMarkIcon}
                          solid={Solid.XMarkIcon}
                          className="h-6 w-6"
                        />
                      )}
                      <span className="hidden lg:block">
                        {isCheckingIn
                          ? t("MasterPlan/Checking in")
                          : t("MasterPlan/Abort changes")}
                      </span>
                    </div>
                  </button>
                )}
              </div>

              {!isEditing && !isCheckingOut && !isCheckingIn && (
                <div className="ml-auto flex flex-wrap gap-4">
                  <button
                    className={`${buttonSecondaryClass} lg:w-max lg:px-4`}
                    onClick={() => {
                      handleExport();
                    }}
                    disabled={exporting || isLoading}
                  >
                    {exporting ? (
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
                        ...revisions.map((r) => ({
                          label: `${r.label} (${new Date(r.archivedAt).toLocaleString()})`,
                          value: String(r.id),
                        })),
                      ]}
                      value={selectedRevisionId}
                      onChange={(val) => selectRevision(String(val))}
                    />
                  </div>
                </div>
              )}

              {/* --- Import --- */}
              {isEditing && !isCheckingIn && masterPlans[0]?.allowImport && (
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

                      handleImport(file);
                      e.currentTarget.value = "";
                    }}
                  />

                  <button
                    className={`${buttonSecondaryClass} lg:w-max lg:px-4`}
                    onClick={() => {
                      document.getElementById("excel-import-input")?.click();
                    }}
                    disabled={importing}
                  >
                    {importing ? (
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
            {checkedOutBy && !isEditing && !isCheckingOut && !isCheckingIn && (
              <p className="text-sm text-(--text-secondary)">
                {t("MasterPlan/Checked out by")}:{" "}
                <span className="font-medium">{checkedOutBy}</span>
              </p>
            )}

            {/* --- ACTION BAR --- */}
            {isEditing && (
              <div
                ref={constraintsRef}
                className="pointer-events-none fixed inset-0 z-[calc(var(--z-edit)+1)]"
              >
                <motion.div
                  drag
                  dragControls={dragControls}
                  dragListener={false}
                  dragMomentum={false}
                  dragElastic={0}
                  dragConstraints={constraintsRef}
                  className="pointer-events-auto absolute bottom-4 mx-4 flex w-fit flex-col gap-4 rounded-2xl bg-(--bg-modal) p-4 shadow-[0_0_16px_0_rgba(0,0,0,0.125)] lg:left-1/2 lg:-translate-x-1/2"
                  style={{ touchAction: "none" }}
                >
                  <div
                    className="flex cursor-move items-center justify-between gap-4"
                    onPointerDown={(e) => {
                      document.body.style.userSelect = "none";
                      dragControls.start(e);
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
                    {/* --- Don't join groups --- */}
                    <div
                      className={`${editMode === "group" ? "cursor-not-allowed opacity-25" : ""}`}
                    >
                      <CustomTooltip
                        content={`${editMode === "element" ? t("MasterPlan/Do not join groups tooltip") : ""}`}
                        showOnTouch
                        longDelay
                      >
                        <div className="flex items-center gap-2 truncate">
                          <button
                            type="button"
                            role="switch"
                            aria-checked={isKeepSeparate}
                            className={`${switchClass(isKeepSeparate)} `}
                            onClick={() => setIsKeepSeparate((prev) => !prev)}
                            disabled={editMode === "group"}
                          >
                            <div className={switchKnobClass(isKeepSeparate)} />
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
                          className={`${editMode === "element" ? `${textPrimaryButtonClass} underline` : `${textSecondaryButtonClass}`}`}
                          onClick={() => setEditMode("element")}
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
                          className={`${editMode === "group" ? `${textPrimaryButtonClass} underline` : `${textSecondaryButtonClass}`}`}
                          onClick={() => {
                            setEditMode("group");
                            setIsKeepSeparate(false);
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
                      {/* --- Add element --- */}
                      <CustomTooltip
                        content={t("MasterPlan/Add element tooltip")}
                        showOnTouch
                        longDelay
                      >
                        <button
                          className={`${buttonPrimaryClass} group col-span-2 flex w-full items-center justify-center gap-2 lg:px-4`}
                          onClick={() => {
                            const topGroup =
                              editMode === "group"
                                ? (masterPlans[0]?.elements?.[0]?.groupId ??
                                  null)
                                : null;
                            handleAddElement(
                              masterPlans[0]?.id as number,
                              topGroup,
                            );
                          }}
                        >
                          <HoverIcon
                            outline={Outline.PlusIcon}
                            solid={Solid.PlusIcon}
                            className="h-6 w-6"
                          />
                          {t("MasterPlan/Add element")}
                        </button>
                      </CustomTooltip>

                      {/* --- Duplicate object */}
                      <CustomTooltip
                        content={t("MasterPlan/Tooltip duplicate object")}
                        showOnTouch
                        longDelay
                      >
                        <button
                          className={`${buttonSecondaryClass} group col-span-1 flex items-center justify-center gap-2 lg:w-full lg:px-4`}
                          onClick={() => {
                            if (selectedId !== null) {
                              duplicateSelected(
                                String(masterPlans[0]?.id),
                                selectedId,
                                editMode,
                              );
                            }
                          }}
                          disabled={selectedId === null}
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
                          onMouseDown={() => handleHoldStart("up")}
                          onMouseUp={handleHoldEnd}
                          onMouseLeave={handleHoldEnd}
                          disabled={selectedId === null}
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
                          onMouseDown={() => handleHoldStart("down")}
                          onMouseUp={handleHoldEnd}
                          onMouseLeave={handleHoldEnd}
                          disabled={selectedId === null}
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
                      className={`${masterPlans[0]?.allowRemovingElements ? "lg:grid-cols-3" : ""} flex gap-4 lg:grid`}
                    >
                      {/* --- Strike mode --- */}
                      <CustomTooltip
                        content={t("MasterPlan/Strike tooltip")}
                        showOnTouch
                        longDelay
                      >
                        <button
                          className={`${
                            isSelectedStruck
                              ? buttonPrimaryClass
                              : buttonSecondaryClass
                          } ${masterPlans[0]?.allowRemovingElements ? "lg:w-full" : "w-full"} group col-span-1 flex items-center justify-center gap-2 lg:px-4`}
                          onClick={() => {
                            if (selectedId !== null) {
                              toggleStrikeThrough(String(selectedId), editMode);
                            }
                          }}
                          disabled={selectedId === null}
                        >
                          <HoverIcon
                            outline={Outline.NoSymbolIcon}
                            solid={Solid.NoSymbolIcon}
                            className="h-6 w-6"
                          />
                          <span
                            className={`${masterPlans[0]?.allowRemovingElements ? "hidden lg:block" : ""}`}
                          >
                            {t("MasterPlan/Strike")}
                          </span>
                        </button>
                      </CustomTooltip>

                      {/* --- Delete element --- */}
                      {masterPlans[0]?.allowRemovingElements && (
                        <CustomTooltip
                          content={t("MasterPlan/Mark for deletion tooltip")}
                          showOnTouch
                          longDelay
                        >
                          <button
                            className={`${
                              selectedId !== null &&
                              removedElementIds.some(
                                (id) => String(id) === String(selectedId),
                              )
                                ? buttonDeletePrimaryClass
                                : buttonDeleteSecondaryClass
                            } group col-span-2 flex w-full items-center justify-center gap-2 px-4`}
                            onClick={() => {
                              if (selectedId !== null) {
                                toggleRemoveElement(
                                  String(selectedId),
                                  editMode,
                                );
                              }
                            }}
                            disabled={selectedId === null}
                          >
                            <HoverIcon
                              outline={Outline.TrashIcon}
                              solid={Solid.TrashIcon}
                              className="h-6 w-6"
                            />
                            {selectedId !== null &&
                            removedElementIds.some(
                              (id) => String(id) === String(selectedId),
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
        {!isEditing && !isCheckingOut && !isCheckingIn && (
          <div className="flex flex-col flex-wrap gap-4">
            {!props.isMasterPlanner && (
              <div className="ml-auto flex flex-wrap gap-4">
                <button
                  className={`${buttonSecondaryClass} lg:w-max lg:px-4`}
                  onClick={() => {
                    handleExport();
                  }}
                  disabled={exporting || isLoading}
                >
                  {exporting ? (
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
                      ...revisions.map((r) => ({
                        label: `${r.label} (${new Date(r.archivedAt).toLocaleString()})`,
                        value: String(r.id),
                      })),
                    ]}
                    value={selectedRevisionId}
                    onChange={(val) => selectRevision(String(val))}
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
                    value={searchTerm}
                    onChange={(val) => setSearchTerm(String(val))}
                  />
                </div>
              </div>

              <div className="2xs:flex hidden flex-wrap gap-4">
                <div className="flex gap-4">
                  {filters.map((group, i) => (
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

              {filters.length > 0 && (
                <div className="relative">
                  <CustomTooltip
                    content={t("Manage/All filters")}
                    lgHidden
                    longDelay
                    showOnTouch
                  >
                    <button
                      className={`${roundedButtonClass} group xs:w-auto xs:px-4 gap-2`}
                      onClick={() => setFilterAllOpen(true)}
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
                    isOpen={filterAllOpen}
                    onClose={() => setFilterAllOpen(false)}
                    label={t("Manage/All filters")}
                  >
                    <div className="flex h-full flex-col justify-between">
                      <div className="flex flex-col">
                        {filters.map((group, i) => (
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
                          onClick={() => setFilterAllOpen(false)}
                          className={`${buttonPrimaryClass} w-full`}
                        >
                          {t("Manage/View")}{" "}
                          <span className="font-normal">
                            {totalGroups ?? 0}
                          </span>
                        </button>
                        <button
                          onClick={() => clearFilters()}
                          className={`${buttonSecondaryClass} w-full`}
                          disabled={
                            !filters.some((g) =>
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

            {filterChips.length > 0 && (
              <div className="flex flex-wrap gap-4">
                <span className="flex items-center font-semibold text-(--text-secondary)">
                  {t("Manage/Active filters")}:
                </span>

                {filterChips.map((chip, idx) => (
                  <FilterChip
                    key={idx}
                    onClickEvent={chip.onClear}
                    label={chip.label}
                  />
                ))}

                <button
                  className="group w-auto cursor-pointer rounded-full px-4 transition-colors duration-(--fast) hover:bg-(--bg-navbar-link)"
                  onClick={() => clearFilters()}
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
        <div className="relative w-full overflow-x-auto rounded border border-(--border-main)">
          <table className="table w-full min-w-6xl table-auto border-collapse">
            <thead className="bg-(--bg-grid-header)">
              <tr>
                {/* <ThCell
                label="ID"
                sortable={false}
                classNameAddition="min-w-fit whitespace-nowrap px-4"
              /> */}
                {isEditing && (
                  <th
                    className={`${thClass} pointer-events-none !w-[40px] !min-w-[40px] !border-l-0`}
                  />
                )}

                <ThCell
                  label={
                    <div className="flex flex-wrap items-center gap-2">
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

                {fieldOptions
                  .filter((f) => !f.isHidden)
                  .map((f, i) => (
                    <ThCell
                      key={f.value}
                      label={f.label}
                      sortable={false}
                      classNameAddition={`${
                        i === fieldOptions.length - 1
                          ? "w-full min-w-fit"
                          : "min-w-fit whitespace-nowrap"
                      } px-4`}
                    />
                  ))}
              </tr>
            </thead>

            <tbody>
              {isLoading ? (
                <tr>
                  <td
                    colSpan={fieldOptions.length || 1}
                    className="h-57 text-center text-(--text-secondary)"
                  >
                    <Message icon="loading" content={t("Message/Content")} />
                  </td>
                </tr>
              ) : (
                (() => {
                  let currentIsEven = false;
                  let lastGroupId: number | string | null = null;

                  return visibleElements.map((el, index) => {
                    const planId = masterPlans[0]?.id;

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
                      selectedId === el.id
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
                          removedElementIds.includes(el.id)
                            ? "!bg-(--button-delete) text-(--text-main-reverse)"
                            : ""
                        } ${isStrikeMode ? "cursor-pointer" : ""} transition-[background] duration-(--fast)`}
                      >
                        {/* <TdCell classNameAddition="min-w-fit whitespace-nowrap px-4 text-(--text-secondary)">
                        {String(el.id)}
                      </TdCell> */}

                        {isEditing && (
                          <td
                            className={`${tdClass} !w-[40px] !min-w-[40px] cursor-pointer !border-l-0`}
                            onClick={() => {
                              const id = el.id ? String(el.id) : null;
                              setSelectedId((prev) =>
                                prev === id ? null : id,
                              );
                            }}
                            onKeyDown={(e) => {
                              if (e.key === "Enter" || e.key === " ") {
                                e.preventDefault();
                                const id = el.id ? String(el.id) : null;
                                setSelectedId((prev) =>
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
                                checked={selectedId === String(el.id)}
                                readOnly
                              />
                            </div>
                          </td>
                        )}

                        <TdCell
                          classNameAddition={`${el.status === "InProgress" ? "!border-(--border-inProgress)" : el.status === "Finished" ? "!border-(--border-finished)" : ""} min-w-fit whitespace-nowrap`}
                        >
                          {(() => {
                            const badge = getStatusBadge(el.status);

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
                                  updateStatus(String(el.id), nextStatus);
                                }}
                                onTouchEnd={() => {
                                  updateStatus(String(el.id), nextStatus);
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

                        {fieldOptions
                          .filter((f) => !f.isHidden)
                          .map((f, i) => {
                            const val =
                              el.values?.find(
                                (v: any) => v.masterPlanFieldId === f.id,
                              )?.value ?? "";
                            return (
                              <TdCell
                                key={`${el.id}-${f.value}`}
                                classNameAddition={`${
                                  i === fieldOptions.length - 1
                                    ? "w-full min-w-fit"
                                    : "min-w-fit whitespace-nowrap"
                                } ${f.dataType?.toLowerCase() === "date" && isEditing ? "!min-w-[11rem]" : ""} ${isEditing ? "px-2!" : ""}  ${el.status === "InProgress" ? "!border-(--border-inProgress)" : el.status === "Finished" ? "!border-(--border-finished)" : ""} `}
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
                                  {isEditing ? (
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
                                        <Input
                                          type={
                                            f.dataType?.toLowerCase() ===
                                            "number"
                                              ? "number"
                                              : f.dataType?.toLowerCase() ===
                                                  "date"
                                                ? "date"
                                                : "text"
                                          }
                                          value={val || ""}
                                          onChange={(newValue) => {
                                            handleCellChange(
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
                                          } ${
                                            el.status === "InProgress"
                                              ? "!border-(--border-main)"
                                              : el.status === "Finished"
                                                ? "!border-(--border-main)"
                                                : "!border-(--border-main)"
                                          } bg-(--bg-main)`}
                                        />
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
            {t("Manage/Viewing")} {(currentPage - 1) * itemsPerPage + 1}-
            {Math.min(currentPage * itemsPerPage, totalGroups)}{" "}
            {t("Manage/out of")} {totalGroups}
          </span>

          <div className="xs:w-auto flex w-full items-center">
            <button
              type="button"
              onClick={() => setCurrentPage((prev) => Math.max(prev - 1, 1))}
              disabled={currentPage === 1}
              className={iconButtonPrimaryClass}
            >
              <SmallerSolid.ChevronLeftIcon className="min-h-full min-w-full" />
            </button>

            <div className="flex flex-wrap items-center justify-center">
              {(() => {
                const totalPages = Math.max(
                  1,
                  Math.ceil(totalGroups / itemsPerPage),
                );
                const pages: (number | string)[] = [];

                if (totalPages <= 7) {
                  for (let i = 1; i <= totalPages; i++) pages.push(i);
                } else if (currentPage <= 3) {
                  pages.push(1, 2, 3, 4, "...", totalPages);
                } else if (currentPage >= totalPages - 2) {
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
                    currentPage - 1,
                    currentPage,
                    currentPage + 1,
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
                      onClick={() => setCurrentPage(Number(page))}
                      className={`${
                        currentPage === page
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
                setCurrentPage((prev) =>
                  Math.min(prev + 1, Math.ceil(totalGroups / itemsPerPage)),
                )
              }
              disabled={currentPage >= Math.ceil(totalGroups / itemsPerPage)}
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
                value={String(itemsPerPage)}
                onChange={(val) => {
                  const newPageSize = Number(val);
                  setItemsPerPage(newPageSize);
                  setCurrentPage(1);
                }}
                showAbove
              />
            </div>
          </div>
        </div>
      </div>
    </>
  );
};

export default MasterPlanClient;
