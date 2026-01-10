"use client";

import { useState, useRef, useEffect, useMemo } from "react";
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

  const matches = useMemo(() => {
    const q = inputValue.toUpperCase();
    if (q === "") return options.slice(0, 200);
    return options.filter((o) => o.label.startsWith(q)).slice(0, 200);
  }, [options, inputValue]);

  const [portalPos, setPortalPos] = useState({ top: 0, left: 0, width: 0 });

  const updatePos = () => {
    if (!ref.current) return;
    const rect = ref.current.getBoundingClientRect();
    setPortalPos({
      top: rect.bottom,
      left: rect.left + 8,
      width: rect.width - 16,
    });
  };

  useEffect(() => {
    if (!open) return;
    updatePos();
  }, [open]);

  useEffect(() => {
    if (!open) return;
    const onResize = () => updatePos();
    const onScroll = () => updatePos();
    window.addEventListener("resize", onResize);
    window.addEventListener("scroll", onScroll, true);
    return () => {
      window.removeEventListener("resize", onResize);
      window.removeEventListener("scroll", onScroll, true);
    };
  }, [open]);

  useEffect(() => {
    const handler = (e: MouseEvent) => {
      const target = e.target as Node;
      if (!ref.current?.contains(target)) setOpen(false);
    };
    document.addEventListener("mousedown", handler);
    return () => document.removeEventListener("mousedown", handler);
  }, []);

  const trySetValue = (raw: string) => {
    const clean = raw.toUpperCase().replace(/[^A-Z]/g, "");

    if (clean === "") {
      setInputValue("");
      onChange("");
      setOpen(true);
      return;
    }

    if (clean.length > 3) return;

    const hasAny = options.some((o) => o.value.startsWith(clean));
    if (!hasAny) return;

    setInputValue(clean);
    setOpen(true);

    if (options.some((o) => o.value === clean)) onChange(clean);
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
        onFocus={() => {
          if (disabled) return;
          setOpen(true);
        }}
        onKeyDown={(e) => {
          if (e.key === "Enter" && matches.length > 0) {
            const v = matches[0].value;
            setInputValue(v);
            onChange(v);
            setOpen(false);
          }
          if (e.key === "Escape") setOpen(false);
        }}
        disabled={disabled}
      />

      {!disabled &&
        open &&
        matches.length > 0 &&
        createPortal(
          <div
            style={{
              position: "fixed",
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
