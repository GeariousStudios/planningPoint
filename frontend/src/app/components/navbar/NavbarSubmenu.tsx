import { useAuth } from "@/app/context/AuthContext";
import { ChevronRightIcon } from "@heroicons/react/20/solid";
import Link from "next/link";
import { usePathname } from "next/navigation";
import { ElementType, useEffect, useRef, useState } from "react";
import HoverIcon from "../common/HoverIcon";
import { StarIcon as OutlineStarIcon } from "@heroicons/react/24/outline";
import { StarIcon as SolidStarIcon } from "@heroicons/react/24/solid";
import CustomTooltip from "../common/CustomTooltip";
import useTN from "@/app/hooks/useTN";

// --- PROPS ---
type SubmenuItem = {
  title?: string;
  href?: string;
  onClick?: () => void;
  label: string;
  disabled?: boolean;
  tooltip?: string;

  icon?: string;
  overrideLabel?: string;
  isFavourite?: boolean;
  onToggleFavourite?: (isFavourite: boolean, href: string) => void;

  requiresLogin?: boolean;
  requiresAdmin?: boolean;
  requiresDev?: boolean;
};

type Submenu = {
  label: string;
  items: SubmenuItem[];

  requiresLogin?: boolean;
  requiresAdmin?: boolean;
  requiresDev?: boolean;
};

type Props = {
  label: string;
  icon: ElementType;
  iconHover: ElementType;
  menus: Submenu[];
  hasScrollbar: boolean;

  requiresLogin?: boolean;
  requiresAdmin?: boolean;
  requiresDev?: boolean;

  href?: string;
  isFavourite?: boolean;
  onToggleFavourite?: (isFavourite: boolean, href: string) => void;
  favouriteDisabled?: boolean;

  onOpen?: () => void;
};

