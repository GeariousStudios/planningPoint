"use client";

import { useState, useRef, useEffect } from "react";
import Input from "@/app/components/common/Input";
import { createPortal } from "react-dom";

export default function ExcelAutocomplete({
  options,
  value,
  onChange,
  placeholder,
  disabled,
}: {
  options: { label: string; value: string }[];
  value: string;
  onChange: (val: string) => void;
  placeholder?: string;
  disabled?: boolean;
}) {
  const [open, setOpen] = useState(false);
  const [inputValue, setInputValue] = useState(value);
  const ref = useRef<HTMLDivElement>(null);

  const matches = options.filter((o) =>
    o.label.startsWith(inputValue.toUpperCase()),
  );

  const [portalPos, setPortalPos] = useState({ top: 0, left: 0, width: 0 });

  useEffect(() => {
    if (!open) return;
    if (!ref.current) return;

    const rect = ref.current.getBoundingClientRect();

    setPortalPos({
      top: rect.bottom,
      left: rect.left + 8,
      width: rect.width - 16,
    });
  }, [open]);

  useEffect(() => {
    const handler = (e: MouseEvent) => {
      if (!ref.current?.contains(e.target as Node)) setOpen(false);
    };
    document.addEventListener("mousedown", handler);
    return () => document.removeEventListener("mousedown", handler);
  }, []);

  const trySetValue = (raw: string) => {
    const clean = raw.toUpperCase().replace(/[^A-Z]/g, "");

    if (clean === "") {
      setInputValue("");
      onChange("");
      setOpen(false);
      return;
    }

    if (clean.length > 3) return;

    const matching = options.filter((o) => o.value.startsWith(clean));
    if (matching.length === 0) return;

    setInputValue(clean);
    setOpen(true);

    const exact = options.find((o) => o.value === clean);
    if (exact) onChange(clean);
  };

  useEffect(() => {
    setInputValue(value);
  }, [value]);

  return (
    <div ref={ref} className="relative w-full">
      <Input
        type="text"
        placeholder={placeholder ?? ""}
        value={inputValue}
        onChange={(val) => trySetValue(String(val))}
        onKeyDown={(e) => {
          if (e.key === "Enter" && matches.length > 0) {
            const v = matches[0].value;
            setInputValue(v);
            onChange(v);
            setOpen(false);
          }
        }}
        disabled={disabled}
      />

      {!disabled && open &&
        inputValue !== "" &&
        matches.length > 0 &&
        createPortal(
          <div
            style={{
              position: "absolute",
              top: portalPos.top,
              left: portalPos.left,
              width: portalPos.width,
            }}
            onMouseDown={(e) => e.stopPropagation()}
            onClick={(e) => e.stopPropagation()}
            className="z-50 max-h-48 overflow-y-auto rounded-b border border-t-0 border-(--border-main) bg-(--bg-main)"
          >
            {matches.map((m) => (
              <div
                key={m.value}
                className="cursor-pointer px-3 py-2 hover:bg-(--bg-grid-header-hover)"
                onClick={() => {
                  setInputValue(m.value);
                  onChange(m.value);
                  setOpen(false);
                }}
              >
                {m.label}
              </div>
            ))}
          </div>,
          document.body,
        )}
    </div>
  );
}
