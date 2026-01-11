"use client";

import Link from "next/link";
import { useTranslations } from "next-intl";
import NavbarLink from "@/app/components/navbar/NavbarLink";

type Props = {
  isConnected: boolean | null;
};

type Link = {
  title?: string;
  href: string;
  label: string;
};

type LinkSection = {
  sectionLabel: string;
  items: Link[];
};

const DeveloperManageClient = (props: Props) => {
  const t = useTranslations();

  const sections: LinkSection[] = [
    {
      sectionLabel: t("Common/Users"),
      items: [{ href: "/developer/manage/users/", label: t("Common/Users") }],
    },
  ];

  return (
    <div className="flex w-full flex-col gap-8">
      {/* <div className="xs:grid-cols-2 grid grid-cols-1 gap-4 lg:grid-cols-3 xl:grid-cols-4"> */}
      <div>
        {sections.map((section, sectionIndex) => (
          <div key={section.sectionLabel} className="p-4">
            <hr className="my-2 flex rounded-full text-(--border-main)" />
            <div className="font-semibold uppercase">
              {section.sectionLabel}
            </div>
            <hr className="my-2 flex rounded-full text-(--border-main)" />

            <div className="flex flex-col gap-2">
              {section.items.map((item) => (
                <div key={item.href} className="flex flex-col">
                  {item.title && (
                    <div
                      className={`${sectionIndex !== 0 ? "mt-6" : "mt-2"} mb-1 text-sm font-semibold uppercase`}
                    >
                      {item.title}
                    </div>
                  )}

                  <NavbarLink href={item.href} label={item.label} />
                </div>
              ))}
            </div>
          </div>
        ))}
      </div>
    </div>
  );
};

export default DeveloperManageClient;
