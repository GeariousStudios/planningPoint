"use client";

import useTN from "@/app/hooks/useTN";
import { hyperLinkButtonClass } from "@/app/styles/buttonClasses";
import {
  ArrowPathIcon,
  ExclamationCircleIcon,
  FaceFrownIcon,
  IdentificationIcon,
  MagnifyingGlassCircleIcon,
  NoSymbolIcon,
  UserIcon,
  TagIcon,
  InboxIcon,
  InboxStackIcon,
  LockClosedIcon,
  WrenchScrewdriverIcon,
  MinusIcon,
} from "@heroicons/react/24/outline";
import Link from "next/link";
import { ElementType, ReactNode, useEffect, useState } from "react";

type Props = {
  content?: string;
  icon?: string;
  fullscreen?: boolean;
  withinContainer?: boolean;
  sideMessage?: boolean;
};

const Message = (props: Props) => {
  const t = useTN();

  const [Icon, setIcon] = useState<ElementType | null>(null);

  const iconMap: Record<string, ElementType> = {
    loading: ArrowPathIcon,
    deny: IdentificationIcon,
    server: NoSymbolIcon,
    user: UserIcon,
    category: TagIcon,
    unit: InboxIcon,
    unitGroup: InboxStackIcon,
    beware: ExclamationCircleIcon,
    search: MagnifyingGlassCircleIcon,
    lock: LockClosedIcon,
    work: WrenchScrewdriverIcon,
    noData: MinusIcon,
  };

  const contentMap: Record<string, ReactNode> = {
    loading: t("message.loading", { capitalize: true, end: "..." }),
    auth: t("message.auth", { capitalize: true, end: "..." }),
    deny: (
      <div className="flex flex-col">
        <span>{t("message.deny1", { capitalize: true, end: "!" })}</span>{" "}
        <span>
          <Link href="/" className={`${hyperLinkButtonClass}`}>
            {t("message.deny2", { capitalize: true })}
          </Link>{" "}
          {t("message.deny3", { end: "." })}
        </span>
      </div>
    ),
    server: t("message.server", { capitalize: true, end: "!" }),
    lock: (
      <div className="flex flex-col">
        <span>{t("message.lock1", { capitalize: true, end: "!" })}</span>
        <span>{t("message.lock2", { capitalize: true, end: "." })}</span>
      </div>
    ),
    invalid: (
      <div className="flex flex-col">
        <span>{t("message.invalid", { capitalize: true, end: "." })}</span>
      </div>
    ),
    content: (
      <div className="flex flex-col">
        <span>{t("message.content", { capitalize: true, end: "..." })}</span>
      </div>
    ),
  };

  useEffect(() => {
    setIcon(() => (props.icon ? (iconMap[props.icon] ?? null) : null));
  }, [props.icon]);

  const content = (props.content && contentMap[props.content]) ?? props.content;

  return (
    <div
      className={`${props.fullscreen ? "fixed inset-0 overflow-auto" : "h-full grow"} ${!props.withinContainer && props.fullscreen ? "ml-18 md:ml-64" : props.withinContainer && props.fullscreen && ""} flex items-center justify-center`}
    >
      <div
        className={`${props.sideMessage ? "" : "flex-col"} flex items-center gap-3 opacity-75`}
      >
        {props.icon && Icon ? (
          <Icon
            className={`${props.icon === "loading" ? "motion-safe:animate-[spin_2s_linear_infinite]" : ""} h-8 w-8`}
          />
        ) : props.icon ? (
          <div className="h-8 w-8" />
        ) : (
          <FaceFrownIcon className="h-8 w-8" />
        )}
        {content && <span className="text-center">{content}</span>}
      </div>
    </div>
  );
};

export default Message;
