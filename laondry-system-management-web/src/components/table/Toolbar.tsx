/* eslint-disable @typescript-eslint/no-explicit-any */
// src/components/table/Toolbar.tsx
"use client";

import { motion } from "framer-motion";
import * as React from "react";

import { useFormTheme } from "@/components/theme/formTheme";
import { cn } from "@/lib/utility";

import DebouncedInput from "./DebouncedInput";

// src/components/table/Toolbar.tsx

type FilterItem = {
  id: string;
  label: string;
  value: string | number | boolean | null;
  onChange: (v: any) => void;
  renderer?: React.ReactNode;
};

type Props = {
  search?: { value: string; onChange: (v: string) => void; placeholder?: string };
  filters?: FilterItem[];
  leftSlot?: React.ReactNode;
  rightSlot?: React.ReactNode;
  className?: string;
};

export default function Toolbar({ search, filters = [], leftSlot, rightSlot, className }: Props) {
  const theme = useFormTheme();
  const searchRef = React.useRef<HTMLInputElement | null>(null);

  React.useEffect(() => {
    const onKey = (e: KeyboardEvent) => {
      const tag = (e.target as HTMLElement)?.tagName?.toLowerCase();
      if (tag === "input" || tag === "textarea" || (e as any).isComposing) return;

      if (e.key === "/") {
        e.preventDefault();
        searchRef.current?.focus();
      } else if (e.key === "Escape" && search?.value) {
        search.onChange("");
      }
    };
    window.addEventListener("keydown", onKey);
    return () => window.removeEventListener("keydown", onKey);
  }, [search]);

  const pad = (opts: { leftIcon?: boolean; rightIcon?: boolean }) =>
    typeof theme.inputPadding === "function" ? theme.inputPadding(opts) : theme.inputPadding;

  return (
    <motion.div
      layout
      initial={{ opacity: 0, y: -6 }}
      animate={{ opacity: 1, y: 0 }}
      transition={{ duration: 0.16, ease: "easeOut" }}
      className={cn(
        "flex flex-col gap-3 md:flex-row md:items-center md:justify-between",
        className
      )}
    >
      {/* Search */}
      {search && (
        <div className="relative">
          <svg
            className="text-foreground/50 pointer-events-none absolute top-1/2 left-2.5 h-4 w-4 -translate-y-1/2 focus-visible:outline-none"
            viewBox="0 0 24 24"
            fill="none"
            stroke="currentColor"
            strokeWidth={2}
            aria-hidden
          >
            <circle cx="11" cy="11" r="7" />
            <path d="M21 21l-4.3-4.3" />
          </svg>

          <DebouncedInput
            ref={searchRef}
            value={search.value}
            onValueChange={search.onChange}
            placeholder={search.placeholder ?? "Cari nama/kode..."}
            className={cn(
              theme.inputBase,
              theme.inputSurf?.normal,
              pad({ leftIcon: true, rightIcon: Boolean(search.value?.length) }),
              "h-9 w-[220px] md:w-[260px]",
              // base
              "border-border bg-background text-foreground appearance-none border",
              // matikan outline browser (mouse & keyboard)
              "outline-none focus:outline-none focus-visible:outline-none",
              // ring sesuai style sekarang = sama dengan border-primary
              "ring-[var(--border-primary)] focus:ring-2 focus-visible:ring-2",
              // hilangkan halo putih: pakai warna offset = background & width = 0
              "ring-offset-background focus:ring-offset-0 focus-visible:ring-offset-0",
              // jaga urutan menang
              "transition-colors"
            )}
          />

          {search.value?.length > 0 && (
            <button
              type="button"
              aria-label="Bersihkan pencarian"
              onClick={() => search.onChange("")}
              className={cn(
                "absolute top-1/2 right-2.5 -translate-y-1/2 rounded p-1",
                "text-foreground/50 hover:bg-background/80 hover:text-foreground/80",
                "focus-visible:outline-none"
              )}
            >
              <svg
                viewBox="0 0 24 24"
                className="h-3.5 w-3.5"
                fill="none"
                stroke="currentColor"
                strokeWidth={2}
              >
                <path d="M18 6L6 18M6 6l12 12" strokeLinecap="round" />
              </svg>
            </button>
          )}
        </div>
      )}

      {/* Left slot */}
      <div className="flex items-center gap-2">{leftSlot}</div>

      {/* Right group: filters + rightSlot */}
      <div className="flex flex-1 items-center justify-end gap-2">
        {/* Filters */}
        {filters.map((f) =>
          f.renderer ? (
            <div key={f.id} className="min-w-[120px]">
              {f.renderer}
            </div>
          ) : (
            <label key={f.id} className="inline-flex items-center gap-2">
              <span className={theme.label}>{f.label}</span>
              <select
                className={cn(
                  theme.inputBase,
                  theme.inputSurf?.normal,
                  pad({ leftIcon: false, rightIcon: false }),
                  "h-9",
                  // border token + ring token konsisten
                  "border-border border",
                  "ring-[var(--border-primary)] focus-visible:ring-2 focus-visible:ring-offset-0 focus-visible:outline-none"
                )}
                value={(f.value as any) ?? ""}
                onChange={(e) => f.onChange(e.target.value === "" ? null : e.target.value)}
              >
                <option value="">Semua</option>
                {/* opsi dari luar */}
              </select>
            </label>
          )
        )}

        {rightSlot}
      </div>
    </motion.div>
  );
}
