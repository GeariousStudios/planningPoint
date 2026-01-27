// --- UserModal ---
export const userConstraints = {
  firstName: { maxLength: 32 },
  lastName: { maxLength: 32 },
  username: { maxLength: 32, pattern: "^\\S+$" },
  password: { minLength: 8, maxLength: 128, pattern: "^\\S+$" },
  email: { maxLength: 320 },
};

// --- NewsTypeModal ---
export const newsTypeConstraints = {
  name: { maxLength: 64 },
};

// --- CategoryModal ---
export const categoryConstraints = {
  name: { maxLength: 64 },
  subCategoryName: { maxLength: 64 },
};

// --- UnitColumnModal ---
export const unitColumnConstraints = {
  name: { maxLength: 64 },
  comparisonText: { maxLength: 64 },
};

// --- UnitGroupModal ---
export const unitGroupConstraints = {
  name: { maxLength: 64 },
};

// --- UnitModal ---
export const unitConstraints = {
  name: { maxLength: 64 },
  colorHex: { pattern: /^#([0-9A-Fa-f]{6})$/ },
};

// --- ShiftModal ---
export const shiftConstraints = {
  name: { maxLength: 64 },
  displayName: { maxLength: 64 },
  colorHex: { pattern: /^#([0-9A-Fa-f]{6})$/ },
};

// --- ShiftTeamModal ---
export const shiftTeamConstraints = {
  name: { maxLength: 64 },
  colorHex: { pattern: /^#([0-9A-Fa-f]{6})$/ },
};

// --- TrendingPanel ---
export const trendingPanelConstraints = {
  name: { maxLength: 64 },
};

// --- PlannedStopModal ---
export const plannedStopConstraints = {
  name: { maxLength: 64 },
  colorHex: { pattern: /^#([0-9A-Fa-f]{6})$/ },
};

// --- MasterPlanModal ---
export const masterPlanConstraints = {
  name: { maxLength: 64 },
};

// --- MasterPlanFieldModal ---
export const masterPlanFieldConstraints = {
  name: { maxLength: 64 },
};

// --- OperationalPlanModal ---
export const operationalPlanConstraints = {
  name: { maxLength: 64 },
  productColorHex: { pattern: /^#([0-9A-Fa-f]{6})$/ },
};

// --- ProductModal ---
export const productConstraints = {
  name: { maxLength: 64 },
};

// --- ProductGroupModal ---
export const productGroupConstraints = {
  name: { maxLength: 64 },
};