const NavbarSubmenu = (props: Props) => {
  const t = useTN();

  // --- VARIABLES ---
  // --- Refs ---
  const innerRef = useRef<HTMLDivElement>(null);
  const buttonRef = useRef<HTMLButtonElement>(null);

  // --- States ---
  const [isOpen, setIsOpen] = useState(false);
  const [hasScrollbar, setHasScrollbar] = useState(false);

  // --- Other ---
  const { isLoggedIn, isAdmin, isDev } = useAuth();
  const pathname = usePathname();
  const strip = (s: string) => s.replace(/\/+$/, "") || "/";
  const isSubmenuItemActive = props.menus
    .flatMap((menu) => menu.items)
    .some((item) => item.href && pathname.startsWith(item.href));
  const isActive = isSubmenuItemActive;

  // --- COLUMN AMOUNT ---
  const visibleMenus = props.menus.filter(
    (menu) =>
      (!menu.requiresLogin || isLoggedIn) &&
      (!menu.requiresAdmin || isAdmin) &&
      (!menu.requiresDev || isDev),
  );

  const cols = visibleMenus.length;

  // --- SCROLLBAR OBSERVER ---
  useEffect(() => {
    if (!isOpen) {
      return;
    }

    const element = innerRef.current;
    if (!element) {
      return;
    }

    const observer = new ResizeObserver(() => {
      setHasScrollbar(element.scrollHeight > element.clientHeight);
    });

    observer.observe(element);

    setHasScrollbar(element.scrollHeight > element.clientHeight);

    return () => {
      observer.disconnect();
    };
  }, [isOpen]);

  // --- CLOSE ON CLICK OUTSIDE ---
  useEffect(() => {
    if (!isOpen) {
      return;
    }

    const handleClickOutside = (event: MouseEvent | TouchEvent) => {
      const menuElement = innerRef.current;
      const buttonElement = buttonRef.current;
      const target = event.target as Node;

      if (
        menuElement &&
        !menuElement.contains(target) &&
        buttonElement &&
        !buttonElement.contains(target)
      ) {
        setIsOpen(false);
      }
    };

    document.addEventListener("mousedown", handleClickOutside);
    document.addEventListener("touchstart", handleClickOutside);

    return () => {
      document.removeEventListener("mousedown", handleClickOutside);
      document.removeEventListener("touchstart", handleClickOutside);
    };
  }, [isOpen]);

  // --- CLASSES ---
  // --- Submenu width ---
  let widthClasses = "";

  if (hasScrollbar) {
    widthClasses = "w-45";
  } else {
    widthClasses = "w-42";
  }

  if (isOpen) {
    widthClasses += " max-w-45";
  } else {
    widthClasses = " max-w-0";
  }

  if (cols === 1) {
    if (isOpen) {
      if (hasScrollbar) {
        widthClasses += " sm:w-45 sm:max-w-45";
      } else {
        widthClasses += " sm:w-42 sm:max-w-42";
      }
    } else {
      if (hasScrollbar) {
        widthClasses += " sm:w-42";
      } else {
        widthClasses += " sm:w-45";
      }
    }
  } else if (cols === 2) {
    if (isOpen) {
      if (hasScrollbar) {
        widthClasses += " sm:w-85 sm:max-w-85";
      } else {
        widthClasses += " sm:w-82 sm:max-w-82";
      }
    } else {
      if (hasScrollbar) {
        widthClasses += " sm:w-82";
      } else {
        widthClasses += " sm:w-85";
      }
    }
  } else if (cols >= 3) {
    if (isOpen) {
      if (hasScrollbar) {
        widthClasses += " sm:w-125 sm:max-w-125";
      } else {
        widthClasses += " sm:w-122 sm:max-w-122";
      }
    } else {
      if (hasScrollbar) {
        widthClasses += " sm:w-122";
      } else {
        widthClasses += " sm:w-125";
      }
    }
  }

  return (
    <>
      {(!props.requiresLogin || isLoggedIn) &&
        (!props.requiresAdmin || isAdmin) &&
        (!props.requiresDev || isDev) && (
          <div>
            <div>
              <button
                ref={buttonRef}
                onClick={() => {
                  if (!isOpen) {
                    setIsOpen(true);
                    props.onOpen?.();
                  } else {
                    setIsOpen(false);
                  }
                }}
                aria-haspopup="true"
                aria-controls="submenu-menu"
                aria-expanded={isOpen}
                className={`${isOpen ? "bg-(--bg-navbar-link)" : ""} ${isActive ? "text-(--accent-color)" : ""} group flex h-[40px] w-full cursor-pointer items-center justify-between rounded-lg p-2 transition-colors duration-(--fast) hover:bg-(--bg-navbar-link)`}
              >
                <div className="flex items-center gap-4">
                  <span className="relative flex h-6 w-6 items-center">
                    <props.icon
                      className={`${isOpen || isActive ? "opacity-0" : "opacity-100"} absolute transition-opacity duration-(--fast) group-hover:opacity-0`}
                    />
                    <props.iconHover
                      className={`${isOpen || isActive ? "opacity-100" : "opacity-0"} absolute text-(--accent-color) transition-opacity duration-(--fast) group-hover:opacity-100`}
                    />
                  </span>
                  <span
                    className={`${isActive ? "font-bold" : ""} flex truncate overflow-hidden`}
                  >
                    {props.label}
                  </span>
                </div>

                <ChevronRightIcon
                  className={`${
                    isOpen ? "rotate-180 text-(--accent-color)" : ""
                  } h-6 w-6 rotate-0 transition-[color,rotate] duration-(--fast) group-hover:text-(--accent-color)`}
                />
              </button>
            </div>
            <div
              ref={innerRef}
              id="submenu-menu"
              inert={!isOpen}
              className={` ${widthClasses} ${isOpen ? "visible" : "invisible"} ${props.hasScrollbar ? "left-67" : "left-64"} fixed top-0 h-full overflow-x-hidden border-r-1 border-(--border-main) bg-(--bg-navbar) transition-all duration-(--slow)`}
            >
              <div className="my-4 ml-4">
                <div className="mb-8 flex gap-2">
                  <props.iconHover className="flex max-h-4 min-h-4 max-w-4 min-w-4 text-(--accent-color)" />
                  {props.href ? (
                    <Link
                      href={props.href}
                      onClick={() => setIsOpen(false)}
                      className="truncate text-xs transition-colors duration-(--fast) hover:text-(--accent-color) hover:underline"
                    >
                      {props.label}
                    </Link>
                  ) : (
                    <span className="truncate text-xs">{props.label}</span>
                  )}

                  {props.onToggleFavourite && props.href && (
                    <CustomTooltip
                      content={
                        props.isFavourite && !props.favouriteDisabled
                          ? t("navbar.removeFavourite", { capitalize: true })
                          : !props.isFavourite && !props.favouriteDisabled
                            ? t("navbar.setFavourite", { capitalize: true })
                            : ""
                      }
                      longDelay
                      hideOnClick
                      showOnTouch
                    >
                      <button
                        className={`${props.favouriteDisabled ? "cursor-not-allowed opacity-50" : ""} group mr-2 ml-auto flex`}
                        onClick={(e) => {
                          e.preventDefault();

                          if (!props.favouriteDisabled) {
                            props.onToggleFavourite?.(
                              !!props.isFavourite,
                              props.href ?? "",
                            );
                          }
                        }}
                      >
                        {!props.isFavourite ? (
                          <HoverIcon
                            outline={OutlineStarIcon}
                            solid={SolidStarIcon}
                            className="h-4 min-h-4 w-4 min-w-4"
                          />
                        ) : (
                          <SolidStarIcon className="h-4 min-h-4 w-4 min-w-4" />
                        )}
                      </button>
                    </CustomTooltip>
                  )}
                </div>
                <div
                  className={`grid gap-x-2 gap-y-8 ${
                    cols === 1
                      ? "grid-cols-1"
                      : cols === 2
                        ? "sm:grid-cols-2"
                        : "sm:grid-cols-3"
                  } `}
                >
                  {props.menus.map((menu, index) => (
                    <div key={index}>
                      {(!menu.requiresLogin || isLoggedIn) &&
                        (!menu.requiresAdmin || isAdmin) &&
                        (!menu.requiresDev || isDev) && (
                          <ul
                            className={`${isOpen ? "opacity-100" : "opacity-0"} w-34 transition-opacity duration-(--fast)`}
                          >
                            {/* --- Border --- */}
                            <hr className="rounded-full text-(--border-main)" />
                            {/* --- /Border --- */}

                            <li className="my-1.5 flex border-(--border-main) text-sm [overflow-wrap:anywhere] uppercase">
                              {menu.label}
                            </li>

                            {/* --- Border --- */}
                            <hr className="rounded-full text-(--border-main)" />
                            {/* --- /Border --- */}

                            {menu.items.map((item, index) => {
                              const itemIsActive =
                                !!item.href &&
                                strip(pathname) === strip(item.href);

                              const handleFavouriteToggle = () => {
                                item.onToggleFavourite?.(
                                  !!item.isFavourite,
                                  item.href ?? "",
                                );
                              };

                              return (
                                <div key={index}>
                                  {(!item.requiresLogin || isLoggedIn) &&
                                    (!item.requiresAdmin || isAdmin) &&
                                    (!item.requiresDev || isDev) && (
                                      <div>
                                        <li
                                          className={`${item.title ? "text-xs font-semibold [overflow-wrap:anywhere] uppercase" + (index === 0 ? " mt-4 mb-1" : " mt-8 mb-1") : ""} ${!item.title && index === 0 ? "mt-2" : ""}`}
                                        >
                                          {item.title ?? ""}
                                        </li>

                                        <CustomTooltip
                                          content={item.tooltip ?? ""}
                                          showOnTouch
                                          mediumDelay
                                        >
                                          <li className="group/link flex w-34 items-center rounded-lg transition-colors hover:bg-(--bg-navbar-link)">
                                            {item.href ? (
                                              <Link
                                                onClick={(e) => {
                                                  if (item.disabled) {
                                                    e.preventDefault();
                                                    return;
                                                  }

                                                  setIsOpen(false);
                                                }}
                                                href={item.href}
                                                tabIndex={isOpen ? 0 : -1}
                                                className={`${itemIsActive ? "font-bold text-(--accent-color)" : "text-(--text-navbar)"} ${item.disabled ? "cursor-not-allowed opacity-50" : ""} flex h-full w-full p-2 text-sm [overflow-wrap:anywhere]`}
                                              >
                                                {item.label}
                                              </Link>
                                            ) : (
                                              <button
                                                onClick={item.onClick}
                                                tabIndex={isOpen ? 0 : -1}
                                                className={`${item.disabled ? "cursor-not-allowed opacity-50" : ""} flex h-full w-full cursor-pointer p-2 text-sm [overflow-wrap:anywhere] text-(--text-navbar)`}
                                              >
                                                {item.label}
                                              </button>
                                            )}

                                            {item.onToggleFavourite && (
                                              <CustomTooltip
                                                content={
                                                  item.isFavourite &&
                                                  !item.disabled
                                                    ? t(
                                                        "Navbar/Remove favourite",
                                                      )
                                                    : !item.isFavourite &&
                                                        !item.disabled
                                                      ? t(
                                                          "Navbar/Set favourite",
                                                        )
                                                      : ""
                                                }
                                                longDelay
                                                hideOnClick
                                                showOnTouch
                                              >
                                                <button
                                                  // className={`${item.disabled ? "cursor-not-allowed group-hover/link:opacity-50" : "group-hover/link:opacity-100"} group mr-2 ml-auto flex opacity-0`}
                                                  className={`${item.disabled ? "cursor-not-allowed opacity-50" : ""} group mr-2 ml-auto flex opacity-100`}
                                                  onClick={(e) => {
                                                    e.preventDefault();

                                                    if (!item.disabled) {
                                                      handleFavouriteToggle();
                                                    }
                                                  }}
                                                >
                                                  {!item.isFavourite ? (
                                                    <HoverIcon
                                                      outline={OutlineStarIcon}
                                                      solid={SolidStarIcon}
                                                      className="h-4 min-h-4 w-4 min-w-4"
                                                    />
                                                  ) : (
                                                    <SolidStarIcon className="h-4 min-h-4 w-4 min-w-4" />
                                                  )}
                                                </button>
                                              </CustomTooltip>
                                            )}
                                          </li>
                                        </CustomTooltip>
                                      </div>
                                    )}
                                </div>
                              );
                            })}
                          </ul>
                        )}
                    </div>
                  ))}
                </div>
              </div>
            </div>
          </div>
        )}
    </>
  );
};

export default NavbarSubmenu;
