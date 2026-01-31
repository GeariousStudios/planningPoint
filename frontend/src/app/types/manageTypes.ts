import useTN from "@/app/hooks/useTN";
import { TranslateFn } from "../helpers/textUtils";

// --- developer/manage/users/UsersClient.tsx ---
export type UserItem = {
  id: number;
  username: string;
  firstName: string;
  lastName: string;
  email: string;
  password: string;
  roles: string[];
  isLocked: boolean;

  isOnline: boolean;
  creationDate: string;
  lastLogin: string | null;
};

export type UserFilters = {
  roles?: string[];
  isLocked?: boolean;
};

// --- admin/manage/units/categories/CategoriesClient.tsx ---
export type CategoryItem = {
  id: number;
  name: string;
  subCategories: string[];
  units: {
    id: number;
    name: string;
    categoryId?: number;
    unitGroupName?: string;
    lightColorHex: string;
    darkColorHex: string;
    reverseColor?: boolean;
    lightTextColorHex: string;
    darkTextColorHex: string;
  }[];

  creationDate: string;
  updateDate: string;
  createdBy: string;
  updatedBy: string;
};

export type CategoryFilters = {
  unitIds?: number[];
  hasSubCategories?: boolean;
};

// --- admin/manage/units/unit-columns/UnitColumnsClient.tsx ---
export type UnitColumnDataType =
  | "Number"
  | "Decimal"
  | "Text"
  | "TextField"
  | "Boolean";
export const getUnitColumnDataTypeOptions = (t: TranslateFn) => [
  {
    label: t("common.number", { capitalize: true }),
    value: "Number" as UnitColumnDataType,
  },
  {
    label: t("common.decimal", { capitalize: true }),
    value: "Decimal" as UnitColumnDataType,
  },
  {
    label: t("common.text", { capitalize: true }),
    value: "Text" as UnitColumnDataType,
  },
  {
    label: t("common.textField", { capitalize: true }),
    value: "TextField" as UnitColumnDataType,
  },
  // {
  //   label: t("common.boolean", { capitalize: true }),
  //   value: "Boolean" as UnitColumnDataType,
  // },
];

export type UnitColumnItem = {
  id: number;
  name: string;
  dataType: UnitColumnDataType;
  hasData: boolean;
  perHour: boolean;
  perHourName?: string;
  units: string[];

  creationDate: string;
  updateDate: string;
  createdBy: string;
  updatedBy: string;
};

export type UnitColumnFilters = {
  dataTypes?: UnitColumnDataType[];
  hasData?: boolean;
  unitIds?: number[];
};

// --- admin/manage/units/unit-groups/UnitGroupsClient.tsx ---
export type UnitGroupItem = {
  id: number;
  name: string;
  unitGroup: string;
  units: {
    id: number;
    name: string;
    lightColorHex: string;
    darkColorHex: string;
    reverseColor?: boolean;
    lightTextColorHex: string;
    darkTextColorHex: string;
  }[];

  creationDate: string;
  updateDate: string;
  createdBy: string;
  updatedBy: string;
};

export type UnitGroupFilters = {
  unitIds?: number[];
};

// --- admin/manage/units/UnitsClient.tsx ---
export type UnitItem = {
  id: number;
  name: string;
  unitGroupName: string;
  unitColumnIds: number[];
  categoryIds: number[];
  shiftIds: number[];
  isHidden?: boolean;
  isPlannable?: boolean;
  masterPlanName: string;
  lightColorHex: string;
  darkColorHex: string;
  reverseColor?: boolean;
  lightTextColorHex: string;
  darkTextColorHex: string;

  creationDate: string;
  updateDate: string;
  createdBy: string;
  updatedBy: string;
};

export type UnitFilters = {
  unitGroupIds?: number[];
  unitColumnIds?: number[];
  categoryIds?: number[];
  shiftIds?: number[];
  isPlannable?: boolean;
  masterPlanIds?: number[];
  isHidden?: boolean;
};

// --- admin/manage/news/NewsTypesClient.tsx ---
export type NewsTypeItem = {
  id: number;
  name: string;

  creationDate: string;
  updateDate: string;
  createdBy: string;
  updatedBy: string;
};

export type NewsTypeFilters = {};

// --- admin/manage/shifts/ShiftsClient.tsx ---
export type ShiftItem = {
  id: number;
  name: string;
  units: {
    id: number;
    name: string;
    lightColorHex: string;
    darkColorHex: string;
    reverseColor?: boolean;
    lightTextColorHex: string;
    darkTextColorHex: string;
  }[];
  shiftTeams: {
    id: number;
    name: string;
    lightColorHex: string;
    darkColorHex: string;
    reverseColor?: boolean;
    lightTextColorHex: string;
    darkTextColorHex: string;
  }[];
  isHidden?: boolean;
  lightColorHex: string;
  darkColorHex: string;
  reverseColor?: boolean;
  lightTextColorHex: string;
  darkTextColorHex: string;

  creationDate: string;
  updateDate: string;
  createdBy: string;
  updatedBy: string;
};

export type ShiftFilters = {
  unitIds?: number[];
  shiftTeamIds?: number[];
  isHidden?: boolean;
};

// --- admin/manage/shifts/shift-teams/ShiftTeamsClient.tsx ---
export type ShiftTeamItem = {
  id: number;
  name: string;
  shifts: {
    id: number;
    name: string;
    lightColorHex: string;
    darkColorHex: string;
    reverseColor?: boolean;
    lightTextColorHex: string;
    darkTextColorHex: string;
  }[];
  isHidden?: boolean;
  lightColorHex: string;
  darkColorHex: string;
  reverseColor?: boolean;
  lightTextColorHex: string;
  darkTextColorHex: string;

  creationDate: string;
  updateDate: string;
  createdBy: string;
  updatedBy: string;
};

