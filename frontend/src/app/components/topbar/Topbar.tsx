import {
  iconButtonPrimaryClass,
  roundedButtonClass,
} from "@/app/styles/buttonClasses";
import * as Solid from "@heroicons/react/24/solid";
import * as SolidSmall from "@heroicons/react/16/solid";
import * as Outline from "@heroicons/react/24/outline";
import { createRef, useEffect, useRef, useState } from "react";
import { useToast } from "../toast/ToastProvider";
import { useAuth } from "@/app/context/AuthContext";
import Message from "../common/Message";
import MenuDropdown from "../common/MenuDropdown/MenuDropdown";
import TopbarLink from "./TopbarLink";
import useTheme from "@/app/hooks/useTheme";
import SettingsModal from "../modals/SettingsModal";
import Link from "next/link";
import useLanguage from "@/app/hooks/useLanguage";
import { useTranslations } from "next-intl";
import { badgeClass } from "../manage/ManageClasses";
import HandbookModal from "../modals/HandbookModal";
import { useHandbook } from "@/app/context/HandbookContext";

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

type Props = {
  hasScrollbar: boolean;
  navbarHidden: boolean;
  setNavbarHidden: (value: boolean) => void;
  setIsEditingFavourites: (value: boolean) => void;
  isEditingFavourites: boolean;
  breadcrumbs?: Breadcrumb[];
  breadcrumbsLoading?: boolean;
};

