"use client";

import NavbarLink from "@/app/components/navbar/NavbarLink";

export type NavItem = {
  title?: string;
  href: string;
  label: string;
};

export type NavSection = {
  sectionLabel: string;
  items: NavItem[];
};

export type NavVariant = "grid-sections" | "single-grouped";

type Props = {
  sections: NavSection[];
  variant: NavVariant;
  pageLabel?: string;
};

const SectionFrame = ({
  label,
  showLabel,
  children,
}: {
  label: string;
  showLabel: boolean;
  children: React.ReactNode;
}) => {
  return (
    // <div className="p-4 bg-(--border-secondary) rounded-lg">
    <div className="p-4">
      <hr className="my-2 flex rounded-full text-(--border-main)" />
      {showLabel && <div className="font-semibold uppercase">{label}</div>}
      <hr className="my-2 flex rounded-full text-(--border-main)" />
      {children}
    </div>
  );
};

const ItemTitle = ({
  text,
  isFirstSection,
}: {
  text: string;
  isFirstSection: boolean;
}) => {
  return (
    <div
      className={`${!isFirstSection ? "mt-6" : "mt-4"} mb-1 text-sm font-semibold uppercase`}
    >
      {text}
    </div>
  );
};

const normalize = (s?: string) => (s ?? "").trim().toLowerCase();

const NavPage = ({ sections, variant, pageLabel }: Props) => {
  if (variant === "grid-sections") {
    return (
      <div className="flex w-full flex-col gap-8">
        <div className="xs:grid-cols-2 grid grid-cols-1 gap-4 lg:grid-cols-3 xl:grid-cols-4">
          {sections.map((section) => (
            <SectionFrame
              key={section.sectionLabel}
              label={section.sectionLabel}
              showLabel={true}
            >
              <div className="flex flex-col gap-2">
                {section.items.map((item, itemIndex) => (
                  <div key={item.href} className="flex flex-col">
                    {item.title && (
                      <ItemTitle
                        text={item.title}
                        isFirstSection={itemIndex === 0}
                      />
                    )}
                    <NavbarLink href={item.href} label={item.label} />
                  </div>
                ))}
              </div>
            </SectionFrame>
          ))}
        </div>
      </div>
    );
  }

  const showPageLabel = !!pageLabel;

  return (
    <div className="flex w-full flex-col gap-8">
      <div>
        <SectionFrame label={pageLabel ?? ""} showLabel={showPageLabel}>
          {sections.map((section, sectionIndex) => {
            const firstItemLabel = section.items[0]?.label;
            const sectionEqualsPage =
              normalize(section.sectionLabel) === normalize(pageLabel);
            const singleItemEqualsSection =
              section.items.length === 1 &&
              normalize(firstItemLabel) === normalize(section.sectionLabel);

            const showSectionTitle =
              !sectionEqualsPage && !singleItemEqualsSection;

            return (
              <div key={section.sectionLabel} className="flex flex-col gap-2">
                {section.items.map((item, itemIndex) => (
                  <div key={item.href} className="flex flex-col">
                    {itemIndex === 0 && showSectionTitle && (
                      <ItemTitle
                        text={section.sectionLabel}
                        isFirstSection={sectionIndex === 0}
                      />
                    )}
                    <NavbarLink href={item.href} label={item.label} />
                  </div>
                ))}
              </div>
            );
          })}
        </SectionFrame>
      </div>
    </div>
  );
};

export default NavPage;
