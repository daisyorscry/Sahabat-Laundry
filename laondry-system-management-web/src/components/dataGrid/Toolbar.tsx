"use client";

import * as React from "react";
import { AnimatePresence, motion } from "framer-motion";
import { FiCheck, FiChevronDown, FiSearch } from "react-icons/fi";

import Button from "@/components/button/Button";

import type { DataGridLayoutProps, SortOrder } from "./types";

/** on-click-outside (ref nullable) */
function useOnClickOutside<T extends HTMLElement>(ref: React.RefObject<T | null>, cb: () => void) {
  React.useEffect(() => {
    const handler = (e: MouseEvent) => {
      if (!ref.current) return;
      if (!ref.current.contains(e.target as Node)) cb();
    };
    document.addEventListener("mousedown", handler);
    return () => document.removeEventListener("mousedown", handler);
  }, [cb, ref]);
}

/** debounce callback */
// eslint-disable-next-line @typescript-eslint/no-explicit-any
function useDebouncedCallback<T extends (...args: any[]) => void>(fn: T, delay = 300) {
  const timer = React.useRef<NodeJS.Timeout | null>(null);
  const saved = React.useRef(fn);
  React.useEffect(() => {
    saved.current = fn;
  }, [fn]);

  return React.useCallback(
    (...args: Parameters<T>) => {
      if (timer.current) clearTimeout(timer.current);
      timer.current = setTimeout(() => saved.current(...args), delay);
    },
    [delay]
  );
}

/** Search (fixed width, theme-ready) */
function SearchField({
  value,
  placeholder,
  onChange,
}: {
  value?: string;
  placeholder?: string;
  onChange?: (val: string) => void;
}) {
  const [inner, setInner] = React.useState(value ?? "");
  const debounced = useDebouncedCallback((v: string) => onChange?.(v), 300);
  const editableRef = React.useRef<HTMLDivElement | null>(null);

  React.useEffect(() => {
    const next = value ?? "";
    setInner(next);
    if (editableRef.current) editableRef.current.textContent = next;
  }, [value]);

  const readText = React.useCallback(() => (editableRef.current?.textContent ?? "").trim(), []);
  const onInput = React.useCallback(() => {
    const v = readText();
    setInner(v);
    debounced(v);
  }, [debounced, readText]);
  const onKeyDown = React.useCallback(
    (e: React.KeyboardEvent<HTMLDivElement>) => {
      if (e.key === "Enter") {
        e.preventDefault();
        onChange?.(readText());
      }
    },
    [onChange, readText]
  );

  const showPlaceholder = (inner ?? "").length === 0;

  return (
    <div
      className={[
        "group relative inline-flex h-9 w-[260px] items-center gap-2 rounded-md px-3 text-sm",
        "border border-[var(--color-border)] bg-[var(--color-surface)]",
        "transition-colors focus-within:ring-2 focus-within:ring-[var(--ring-color)]",
      ].join(" ")}
      role="search"
      aria-label="Pencarian"
    >
      <FiSearch
        aria-hidden
        className="text-[color-mix(in oklab,var(--color-foreground) 70%,var(--color-background))] shrink-0"
      />
      <div
        ref={editableRef}
        contentEditable
        role="textbox"
        aria-label="Cari"
        spellCheck={false}
        className="min-w-0 flex-1 text-[var(--color-foreground)] outline-none"
        onInput={onInput}
        onKeyDown={onKeyDown}
      />
      {showPlaceholder && (
        <span
          aria-hidden
          className="text-[color-mix(in oklab,var(--color-foreground) 60%,var(--color-background))] pointer-events-none absolute inset-y-0 left-8 flex items-center select-none"
        >
          {placeholder ?? "Cari..."}
        </span>
      )}
    </div>
  );
}

