"use client";

import { ReactNode, useEffect, useMemo, useRef, useState } from "react";
import Navbar from "../components/navbar/Navbar";
import Topbar from "../components/topbar/Topbar";
import { usePathname } from "next/navigation";
<<<<<<< Updated upstream
import { useLocale, useTranslations } from "next-intl";
=======
import { useLocale } from "next-intl";
import useTN from "../hooks/useTN";
>>>>>>> Stashed changes

type Props = {
  children: ReactNode;
};

type BreadcrumbChild = {
  label: string;
  href: string;
  clickable: boolean;
  isActive: boolean;
};

type Breadcrumb = {
  label: string;
  href: string;
  clickable: boolean;
  isActive: boolean;
  children?: BreadcrumbChild[];
};

const sameCrumbs = (a?: Breadcrumb[], b?: Breadcrumb[]) =>
  JSON.stringify(a) === JSON.stringify(b);

const LayoutWrapper = (props: Props) => {
  const t = useTN();

  // --- REFS ---
  const lastPathRef = useRef<string>("");

  // --- STATES ---
  const [hasScrollbar, setHasScrollbar] = useState(false);
  const [navbarHidden, setNavbarHidden] = useState(() => {
    if (typeof window !== "undefined") {
      return window.matchMedia("(max-width: 767px)").matches;
    }
    return false;
  });
  const [isEditingFavourites, setIsEditingFavourites] = useState(false);

  const [unitName, setUnitName] = useState<string | null>(null);
  const [unitGroupId, setUnitGroupId] = useState<string | null>(null);
  const [unitGroupName, setUnitGroupName] = useState<string | null>(null);

  const [breadcrumbs, setBreadcrumbs] = useState<Breadcrumb[] | undefined>(
    undefined,
  );
  const [breadcrumbsReady, setBreadcrumbsReady] = useState(false);

  // --- OTHER ---
  const pathname = usePathname();
  const apiUrl = process.env.NEXT_PUBLIC_API_URL;
  const parts = pathname.split("/").filter(Boolean);
  const [breadcrumbsLoading, setBreadcrumbsLoading] = useState(true);
  const locale = useLocale();

  // --- IF UNIT, MASTER PLAN OR OPERATIONAL PLAN, GET UNIT/MASTER PLAN/OPERATIONAL PLAN/GROUP INFO ---
  useEffect(() => {
    if (parts.length >= 3 && parts[0] === "report" && parts[1] === "units") {
      const unitId = parts[3];

      fetch(`${apiUrl}/unit/fetch/${unitId}`)
        .then((res) => res.json())
        .then((unit) => {
          if (unit?.name) {
            setUnitName(unit.name);
          }

          if (unit?.unitGroupId) {
            setUnitGroupId(String(unit.unitGroupId));

            fetch(`${apiUrl}/unit-group/fetch/${unit.unitGroupId}`)
              .then((res) => res.json())
              .then((group) => {
                if (group?.name) {
                  setUnitGroupName(group.name);
                }
              })
              .catch(() => {});
          }
        });
    } else if (
      parts.length >= 3 &&
      parts[0] === "plan" &&
      parts[1] === "master-plans"
    ) {
      const masterPlanId = parts[3];

      fetch(`${apiUrl}/master-plan/fetch/${masterPlanId}`)
        .then((res) => res.json())
        .then((unit) => {
          if (unit?.name) {
            setUnitName(unit.name);
          }

          if (unit?.unitGroupId) {
            setUnitGroupId(String(unit.unitGroupId));

            fetch(`${apiUrl}/unit-group/fetch/${unit.unitGroupId}`)
              .then((res) => res.json())
              .then((group) => {
                if (group?.name) {
                  setUnitGroupName(group.name);
                }
              })
              .catch(() => {});
          }
        });
    } else if (
      parts.length >= 3 &&
      parts[0] === "plan" &&
      parts[1] === "operational-plans"
    ) {
      const operationalPlanId = parts[3];

      fetch(`${apiUrl}/operational-plan/fetch/${operationalPlanId}`)
        .then((res) => res.json())
        .then((unit) => {
          if (unit?.name) {
            setUnitName(unit.name);
          }

          if (unit?.unitGroupId) {
            setUnitGroupId(String(unit.unitGroupId));

            fetch(`${apiUrl}/unit-group/fetch/${unit.unitGroupId}`)
              .then((res) => res.json())
              .then((group) => {
                if (group?.name) {
                  setUnitGroupName(group.name);
                }
              })
              .catch(() => {});
          }
        });
    } else {
      setUnitName(null);
      setUnitGroupId(null);
      setUnitGroupName(null);
    }
  }, [pathname]);

  // --- BREADCRUMB TRANSLATION ---
  type CrumbMap = Record<string, { label: string; clickable?: boolean }>;

  const breadcrumbTranslation = useMemo<CrumbMap>(
    () => ({
      // --- General ---
<<<<<<< Updated upstream
      manage: { label: t("Common/Manage"), clickable: true },
      "audit-trail": { label: t("Navbar/Audit trail"), clickable: false },
=======
      manage: {
        label: t("common.manage", { capitalize: true }),
        clickable: true,
      },
      "audit-trail": {
        label: t("navbar.auditTrail", { capitalize: true }),
        clickable: false,
      },
>>>>>>> Stashed changes

      // --- Report ---
      report: {
        label: t("navbar.report", { capitalize: true }),
        clickable: true,
      },
      unit: {
        label: t("entities.unit", { capitalize: true, plural: true }),
        clickable: false,
      },

      // --- Plan ---
      plan: { label: t("navbar.plan", { capitalize: true }), clickable: true },
      "admin/manage/plan": {
        label: t("navbar.plan", { capitalize: true }),
        clickable: false,
      },
      "master-plans": {
        label: t("entities.masterPlan", { capitalize: true, plural: true }),
        clickable: true,
      },
      "operational-plans": {
        label: t("entities.operationalPlan", {
          capitalize: true,
          plural: true,
        }),
        clickable: true,
      },
      "planning-rules": {
        label: t("entities.planningRules", { capitalize: true }),
        clickable: true,
      },

      // --- Admin ---
      admin: {
        label: t("common.admin", { capitalize: true }),
        clickable: false,
      },

      "unit-groups": {
        label: t("entities.group", { capitalize: true, plural: true }),
        clickable: true,
      },
      units: {
        label: t("entities.unit", { capitalize: true, plural: true }),
        clickable: true,
      },
      categories: {
        label: t("entities.category", { capitalize: true, plural: true }),
        clickable: true,
      },
<<<<<<< Updated upstream
      units: { label: t("Common/Units"), clickable: true },
      categories: { label: t("Common/Categories"), clickable: true },
=======
>>>>>>> Stashed changes
      "unit-columns": {
        label: t("entities.column", { capitalize: true, plural: true }),
        clickable: true,
      },

      news: {
        label: t("entities.news", { capitalize: true, plural: true }),
        clickable: false,
      },
      "news-types": {
        label: t("entities.newsType", { capitalize: true, plural: true }),
        clickable: true,
      },

      shifts: {
        label: t("entities.shift", { capitalize: true, plural: true }),
        clickable: true,
      },
      "shift-teams": {
        label: t("entities.shiftTeam", { capitalize: true, plural: true }),
        clickable: true,
      },

<<<<<<< Updated upstream
      products: { label: t("Common/Products"), clickable: true },
      "planned-stops": { label: t("Common/Planned stops"), clickable: true },
      "import-rules": { label: t("ImportRules/Import rules"), clickable: true },
=======
      products: {
        label: t("entities.product", { capitalize: true, plural: true }),
        clickable: true,
      },
      "planned-stops": {
        label: t("entities.plannedStop", { capitalize: true, plural: true }),
        clickable: true,
      },
      "import-rules": {
        label: t("entities.importRules", { capitalize: true }),
        clickable: true,
      },
>>>>>>> Stashed changes
      "master-plan-fields": {
        label: t("entities.masterPlanField", {
          capitalize: true,
          plural: true,
        }),
        clickable: true,
      },
      "product-groups": {
        label: t("entities.productGroup", { capitalize: true, plural: true }),
        clickable: true,
      },

      // --- Developer ---
      developer: {
        label: t("common.developer", { capitalize: true }),
        clickable: false,
      },
      users: {
        label: t("entities.user", { capitalize: true, plural: true }),
        clickable: true,
      },
    }),
    [t],
  );

  // --- BREADCRUMB CHILDREN MAP ---
  const breadcrumbChildrenMap = useMemo<Record<string, string[]>>(
    () => ({
      "admin/manage/shifts": ["admin/manage/shifts/shift-teams"],
      "admin/manage/units": [
        "admin/manage/units/unit-groups",
        "admin/manage/units/unit-columns",
        "admin/manage/units/categories",
      ],
      "admin/manage/plan/master-plans": [
        "admin/manage/plan/master-plans/master-plan-fields",
        "admin/manage/plan/master-plans/import-rules",
      ],
      "admin/manage/plan/products": [
        "admin/manage/plan/products/product-groups",
      ],
    }),
    [],
  );

  const normalizePath = (p: string) => {
    let x = (p || "/").toLowerCase();

    const loc = `/${locale.toLowerCase()}`;
    if (x === loc) {
      x = "/";
    } else if (x.startsWith(loc + "/")) {
      x = x.slice(loc.length);
    }

    if (!x.startsWith("/")) {
      x = "/" + x;
    }

    if (x.length > 1 && x.endsWith("/")) {
      x = x.slice(0, -1);
    }

    return x;
  };

  const getLabelForPath = (pathKey: string, fallbackPart?: string) => {
    const translation =
      breadcrumbTranslation[pathKey.toLowerCase()] ??
      breadcrumbTranslation[(fallbackPart ?? "").toLowerCase()];
    if (translation?.label) {
      return translation.label;
    }
    if (fallbackPart) {
      return fallbackPart.charAt(0).toUpperCase() + fallbackPart.slice(1);
    }
    return pathKey;
  };

  // --- CREATE BREADCRUMBS ---
  const createBreadcrumbs = (
    path: string,
    names?: {
      unitName?: string | null;
      unitGroupId?: string | null;
      unitGroupName?: string | null;
    },
  ): Breadcrumb[] | undefined => {
    if (path === "/") {
      return undefined;
    }

    const localParts = path.split("/").filter(Boolean);
    const filteredParts = localParts;
    const crumbs: Breadcrumb[] = [];

    const { unitName, unitGroupId, unitGroupName } = names || {};

    const localIsUnitsPath =
      filteredParts[0] === "report" && filteredParts[1] === "units";

    const localIsMasterPlansPath =
      filteredParts[0] === "plan" && filteredParts[1] === "master-plans";

    const localIsOperationalPlansPath =
      filteredParts[0] === "plan" && filteredParts[1] === "operational-plans";

    for (let index = 0; index < filteredParts.length; index++) {
      const part = filteredParts[index];
      const key = part.toLowerCase();
      const prefixKey = filteredParts
        .slice(0, index + 1)
        .join("/")
        .toLowerCase();

      const translation =
        breadcrumbTranslation[prefixKey] ?? breadcrumbTranslation[key];

      const isLast = index === filteredParts.length - 1;

      // --- Special cases ---
      const isUnitsSpecialKnown =
        (localIsUnitsPath && index === 2 && (unitGroupName || unitGroupId)) ||
        (localIsUnitsPath && index === 3 && unitName);

      const isMasterPlansSpecialKnown =
        (localIsMasterPlansPath &&
          index === 2 &&
          (unitGroupName || unitGroupId)) ||
        (localIsMasterPlansPath && index === 3 && unitName);

      const isOperationalPlansSpecialKnown =
        (localIsOperationalPlansPath &&
          index === 2 &&
          (unitGroupName || unitGroupId)) ||
        (localIsOperationalPlansPath && index === 3 && unitName);

      // --- Don't continue if invalid segment ---
      if (
        !translation &&
        !isUnitsSpecialKnown &&
        !isMasterPlansSpecialKnown &&
        !isOperationalPlansSpecialKnown
      ) {
        break;
      }

      const label =
        (localIsUnitsPath ||
          localIsMasterPlansPath ||
          localIsOperationalPlansPath) &&
        index === 2 &&
        (unitGroupName || unitGroupId)
          ? (unitGroupName ?? unitGroupId!)
          : (localIsUnitsPath ||
                localIsMasterPlansPath ||
                localIsOperationalPlansPath) &&
              index === 3 &&
              unitName
            ? unitName!
            : (translation?.label ??
              part.charAt(0).toUpperCase() + part.slice(1));

      const clickable = isLast
        ? false
        : (translation?.clickable ?? (localIsUnitsPath && index === 1));

      const href =
        localIsUnitsPath && index === 1
          ? "/report/units"
          : localIsMasterPlansPath && index === 1
            ? "/plan/master-plans"
            : localIsOperationalPlansPath && index === 1
              ? "/plan/operational-plans"
              : "/" + filteredParts.slice(0, index + 1).join("/");

      const childKeys = breadcrumbChildrenMap[prefixKey] ?? [];
      const children =
        childKeys.length > 0
          ? childKeys.map((k) => {
              const href = "/" + k;
              return {
                label: getLabelForPath(k, k.split("/").at(-1)),
                href,
                clickable: true,
                isActive: normalizePath(pathname) === normalizePath(href),
              };
            })
          : undefined;

      crumbs.push({ label, href, clickable, isActive: isLast, children });
    }

    // --- Invalid page if invalid href ---
    if (crumbs.length < filteredParts.length) {
      return [
        {
          label: t("message.invalid", { capitalize: true, end: "." }),
          href: "/",
          clickable: false,
          isActive: true,
        },
      ];
    }

    return crumbs.length === 0 ? undefined : crumbs;
  };

  useEffect(() => {
    let isMounted = true;

    if (lastPathRef.current !== pathname) {
      lastPathRef.current = pathname;
      setBreadcrumbsLoading(true);
    }

    setBreadcrumbsReady(false);

    const localParts = pathname.split("/").filter(Boolean);
    const localIsUnitsPath =
      localParts.length >= 3 &&
      localParts[0] === "report" &&
      localParts[1] === "units";

    const localIsMasterPlansPath =
      localParts.length >= 3 &&
      localParts[0] === "plan" &&
      localParts[1] === "master-plans";

    const localIsOperationalPlansPath =
      localParts.length >= 3 &&
      localParts[0] === "plan" &&
      localParts[1] === "operational-plans";

    if (
      !localIsUnitsPath &&
      !localIsMasterPlansPath &&
      !localIsOperationalPlansPath
    ) {
      const next = createBreadcrumbs(pathname, {
        unitName,
        unitGroupId,
        unitGroupName,
      });

      if (isMounted) {
        setBreadcrumbs(next);
        setBreadcrumbsReady(true);
        setBreadcrumbsLoading(false);
      }
      return () => {
        isMounted = false;
      };
    }

    const groupId = localParts[2];
    const entityId = localParts[3];

    const fetchGroup = groupId
      ? fetch(`${apiUrl}/unit-group/fetch/${groupId}`)
          .then((r) => (r.ok ? r.json() : null))
          .catch(() => null)
      : Promise.resolve(null);

    const fetchEntity = entityId
      ? fetch(
          localIsUnitsPath
            ? `${apiUrl}/unit/fetch/${entityId}`
            : localIsMasterPlansPath
              ? `${apiUrl}/master-plan/fetch/${entityId}`
              : `${apiUrl}/operational-plan/fetch/${entityId}`,
        )
          .then((r) => (r.ok ? r.json() : null))
          .catch(() => null)
      : Promise.resolve(null);

    Promise.all([fetchGroup, fetchEntity]).then(([group, entity]) => {
      if (!isMounted) {
        return;
      }

      const isMismatch =
        (localIsUnitsPath ||
          localIsMasterPlansPath ||
          localIsOperationalPlansPath) &&
        entity &&
        groupId &&
        String(entity.unitGroupId) !== String(groupId);

      const names = isMismatch
        ? { unitName: null, unitGroupId: null, unitGroupName: null }
        : {
            unitName: entity?.name ?? null,
            unitGroupId: groupId ?? null,
            unitGroupName: group?.name ?? null,
          };

      const next = isMismatch
        ? [
            {
              label: t("message.invalid", { capitalize: true, end: "." }),
              href: "/",
              clickable: false,
              isActive: true,
            },
          ]
        : createBreadcrumbs(pathname, names);

      if (!sameCrumbs(breadcrumbs, next)) {
        setBreadcrumbs(next);
      }
      setBreadcrumbsReady(true);
      setBreadcrumbsLoading(false);
    });

    return () => {
      isMounted = false;
    };
  }, [pathname, apiUrl, t, unitName, unitGroupId, unitGroupName]);

  // --- SET PAGE TITLE ---
  useEffect(() => {
    const appName = "Planning Point";

    if (pathname === "/") {
      document.title = appName;
      return;
    }

    const labels = (breadcrumbs ?? []).map((c) => c.label).filter(Boolean);

    if (labels.length > 0) {
      document.title = `${labels.join(" | ")}`;
      return;
    }

    document.title = appName;
  }, [pathname, breadcrumbs]);

  return (
    <>
      <Navbar
        hasScrollbar={hasScrollbar}
        setHasScrollbar={setHasScrollbar}
        navbarHidden={navbarHidden}
        setNavbarHidden={setNavbarHidden}
        isEditingFavourites={isEditingFavourites}
      />
      <Topbar
        hasScrollbar={hasScrollbar}
        breadcrumbs={breadcrumbs}
        navbarHidden={navbarHidden}
        setNavbarHidden={setNavbarHidden}
        breadcrumbsLoading={breadcrumbsLoading}
        setIsEditingFavourites={setIsEditingFavourites}
        isEditingFavourites={isEditingFavourites}
      />
      <div className="flex min-h-screen">
        <div
          className={`${hasScrollbar && !navbarHidden ? "md:ml-67" : !hasScrollbar && !navbarHidden ? "md:ml-64" : ""} w-full overflow-hidden p-4 pt-22 duration-(--medium)`}
        >
          {props.children}
        </div>
      </div>
    </>
  );
};

export default LayoutWrapper;
