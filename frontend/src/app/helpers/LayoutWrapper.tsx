"use client";

import { ReactNode, useEffect, useMemo, useRef, useState } from "react";
import Navbar from "../components/navbar/Navbar";
import Topbar from "../components/topbar/Topbar";
import { usePathname } from "next/navigation";
import { useLocale, useTranslations } from "next-intl";

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
  const t = useTranslations();

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
      manage: { label: t("Common/Manage"), clickable: true },
      "audit-trail": { label: t("Navbar/Audit trail"), clickable: false },

      // --- Report ---
      report: { label: t("Navbar/Report"), clickable: true },
      unit: { label: t("Common/Units"), clickable: false },

      // --- Plan ---
      plan: { label: t("Navbar/Plan"), clickable: true },
      "admin/manage/plan": { label: t("Navbar/Plan"), clickable: false },
      "master-plans": { label: t("Common/Master plans"), clickable: true },
      "operational-plans": {
        label: t("Common/Operational plans"),
        clickable: true,
      },
      "planning-rules": { label: t("Navbar/Planning rules"), clickable: true },

      // --- Admin ---
      admin: { label: t("Common/Admin"), clickable: false },

      "unit-groups": {
        label: t("Common/Groups"),
        clickable: true,
      },
      units: { label: t("Common/Units"), clickable: true },
      categories: { label: t("Common/Categories"), clickable: true },
      "unit-columns": {
        label: t("Common/Columns"),
        clickable: true,
      },

      news: { label: t("Common/News"), clickable: false },
      "news-types": { label: t("Common/News types"), clickable: true },

      shifts: { label: t("Common/Shifts"), clickable: true },
      "shift-teams": { label: t("Common/Shift teams"), clickable: true },

      products: { label: t("Common/Products"), clickable: true },
      "planned-stops": { label: t("Common/Planned stops"), clickable: true },
      "import-rules": { label: t("Navbar/Import rules"), clickable: true },
      "master-plan-fields": {
        label: t("Common/Master plan fields"),
        clickable: true,
      },
      "product-groups": { label: t("Common/Product groups"), clickable: true },

      // --- Developer ---
      developer: { label: t("Common/Developer"), clickable: false },
      users: { label: t("Common/Users"), clickable: true },
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
      "admin/manage/plan/operational-plans": [
        "admin/manage/plan/operational-plans/planning-rules",
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
          label: t("Message/Invalid"),
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
              label: t("Message/Invalid"),
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
