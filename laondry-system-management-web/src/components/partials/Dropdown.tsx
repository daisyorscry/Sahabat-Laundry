// components/ui/Dropdown.tsx
"use client";

import React, { useEffect, useMemo, useRef, useState } from "react";
import { AnimatePresence, motion } from "framer-motion";
import { HiChevronDown } from "react-icons/hi";

export type Option<T extends string = string> = {
  label: string;
  value: T;
};

type DropdownProps<T extends string = string> = {
  value?: T | "";
  onChange?: (val: T) => void;
  options: Option<T>[];
  placeholder?: string;
  className?: string;
  leftIcon?: React.ComponentType<React.SVGProps<SVGSVGElement>>;
  disabled?: boolean;
  id?: string;
  closeOnSelect?: boolean;
  "aria-labelledby"?: string;

  // searchable + infinite scroll
  searchable?: boolean;
  searchPlaceholder?: string;
  searchValue?: string; // controlled
  onSearchChange?: (term: string) => void;
  isLoading?: boolean;
  noOptionsText?: string;
  onReachBottom?: () => void;
};

export default function Dropdown<T extends string = string>({
  value = "",
  onChange,
  options,
  placeholder = "Pilih...",
  className = "",
  leftIcon: LeftIcon,
  disabled,
  id,
  closeOnSelect = true,
  searchable = false,
  searchPlaceholder = "Cari…",
  searchValue,
  onSearchChange,
  isLoading = false,
  noOptionsText = "Tidak ada opsi",
  onReachBottom,
  ...aria
}: DropdownProps<T>) {
  const [open, setOpen] = useState(false);
  const rootRef = useRef<HTMLDivElement>(null);
  const btnRef = useRef<HTMLButtonElement>(null);
  const popRef = useRef<HTMLDivElement>(null);
  const listRef = useRef<HTMLUListElement>(null);
  const searchInputRef = useRef<HTMLInputElement>(null);

  const [activeIdx, setActiveIdx] = useState<number>(-1);
  const prevValueRef = useRef<typeof value>(value);

  // internal search jika tidak controlled
  const [innerSearch] = useState("");
  const searchTerm = searchValue !== undefined ? searchValue : innerSearch;

  const selected = useMemo(() => options.find((o) => o.value === value) ?? null, [options, value]);

  // Tutup ketika value berubah dari luar (dan closeOnSelect aktif)
  useEffect(() => {
    if (open && value !== prevValueRef.current && closeOnSelect) setOpen(false);
    prevValueRef.current = value;
  }, [value, open, closeOnSelect]);

  // Klik di luar
  useEffect(() => {
    if (!open) return;
    const onDocPointerDown = (e: PointerEvent) => {
      const t = e.target as Node;
      if (rootRef.current && !rootRef.current.contains(t)) setOpen(false);
    };
    window.addEventListener("pointerdown", onDocPointerDown, true);
    return () => window.removeEventListener("pointerdown", onDocPointerDown, true);
  }, [open]);

  // Keyboard nav (clamp index)
  useEffect(() => {
    if (!open) return;
    const onKey = (e: KeyboardEvent) => {
      const isInSearch = document.activeElement === searchInputRef.current;

      if (e.key === "Escape") setOpen(false);

      if (e.key === "ArrowDown") {
        e.preventDefault();
        setActiveIdx((i) => {
          if (options.length === 0) return -1;
          if (i < 0) return 0;
          return Math.min(i + 1, options.length - 1);
        });
      }

      if (e.key === "ArrowUp") {
        e.preventDefault();
        setActiveIdx((i) => {
          if (options.length === 0) return -1;
          if (i <= 0) return 0;
          return i - 1;
        });
      }

      if (e.key === "Enter" && !isInSearch) {
        e.preventDefault();
        setActiveIdx((i) => {
          const hasActive = i >= 0 && i < options.length;
          if (hasActive) onChange?.(options[i].value);
          if (hasActive && closeOnSelect) setOpen(false);
          return i;
        });
      }
    };
    window.addEventListener("keydown", onKey);
    return () => window.removeEventListener("keydown", onKey);
  }, [open, options, closeOnSelect, onChange]);

  // Saat open: posisikan fokus item ke value terpilih atau index 0 jika ada options
  useEffect(() => {
    if (!open) return;
    const idx = options.findIndex((o) => o.value === value);
    setActiveIdx(() => (options.length === 0 ? -1 : idx >= 0 ? idx : 0));
    if (searchable) setTimeout(() => searchInputRef.current?.focus(), 0);
  }, [open, options, value, searchable]);

  // Set activeIdx ke -1 saat ditutup
  useEffect(() => {
    if (!open) setActiveIdx(-1);
  }, [open]);

  // CLAMP: ketika options berubah (mis. hasil search menyusut), jaga activeIdx valid
  useEffect(() => {
    setActiveIdx((i) => {
      if (options.length === 0) return -1;
      if (i < 0) return -1;
      return Math.min(i, options.length - 1);
    });
  }, [options]);

  // Saat searchTerm berubah saat dropdown terbuka, reset highlight ke item pertama (kalau ada)
  useEffect(() => {
    if (!open) return;
    setActiveIdx(options.length ? 0 : -1);
  }, [searchTerm, open, options.length]);

  // infinite scroll detection
  useEffect(() => {
    const el = listRef.current;
    if (!open || !el || !onReachBottom) return;
    const onScroll = () => {
      const nearBottom = el.scrollTop + el.clientHeight >= el.scrollHeight - 24;
      if (nearBottom) onReachBottom();
    };
    el.addEventListener("scroll", onScroll);
    return () => el.removeEventListener("scroll", onScroll);
  }, [open, onReachBottom]);

  const selectOption = (opt: Option<T>) => {
    try {
      onChange?.(opt.value);
    } finally {
      if (closeOnSelect) setOpen(false);
    }
  };

  const baseInput = "input relative w-full min-h-10 items-center outline-none focus-visible:ring-2";
  const paddingInput = `${LeftIcon ? "pl-10" : "pl-3"} pr-8`;

  const activeOpt = activeIdx >= 0 && activeIdx < options.length ? options[activeIdx] : null;

  const listboxId = id ? `${id}-listbox` : undefined;

  return (
    <div ref={rootRef} className={`relative ${className} border-border rounded-lg border`}>
      <button
        ref={btnRef}
        id={id}
        type="button"
        disabled={disabled}
        className={`${baseInput} ${paddingInput} ${
          disabled ? "cursor-not-allowed opacity-60" : ""
        }`}
        aria-haspopup="listbox"
        aria-expanded={open}
        aria-controls={open ? listboxId : undefined}
        onPointerDown={(e) => {
          if (popRef.current?.contains(e.target as Node)) return;
          setOpen((s) => !s);
        }}
        {...aria}
      >
        {LeftIcon && (
          <span className="absolute top-3 left-3 flex items-center">
            <LeftIcon className="text-foreground/60 h-4 w-4" />
          </span>
        )}
        <span
          className={`block truncate text-left text-sm ${LeftIcon ? "ml-6" : ""} ${
            selected ? "" : "text-foreground/60"
          }`}
        >
          {selected ? selected.label : placeholder}
        </span>
        <HiChevronDown
          className="text-foreground/60 pointer-events-none absolute top-2 right-2 h-5 w-5"
          aria-hidden
        />
      </button>

      <AnimatePresence>
        {open && (
          <motion.div
            ref={popRef}
            role="listbox"
            id={listboxId}
            aria-activedescendant={activeOpt ? `opt-${String(activeOpt.value)}` : undefined}
            initial={{ opacity: 0, y: 6, scale: 0.98 }}
            animate={{ opacity: 1, y: 0, scale: 1 }}
            exit={{ opacity: 0, y: 6, scale: 0.98 }}
            transition={{ type: "spring", stiffness: 380, damping: 26 }}
            className="bg-surface absolute z-50 mt-2 w-full overflow-hidden rounded-md border shadow-xl"
            style={{ borderColor: "var(--border)" }}
          >
            {searchable && (
              <div className="border-b p-2" style={{ borderColor: "var(--border)" }}>
                <input
                  ref={searchInputRef}
                  type="text"
                  className="input w-full rounded-lg px-3 py-2 text-sm outline-none focus-visible:ring-2"
                  placeholder={searchPlaceholder}
                  value={searchTerm}
                  onChange={(e) => onSearchChange?.(e.target.value)}
                  onKeyDown={(e) => {
                    if (e.key === "ArrowDown") {
                      e.preventDefault();
                      setActiveIdx(options.length ? 0 : -1);
                    }
                  }}
                />
              </div>
            )}

            <ul ref={listRef} className="max-h-56 overflow-auto py-1">
              {options.map((opt, i) => {
                const isSelected = opt.value === value;
                const active = i === activeIdx;
                return (
                  <li
                    id={`opt-${String(opt.value)}`}
                    key={opt.value}
                    role="option"
                    aria-selected={isSelected}
                    onMouseEnter={() => setActiveIdx(i)}
                    onPointerDown={(e) => {
                      e.preventDefault();
                      e.stopPropagation();
                      selectOption(opt);
                    }}
                    className={`flex cursor-pointer items-center gap-2 px-3 py-2 text-sm select-none ${
                      active ? "bg-background/60" : ""
                    }`}
                  >
                    <span
                      className={`h-1.5 w-1.5 rounded-full ${
                        isSelected ? "bg-foreground/70" : "bg-transparent"
                      }`}
                    />
                    <span className={`truncate ${isSelected ? "font-medium" : ""}`}>
                      {opt.label}
                    </span>
                  </li>
                );
              })}

              {isLoading && (
                <li className="text-foreground/60 flex items-center gap-2 px-3 py-2 text-sm">
                  <span className="border-foreground/40 h-4 w-4 animate-spin rounded-full border-2 border-t-transparent" />
                  Memuat…
                </li>
              )}

              {!isLoading && options.length === 0 && (
                <li className="text-foreground/60 px-3 py-2 text-sm">{noOptionsText}</li>
              )}
            </ul>
          </motion.div>
        )}
      </AnimatePresence>
    </div>
  );
}