const Topbar = (props: Props) => {
  const t = useTranslations();

  // --- VARIABLES ---
  // --- Refs ---
  const userIconRef = useRef<HTMLButtonElement>(null);
  const bellIconRef = useRef<HTMLButtonElement>(null);
  const crumbsIconRef = useRef<HTMLButtonElement>(null);

  const crumbMenuTriggerRefs = useRef<
    Record<string, React.RefObject<HTMLButtonElement | null>>
  >({});

  const getCrumbTriggerRef = (key: string) => {
    if (!crumbMenuTriggerRefs.current[key]) {
      crumbMenuTriggerRefs.current[key] = createRef<HTMLButtonElement>();
    }
    return crumbMenuTriggerRefs.current[key];
  };

  const [openCrumbKey, setOpenCrumbKey] = useState<string | null>(null);

  const mobileKey = (href: string) => `m:${href}`;
  const desktopKey = (href: string) => `d:${href}`;

  const breadcrumbsRef = useRef<HTMLDivElement>(null);

  // --- States ---
  const [canScrollLeft, setCanScrollLeft] = useState(false);
  const [canScrollRight, setCanScrollRight] = useState(false);
  const [isSettingsModalOpen, setIsSettingsModalOpen] = useState(false);
  const [isHandbookModalOpen, setIsHandbookModalOpen] = useState(false);
  const [isVisible, setIsVisible] = useState(true);
  const [lastScrollY, setLastScrollY] = useState(0);
  const [userIconClicked, setUserIconClicked] = useState(false);
  const [bellIconClicked, setBellIconClicked] = useState(false);
  const [crumbsIconClicked, setCrumbsIconClicked] = useState(false);

  // --- Other ---
  const { handbook } = useHandbook();
  const prefix = process.env.NEXT_PUBLIC_BASE_PATH ?? "";
  const apiUrl = process.env.NEXT_PUBLIC_API_URL;
  const token = localStorage.getItem("token");
  const { notify } = useToast();
  const {
    username,
    firstName,
    lastName,
    isLoggedIn,
    isAuthReady,
    fetchAuthData,
    userRoles,
  } = useAuth();
  const { toggleTheme, currentTheme } = useTheme();
  const { toggleLanguage, currentLanguage } = useLanguage();
  const breadcrumbs = props.breadcrumbs ?? [];

  // --- SCROLL HORIZONTALLY ---
  useEffect(() => {
    const el = breadcrumbsRef.current;
    
    if (!el) {
      return;
    }

    const update = () => {
      const maxScrollLeft = el.scrollWidth - el.clientWidth;
      setCanScrollLeft(el.scrollLeft > 0);
      setCanScrollRight(el.scrollLeft < maxScrollLeft - 1);
    };

    update();

    const onScroll = () => update();
    el.addEventListener("scroll", onScroll, { passive: true });

    const ro = new ResizeObserver(() => update());
    ro.observe(el);

    window.addEventListener("resize", update);

    return () => {
      el.removeEventListener("scroll", onScroll);
      ro.disconnect();
      window.removeEventListener("resize", update);
    };
  }, [breadcrumbs.length, props.breadcrumbsLoading, isAuthReady]);

  // --- HIDE TOPBAR ON SCROLL ---
  useEffect(() => {
    const handleScroll = () => {
      const currentScrollY = window.scrollY;

      if (currentScrollY > lastScrollY && currentScrollY > 50) {
        setIsVisible(false);
        closeAllMenus();
      } else {
        setIsVisible(true);
      }

      setLastScrollY(currentScrollY);
    };

    window.addEventListener("scroll", handleScroll);
    return () => window.removeEventListener("scroll", handleScroll);
  }, [lastScrollY]);

  /* --- BACKEND --- */
  const handleLogout = async () => {
    try {
      await fetch(`${apiUrl}/user/logout`, {
        method: "POST",
        headers: {
          "X-User-Language": localStorage.getItem("language") || "sv",
          "Content-Type": "application/json",
          Authorization: `Bearer ${token}`,
        },
      });
    } catch (err) {
    } finally {
      localStorage.removeItem("token");
      localStorage.setItem(
        "postLogoutToast",
        t("SettingsModal/Logout message"),
      );
      window.location.reload();
    }
  };

  // --- LOGOUT MESSAGE ---
  useEffect(() => {
    const message = localStorage.getItem("postLogoutToast");
    if (message) {
      notify("info", message, 6000);
      localStorage.removeItem("postLogoutToast");
    }
  }, []);

  // --- CLOSE ALL MENUS ---
  const closeAllMenus = () => {
    setUserIconClicked(false);
    setBellIconClicked(false);
    setCrumbsIconClicked(false);
    setOpenCrumbKey(null);
  };

  const closeOtherMenus = () => {
    setUserIconClicked(false);
    setBellIconClicked(false);
    setCrumbsIconClicked(false);
  };

  return (
    <>
      {/* --- MODAL(S) --- */}
      <HandbookModal
        isOpen={isHandbookModalOpen}
        onClose={() => setIsHandbookModalOpen(false)}
        content={handbook}
      />
      <SettingsModal
        isOpen={isSettingsModalOpen}
        onClose={() => setIsSettingsModalOpen(false)}
        onProfileUpdated={fetchAuthData}
      />
      <div
        inert={!isVisible}
        className={`${isVisible ? "translate-y-0" : "-translate-y-full"} fixed z-[calc(var(--z-overlay)-2)] flex h-18 w-full justify-between gap-4 border-b-1 border-(--border-main) bg-(--bg-navbar) px-4 py-2 transition-[max-width,translate] duration-(--medium)`}
      >
        {!isAuthReady ? (
          <Message
            icon="loading"
            content="content"
            sideMessage
            fullscreen
            withinContainer={props.navbarHidden}
          />
        ) : (
          <>
            {/* --- WELCOME MESSAGE --- */}
            <div
              className={`${!props.navbarHidden ? (props.hasScrollbar ? "md:ml-67" : "md:ml-64") : ""} flex min-w-0 flex-1 items-center gap-4`}
            >
              <button
                onClick={() => props.setNavbarHidden(false)}
                className={`${iconButtonPrimaryClass} ${props.navbarHidden ? "block" : "md:hidden"} h-6 min-h-6 w-6 min-w-6`}
                inert={!props.navbarHidden}
              >
                <Outline.Bars2Icon />
              </button>

              {props.breadcrumbsLoading ? (
                <span className="animate-shimmer h-6 w-64" />
              ) : breadcrumbs.length ? (
                <div className="relative flex min-w-0 items-center">
                  {canScrollLeft && (
                    <button
                      onClick={() =>
                        breadcrumbsRef.current?.scrollBy({
                          left: -220,
                          behavior: "smooth",
                        })
                      }
                      className="absolute left-0 z-[calc(var(--z-base)+1)] flex h-8 w-8 items-center justify-center rounded-full border border-(--border-main) bg-(--bg-navbar) hover:bg-(--bg-navbar-link)"
                      aria-label="Scroll breadcrumbs left"
                    >
                      <SolidSmall.ChevronLeftIcon className="h-4 w-4" />
                    </button>
                  )}

                  <div
                    ref={breadcrumbsRef}
                    className={`min-w-0 overflow-x-auto scroll-smooth whitespace-nowrap [-ms-overflow-style:none] [scrollbar-width:none] [&::-webkit-scrollbar]:hidden`}
                  >
                    <div className="inline-flex items-center">
                      {/* --- MOBILE (<= 640px) ---*/}
                      <div className="inline-flex items-center whitespace-nowrap sm:hidden">
                        {breadcrumbs.length > 2 && (
                          <div className="relative">
                            <button
                              ref={crumbsIconRef}
                              onClick={() => {
                                closeAllMenus();
                                setCrumbsIconClicked(!crumbsIconClicked);
                              }}
                              aria-label="Breadcrumbs"
                              className={`${crumbsIconClicked ? "bg-(--bg-navbar-link) text-(--accent-color)" : ""} flex h-8 min-h-8 w-8 min-w-8 cursor-pointer items-center justify-center rounded-full font-semibold transition-colors hover:bg-(--bg-navbar-link) hover:text-(--accent-color)`}
                            >
                              <span>. . .</span>
                            </button>

                            <MenuDropdown
                              triggerRef={crumbsIconRef}
                              isOpen={crumbsIconClicked}
                              onClose={() => setCrumbsIconClicked(false)}
                              autoWidth
                              alignLeft
                            >
                              <div className="flex flex-col gap-2">
                                {breadcrumbs.slice(0, -2).map((item) =>
                                  item.clickable ? (
                                    <span
                                      key={item.href}
                                      className="transition-colors duration-(--fast) hover:text-(--accent-color) hover:underline"
                                    >
                                      <Link
                                        href={item.href}
                                        onClick={() =>
                                          setCrumbsIconClicked(false)
                                        }
                                        className="flex items-center gap-2 whitespace-nowrap"
                                      >
                                        {item.label}
                                        <Outline.ArrowRightIcon className="h-3 min-h-3 w-3 min-w-3" />
                                      </Link>
                                    </span>
                                  ) : (
                                    <span
                                      key={item.href}
                                      className="whitespace-nowrap opacity-50"
                                    >
                                      {item.label}
                                    </span>
                                  ),
                                )}
                              </div>
                            </MenuDropdown>
                          </div>
                        )}

                        {breadcrumbs.length > 2 && <span>&nbsp;/&nbsp;</span>}

                        {(breadcrumbs.length > 2
                          ? breadcrumbs.slice(-2)
                          : breadcrumbs
                        ).map((item, idx, arr) => {
                          const hasChildren = !!item.children?.length;
                          const key = mobileKey(item.href);

                          return (
                            <span
                              key={item.href}
                              className="relative inline-flex items-center"
                            >
                              {item.clickable ? (
                                <Link
                                  href={item.href}
                                  className="transition-colors duration-(--fast) hover:text-(--accent-color) hover:underline"
                                >
                                  {item.label}
                                </Link>
                              ) : (
                                <span
                                  className={
                                    item.isActive
                                      ? "font-semibold text-(--accent-color)"
                                      : "opacity-50"
                                  }
                                >
                                  {item.label}
                                </span>
                              )}

                              {hasChildren ? (
                                <>
                                  <button
                                    ref={getCrumbTriggerRef(key)}
                                    onClick={() => {
                                      closeOtherMenus();
                                      setOpenCrumbKey((prev) =>
                                        prev === key ? null : key,
                                      );
                                    }}
                                    aria-label="Submenu"
                                    className={`${openCrumbKey === key ? "bg-(--bg-navbar-link) text-(--accent-color)" : ""} ml-1 flex h-6 min-h-6 w-6 min-w-6 cursor-pointer items-center justify-center rounded-full transition-colors hover:bg-(--bg-navbar-link) hover:text-(--accent-color)`}
                                  >
                                    <SolidSmall.ChevronDownIcon className="h-4 w-4" />
                                  </button>

                                  <MenuDropdown
                                    triggerRef={getCrumbTriggerRef(key)}
                                    isOpen={openCrumbKey === key}
                                    onClose={() => setOpenCrumbKey(null)}
                                    autoWidth
                                    alignLeft
                                  >
                                    <div className="flex flex-col gap-2">
                                      {(item.children ?? []).map((child) => {
                                        const content = (
                                          <>
                                            {child.label}
                                            {child.clickable &&
                                              !child.isActive && (
                                                <Outline.ArrowRightIcon className="h-3 min-h-3 w-3 min-w-3" />
                                              )}
                                          </>
                                        );

                                        const className = `flex items-center gap-2 whitespace-nowrap transition-colors duration-(--fast) ${
                                          child.isActive
                                            ? "font-semibold text-(--accent-color)"
                                            : ""
                                        } ${
                                          child.clickable && !child.isActive
                                            ? "hover:text-(--accent-color) hover:underline"
                                            : ""
                                        } ${!child.clickable ? "opacity-50" : ""}`;

                                        if (
                                          !child.clickable ||
                                          child.isActive
                                        ) {
                                          return (
                                            <span
                                              key={child.href}
                                              className={className}
                                            >
                                              {content}
                                            </span>
                                          );
                                        }

                                        return (
                                          <Link
                                            key={child.href}
                                            href={child.href}
                                            onClick={() =>
                                              setOpenCrumbKey(null)
                                            }
                                            className={className}
                                          >
                                            {content}
                                          </Link>
                                        );
                                      })}
                                    </div>
                                  </MenuDropdown>
                                </>
                              ) : null}

                              {idx !== arr.length - 1 && (
                                <span>&nbsp;/&nbsp;</span>
                              )}
                            </span>
                          );
                        })}
                      </div>

                      {/* --- DESKTOP (> 640px) ---*/}
                      <div className="hidden items-center whitespace-nowrap sm:inline-flex">
                        {breadcrumbs.map((item, idx) => {
                          const hasChildren = !!item.children?.length;
                          const key = desktopKey(item.href);

                          return (
                            <span
                              key={item.href}
                              className="relative inline-flex items-center"
                            >
                              {item.clickable ? (
                                <Link
                                  href={item.href}
                                  className="transition-colors duration-(--fast) hover:text-(--accent-color) hover:underline"
                                >
                                  {item.label}
                                </Link>
                              ) : (
                                <span
                                  className={
                                    item.isActive
                                      ? "font-semibold text-(--accent-color)"
                                      : "opacity-50"
                                  }
                                >
                                  {item.label}
                                </span>
                              )}

                              {hasChildren ? (
                                <>
                                  <button
                                    ref={getCrumbTriggerRef(key)}
                                    onClick={() => {
                                      closeOtherMenus();
                                      setOpenCrumbKey((prev) =>
                                        prev === key ? null : key,
                                      );
                                    }}
                                    aria-label="Submenu"
                                    className={`${openCrumbKey === key ? "bg-(--bg-navbar-link) text-(--accent-color)" : ""} ml-1 flex h-6 min-h-6 w-6 min-w-6 cursor-pointer items-center justify-center rounded-full transition-colors hover:bg-(--bg-navbar-link) hover:text-(--accent-color)`}
                                  >
                                    <SolidSmall.ChevronDownIcon className="h-4 w-4" />
                                  </button>

                                  <MenuDropdown
                                    triggerRef={getCrumbTriggerRef(key)}
                                    isOpen={openCrumbKey === key}
                                    onClose={() => setOpenCrumbKey(null)}
                                    autoWidth
                                    alignLeft
                                  >
                                    <div className="flex flex-col gap-2">
                                      {(item.children ?? []).map((child) => {
                                        const content = (
                                          <>
                                            {child.label}
                                            {child.clickable &&
                                              !child.isActive && (
                                                <Outline.ArrowRightIcon className="h-3 min-h-3 w-3 min-w-3" />
                                              )}
                                          </>
                                        );

                                        const className = `flex items-center gap-2 whitespace-nowrap transition-colors duration-(--fast) ${
                                          child.isActive
                                            ? "font-semibold text-(--accent-color)"
                                            : ""
                                        } ${
                                          child.clickable && !child.isActive
                                            ? "hover:text-(--accent-color) hover:underline"
                                            : ""
                                        } ${!child.clickable ? "opacity-50" : ""}`;

                                        if (
                                          !child.clickable ||
                                          child.isActive
                                        ) {
                                          return (
                                            <span
                                              key={child.href}
                                              className={className}
                                            >
                                              {content}
                                            </span>
                                          );
                                        }

                                        return (
                                          <Link
                                            key={child.href}
                                            href={child.href}
                                            onClick={() =>
                                              setOpenCrumbKey(null)
                                            }
                                            className={className}
                                          >
                                            {content}
                                          </Link>
                                        );
                                      })}
                                    </div>
                                  </MenuDropdown>
                                </>
                              ) : null}

                              {idx !== breadcrumbs.length - 1 && (
                                <span>&nbsp;/&nbsp;</span>
                              )}
                            </span>
                          );
                        })}
                      </div>
                    </div>
                  </div>

                  {canScrollRight && (
                    <button
                      onClick={() =>
                        breadcrumbsRef.current?.scrollBy({
                          left: 220,
                          behavior: "smooth",
                        })
                      }
                      className="absolute right-0 z-[calc(var(--z-base)+1)] flex h-8 w-8 items-center justify-center rounded-full border border-(--border-main) bg-(--bg-navbar) hover:bg-(--bg-navbar-link)"
                      aria-label="Scroll breadcrumbs right"
                    >
                      <SolidSmall.ChevronRightIcon className="h-5 w-5" />
                    </button>
                  )}

                  {canScrollLeft && (
                    <div className="pointer-events-none absolute inset-y-0 left-0 w-10 bg-gradient-to-r from-(--bg-navbar) to-transparent" />
                  )}

                  {canScrollRight && (
                    <div className="pointer-events-none absolute inset-y-0 right-0 w-10 bg-gradient-to-l from-(--bg-navbar) to-transparent" />
                  )}
                </div>
              ) : isLoggedIn ? (
                <div className="flex flex-wrap items-center">
                  <span className="">{t("SettingsModal/Welcome")}&nbsp;</span>
                  <div>
                    <span className="font-semibold text-(--accent-color)">
                      {firstName ? firstName : username}
                    </span>
                    !
                  </div>
                </div>
              ) : (
                <span></span>
              )}
            </div>

            {/* --- BUTTONS AND THEIR CONTENT --- */}
            <div className="flex items-center justify-end gap-4">
              {/* --- Handbook --- */}
              <button
                className={`${roundedButtonClass} group`}
                onClick={() => {
                  closeAllMenus();
                  setIsHandbookModalOpen(!isHandbookModalOpen);
                }}
              >
                <span className="group relative flex h-6 w-6 items-center justify-center text-2xl">
                  <span
                    className={`${isHandbookModalOpen ? "opacity-0" : "opacity-100"} absolute transition-opacity duration-(--fast) group-hover:opacity-0`}
                  >
                    ?
                  </span>
                  <span
                    className={`${isHandbookModalOpen ? "opacity-100" : "opacity-0"} absolute text-(--accent-color) transition-opacity duration-(--fast) group-hover:opacity-100`}
                  >
                    ?
                  </span>
                </span>
              </button>

              {/* --- Alerts --- */}
              {isLoggedIn && (
                <div className="relative">
                  <button
                    ref={bellIconRef}
                    className={`${roundedButtonClass} group`}
                    onClick={() => {
                      closeAllMenus();
                      setBellIconClicked(!bellIconClicked);
                    }}
                  >
                    <span className="group relative flex h-6 w-6 items-center justify-center">
                      <Outline.BellIcon
                        className={`${bellIconClicked ? "opacity-0" : "opacity-100"} absolute transition-opacity duration-(--fast) group-hover:opacity-0`}
                      />
                      <Solid.BellIcon
                        className={`${bellIconClicked ? "opacity-100" : "opacity-0"} absolute text-(--accent-color) transition-opacity duration-(--fast) group-hover:opacity-100`}
                      />
                    </span>
                  </button>

                  <MenuDropdown
                    triggerRef={bellIconRef}
                    isOpen={bellIconClicked}
                    onClose={() => setBellIconClicked(false)}
                  >
                    <span>{t("SettingsModal/No messages")}</span>
                  </MenuDropdown>
                </div>
              )}

              {/* --- User --- */}
              <div className="relative">
                <button
                  ref={userIconRef}
                  className={`${roundedButtonClass} group`}
                  onClick={() => {
                    closeAllMenus();
                    setUserIconClicked(!userIconClicked);
                  }}
                >
                  <span className="group relative flex h-6 w-6 items-center justify-center">
                    {isLoggedIn ? (
                      <>
                        <Outline.UserIcon
                          className={`${userIconClicked ? "opacity-0" : "opacity-100"} absolute transition-opacity duration-(--fast) group-hover:opacity-0`}
                        />
                        <Solid.UserIcon
                          className={`${userIconClicked ? "opacity-100" : "opacity-0"} absolute text-(--accent-color) transition-opacity duration-(--fast) group-hover:opacity-100`}
                        />
                      </>
                    ) : (
                      <>
                        <Outline.Cog6ToothIcon
                          className={`${userIconClicked ? "opacity-0" : "opacity-100"} absolute transition-opacity duration-(--fast) group-hover:opacity-0`}
                        />
                        <Solid.Cog6ToothIcon
                          className={`${userIconClicked ? "opacity-100" : "opacity-0"} absolute text-(--accent-color) transition-opacity duration-(--fast) group-hover:opacity-100`}
                        />
                      </>
                    )}
                  </span>
                </button>

                <MenuDropdown
                  triggerRef={userIconRef}
                  isOpen={userIconClicked}
                  onClose={() => setUserIconClicked(false)}
                >
                  <div className="relative">
                    <div className="flex flex-col gap-4">
                      <div className="flex justify-between gap-4">
                        {isLoggedIn ? (
                          <span className="font-semibold [overflow-wrap:anywhere] text-(--accent-color)">
                            {firstName && lastName
                              ? firstName + " " + lastName
                              : firstName || username}
                          </span>
                        ) : (
                          <span className="font-semibold [overflow-wrap:anywhere] text-(--accent-color)">
                            {t("SettingsModal/No one logged in")}
                          </span>
                        )}

                        <button
                          onClick={() => {
                            toggleLanguage();
                          }}
                          className={`${roundedButtonClass} relative flex !h-6 min-h-6 !w-6 min-w-6 overflow-hidden`}
                          aria-label={
                            currentLanguage === "sv"
                              ? t("SettingsModal/Switch to English")
                              : t("SettingsModal/Switch to Swedish")
                          }
                        >
                          <div className="absolute inset-0 origin-center">
                            <div
                              className={`absolute inset-0 ${
                                currentLanguage === "sv"
                                  ? "bg-blue-500"
                                  : "bg-white"
                              }`}
                            >
                              <div
                                className={`absolute top-0 bottom-0 left-[40%] w-[20%] ${
                                  currentLanguage === "sv"
                                    ? "bg-yellow-500"
                                    : "bg-red-500"
                                }`}
                              />
                              <div
                                className={`absolute top-[40%] right-0 left-0 h-[20%] ${
                                  currentLanguage === "sv"
                                    ? "bg-yellow-500"
                                    : "bg-red-500"
                                }`}
                              />
                            </div>
                          </div>
                        </button>
                      </div>

                      {/* --- Permissions --- */}
                      {isLoggedIn && (
                        <div>
                          {/* <span className="flex pb-1 text-xs font-semibold whitespace-nowrap uppercase">
                          {t("SettingsModal/Permissions")}
                        </span> */}

                          <div className="flex flex-wrap gap-2">
                            {userRoles.map((role) => (
                              <span
                                key={role}
                                className={`${badgeClass} ${
                                  role === "Admin"
                                    ? "bg-(--badge-one) text-(--text-one)"
                                    : role === "Developer"
                                      ? "bg-(--badge-two) text-(--text-two)"
                                      : role === "Reporter"
                                        ? "bg-(--badge-three) text-(--text-three)"
                                        : role === "Planner"
                                          ? "bg-(--badge-four) text-(--text-four)"
                                          : role === "MasterPlanner"
                                            ? "bg-(--badge-five) text-(--text-five)"
                                            : "bg-(--accent-color) text-(--text-main-reverse)"
                                }`}
                              >
                                {t("Roles/" + role)}
                              </span>
                            ))}
                          </div>
                        </div>
                      )}
                    </div>

                    <hr className="absolute mt-4 -ml-4 flex w-[calc(100%+2rem)] text-(--border-tertiary)" />
                  </div>

                  <div>
                    {/* <hr className="absolute -mt-4 -ml-4 w-[calc(100%+2rem)] text-(--border-tertiary)" /> */}
                    <span className="flex pb-1 text-xs font-semibold whitespace-nowrap uppercase">
                      {t("Common/Manage")}
                    </span>
                    <TopbarLink
                      onClick={toggleTheme}
                      label={
                        currentTheme === "dark"
                          ? t("SettingsModal/Light theme")
                          : t("SettingsModal/Dark theme")
                      }
                      icon={
                        currentTheme === "dark"
                          ? Outline.SunIcon
                          : Outline.MoonIcon
                      }
                      iconHover={
                        currentTheme === "dark" ? Solid.SunIcon : Solid.MoonIcon
                      }
                    />
                    {isLoggedIn && (
                      <>
                        <TopbarLink
                          onClick={() => {
                            closeAllMenus();
                            setIsSettingsModalOpen(true);
                          }}
                          label={t("Common/Settings")}
                          icon={Outline.Cog6ToothIcon}
                          iconHover={Solid.Cog6ToothIcon}
                        />

                        <TopbarLink
                          onClick={() => {
                            props.setIsEditingFavourites(
                              !props.isEditingFavourites,
                            );
                          }}
                          label={
                            props.isEditingFavourites
                              ? t("Navbar/Stop editing favourites")
                              : t("Navbar/Edit favourites")
                          }
                          icon={Outline.StarIcon}
                          iconHover={Solid.StarIcon}
                        />
                      </>
                    )}
                  </div>

                  <div className="relative">
                    <hr className="absolute -mt-4 -ml-4 w-[calc(100%+2rem)] text-(--border-tertiary)" />
                    <span className="flex pb-1 text-xs font-semibold whitespace-nowrap uppercase">
                      {t("SettingsModal/Session")}
                    </span>
                    {isLoggedIn ? (
                      <TopbarLink
                        onClick={handleLogout}
                        label={t("Common/Logout")}
                        icon={Outline.ArrowLeftEndOnRectangleIcon}
                        iconHover={Solid.ArrowLeftEndOnRectangleIcon}
                      />
                    ) : (
                      <TopbarLink
                        href="/"
                        label={t("Common/Login")}
                        icon={Outline.ArrowRightEndOnRectangleIcon}
                        iconHover={Solid.ArrowRightEndOnRectangleIcon}
                      />
                    )}
                  </div>
                </MenuDropdown>
              </div>
            </div>
          </>
        )}
      </div>
    </>
  );
};

export default Topbar;