export type ShiftTeamFilters = {
  shiftIds?: number[];
  isHidden?: boolean;
};

// --- admin/manage/plan/planned-stops/PlannedStopsClient.tsx ---
export type PlannedStopItem = {
  id: number;
  name: string;
  masterPlans: {
    id: number;
    name: string;
  }[];
  lightColorHex: string;
  darkColorHex: string;
  reverseColor?: boolean;
  lightTextColorHex: string;
  darkTextColorHex: string;
  isHidden?: boolean;

  creationDate: string;
  updateDate: string;
  createdBy: string;
  updatedBy: string;
};

export type PlannedStopFilters = {
  masterPlanIds?: number[];
  isHidden?: boolean;
};

// --- admin/manage/plan/master-plans/MasterPlansClient.tsx ---
export type MasterPlanItem = {
  id: number;
  name: string;
  unitGroupName: string;
  units: {
    id: number;
    name: string;
    lightColorHex: string;
    darkColorHex: string;
    reverseColor?: boolean;
    lightTextColorHex: string;
    darkTextColorHex: string;
  }[];
  fields: {
    id: number;
    name: string;
  }[];
  operationalPlans: {
    id: number;
    name: string;
  }[];
  isHidden?: boolean;
  allowRemovingElements?: boolean;
  allowImport?: boolean;
  productCount: number;
  plannedStopCount: number;

  creationDate: string;
  updateDate: string;
  createdBy: string;
  updatedBy: string;
};

export type MasterPlanFilters = {
  unitIds?: number[];
  operationalPlanIds?: number[];
  unitGroupIds?: number[];
  masterPlanFieldIds?: number[];
  productIds?: number[];
  plannedStopIds?: number[];
  isHidden?: boolean;
  allowRemovingElements?: boolean;
  allowImport?: boolean;
};

// --- admin/manage/plan/master-plan-fields/MasterPlanFieldsClient.tsx ---
export type MasterPlanFieldItem = {
  id: number;
  name: string;
  masterPlanIds: number[];
  dataType: MasterPlanFieldDataType;
  alignment: "Left" | "Center" | "Right";
  isHidden: boolean;

  creationDate: string;
  updateDate: string;
  createdBy: string;
  updatedBy: string;
};

export type MasterPlanFieldFilters = {
  dataTypes?: MasterPlanFieldDataType[];
  alignments?: ("Left" | "Center" | "Right")[];
  masterPlanIds?: number[];
  isHidden?: boolean;
};

export type MasterPlanFieldDataType =
  | "Number"
  | "Decimal"
  | "Text"
  | "Boolean"
  | "Date";
export const getMasterPlanFieldDataTypeOptions = (t: TranslateFn) => [
  {
    label: t("common.number", { capitalize: true }),
    value: "Number" as MasterPlanFieldDataType,
  },
  {
    label: t("common.decimal", { capitalize: true }),
    value: "Decimal" as MasterPlanFieldDataType,
  },
  {
    label: t("common.text", { capitalize: true }),
    value: "Text" as MasterPlanFieldDataType,
  },
  // {
  //   label: t("common.boolean", { capitalize: true }),
  //   value: "Boolean" as MasterPlanFieldDataType,
  // },
  {
    label: t("time.date", { capitalize: true }),
    value: "Date" as MasterPlanFieldDataType,
  },
];

export type MasterPlanFieldAlignment = "Left" | "Center" | "Right";
export const getMasterPlanFieldAlignmentOptions = (t: TranslateFn) => [
  {
    label: t("common.left", { capitalize: true }),
    value: "Left" as MasterPlanFieldAlignment,
  },
  {
    label: t("common.center", { capitalize: true }),
    value: "Center" as MasterPlanFieldAlignment,
  },
  {
    label: t("common.right", { capitalize: true }),
    value: "Right" as MasterPlanFieldAlignment,
  },
];

// --- admin/manage/plan/operational-plans/OperationalPlansClient.tsx ---
export type OperationalPlanItem = {
  id: number;
  name: string;
  unitGroupName: string;
  masterPlanName: string;
  isHidden?: boolean;

  creationDate: string;
  updateDate: string;
  createdBy: string;
  updatedBy: string;
};

export type OperationalPlanFilters = {
  unitGroupIds?: number[];
  masterPlanIds?: number[];
  isHidden?: boolean;
};

// --- admin/manage/plan/products/ProductsClient.tsx ---
export type ProductItem = {
  id: number;
  name: string;
  masterPlans: {
    id: number;
    name: string;
  }[];
  masterPlanFields: {
    id: number;
    name: string;
  }[];
  isHidden?: boolean;

  creationDate: string;
  updateDate: string;
  createdBy: string;
  updatedBy: string;
};

export type ProductFilters = {
  masterPlanIds?: number[];
  masterPlanFieldIds?: number[];
  isHidden?: boolean;
};

// --- admin/manage/plan/products/product-groups/ProductGroupsClient.tsx ---
export type ProductGroupItem = {
  id: number;
  name: string;
  masterPlans: {
    id: number;
    name: string;
  }[];
  products: {
    id: number;
    name: string;
  }[];
  isHidden?: boolean;

  creationDate: string;
  updateDate: string;
  createdBy: string;
  updatedBy: string;
};

export type ProductGroupFilters = {
  masterPlanIds?: number[];
  productIds?: number[];
  isHidden?: boolean;
};