/** Dropdown Sort (tanpa <select>, theme-ready) */
function SortDropdown({
  selectedKey,
  selectedOrder,
  options,
  onChange,
}: {
  selectedKey?: string;
  selectedOrder?: SortOrder;
  options: { label: string; value: string; order?: SortOrder }[];
  onChange?: (next: { sortKey: string; sortOrder: SortOrder }) => void;
}) {
  const [open, setOpen] = React.useState(false);
  const menuRef = React.useRef<HTMLDivElement | null>(null);
  useOnClickOutside(menuRef, () => setOpen(false));

  const currentLabel =
    options.find((o) => o.value === selectedKey && (o.order ?? "asc") === (selectedOrder ?? "asc"))
      ?.label ?? "Urutkan";

  return (
    <div className="relative inline-flex">
      <Button
        variant="outline"
        tone="neutral"
        size="sm"
        aria-haspopup="listbox"
        aria-expanded={open}
        aria-label="Urutkan"
        onClick={() => setOpen((s) => !s)}
        rightIcon={
          <motion.span
            initial={false}
            animate={{ rotate: open ? 180 : 0 }}
            transition={{ duration: 0.14 }}
            className="inline-flex"
          >
            <FiChevronDown />
          </motion.span>
        }
      >
        {currentLabel}
      </Button>

      <AnimatePresence>
        {open && (
          <motion.div
            ref={menuRef}
            role="listbox"
            aria-label="Pilih pengurutan"
            initial={{ opacity: 0, y: -4, scale: 0.995 }}
            animate={{ opacity: 1, y: 6, scale: 1 }}
            exit={{ opacity: 0, y: -4, scale: 0.995 }}
            transition={{ duration: 0.12, ease: "easeOut" }}
            className="absolute right-0 z-20 mt-1.5 min-w-[180px] overflow-hidden rounded-xl border border-[var(--color-border)] bg-[var(--color-surface)] shadow-xl"
            style={{ transformOrigin: "top right" }}
          >
            {options.map((opt) => {
              const order = opt.order ?? "asc";
              const active = opt.value === selectedKey && order === (selectedOrder ?? "asc");
              return (
                <button
                  key={`${opt.value}:${order}`}
                  role="option"
                  aria-selected={active}
                  className={[
                    "flex w-full items-center justify-between px-3 py-2 text-sm",
                    "hover:bg-[color-mix(in oklab,var(--color-foreground) 6%,transparent)]",
                    active
                      ? "font-medium text-[var(--color-foreground)]"
                      : "text-[color-mix(in oklab,var(--color-foreground) 70%,var(--color-background))]",
                  ].join(" ")}
                  onClick={() => {
                    onChange?.({ sortKey: opt.value, sortOrder: order });
                    setOpen(false);
                  }}
                >
                  <span>{opt.label}</span>
                  {active ? <FiCheck /> : null}
                </button>
              );
            })}
          </motion.div>
        )}
      </AnimatePresence>
    </div>
  );
}

export default function Toolbar<T>({
  searchable,
  query,
  onQueryChange,
  searchPlaceholder,
  sortable,
  sortKey,
  sortOrder,
  onSortChange,
  sortOptions,
  actions,
}: Pick<
  DataGridLayoutProps<T>,
  | "searchable"
  | "query"
  | "onQueryChange"
  | "searchPlaceholder"
  | "sortable"
  | "sortKey"
  | "sortOrder"
  | "onSortChange"
  | "sortOptions"
  | "actions"
>) {
  return (
    <div className="flex flex-wrap items-center justify-between gap-3">
      <div className="flex flex-wrap items-center gap-2">
        {searchable && (
          <SearchField
            value={query}
            placeholder={searchPlaceholder ?? "Cari..."}
            onChange={onQueryChange}
          />
        )}

        {sortable && !!sortOptions?.length && onSortChange && (
          <SortDropdown
            selectedKey={sortKey}
            selectedOrder={sortOrder ?? "asc"}
            options={sortOptions}
            onChange={onSortChange}
          />
        )}
      </div>

      {actions ? <div className="flex items-center gap-2">{actions}</div> : null}
    </div>
  );
}
