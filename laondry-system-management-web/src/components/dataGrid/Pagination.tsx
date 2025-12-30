"use client";

import * as React from "react";
import { AnimatePresence, motion } from "framer-motion";
import Button from "@/components/button/Button";
import { useOnClickOutside } from "./utils";
import { Props } from "./types";

function useDropdownPlacement(open: boolean, anchorRef: React.RefObject<HTMLElement | null>, menuSize = { w: 160, h: 180 }) {
  const [placement, setPlacement] = React.useState<"bottom" | "top">("bottom");

  React.useLayoutEffect(() => {
    if (!open || !anchorRef.current) return;
    const rect = anchorRef.current.getBoundingClientRect();
    const margin = 10;
    const spaceBelow = window.innerHeight - rect.bottom;
    const needTop = spaceBelow < menuSize.h + margin;
    setPlacement(needTop ? "top" : "bottom");
  }, [open, anchorRef, menuSize.h, menuSize.w]);

  React.useEffect(() => {
    if (!open) return;
    const onResize = () => {
      if (!anchorRef.current) return;
      const rect = anchorRef.current.getBoundingClientRect();
      const margin = 10;
      const spaceBelow = window.innerHeight - rect.bottom;
      setPlacement(spaceBelow < (menuSize.h + margin) ? "top" : "bottom");
    };
    window.addEventListener("resize", onResize);
    window.addEventListener("scroll", onResize, true);
    return () => {
      window.removeEventListener("resize", onResize);
      window.removeEventListener("scroll", onResize, true);
    };
  }, [open, anchorRef, menuSize.h, menuSize.w]);

  return placement;
}

/** Custom select per-page (tanpa <select> native) */
function PerPageSelect({
  value,
  options = [10, 20, 30, 50],
  onChange,
}: {
  value: number;
  options?: number[];
  onChange: (v: number) => void;
}) {
  const [open, setOpen] = React.useState(false);
  const anchorRef = React.useRef<HTMLDivElement | null>(null);
  const menuRef = React.useRef<HTMLDivElement | null>(null);

  useOnClickOutside(menuRef, () => setOpen(false));

  React.useEffect(() => {
    const onKey = (e: KeyboardEvent) => { if (e.key === "Escape") setOpen(false); };
    window.addEventListener("keydown", onKey);
    return () => window.removeEventListener("keydown", onKey);
  }, []);

  const placement = useDropdownPlacement(open, anchorRef, { w: 160, h: options.length * 36 + 12 });

  return (
    <div className="relative inline-flex" ref={anchorRef}>
      <Button
        variant="outline"
        tone="primary"
        size="sm"
        aria-haspopup="listbox"
        aria-expanded={open}
        aria-label="Items per halaman"
        onClick={() => setOpen((s) => !s)}
        rightIcon={
          <motion.span
            initial={false}
            animate={{ rotate: open ? 180 : 0 }}
            transition={{ duration: 0.18 }}
            className="inline-block"
          >
            ▾
          </motion.span>
        }
      >
        {value}/hal
      </Button>

      <AnimatePresence>
        {open && (
          <motion.div
            ref={menuRef}
            role="listbox"
            aria-label="Pilih items per halaman"
            initial={{ opacity: 0, y: placement === "bottom" ? -4 : 4, scale: 0.995 }}
            animate={{ opacity: 1, y: placement === "bottom" ? 6 : -6, scale: 1 }}
            exit={{ opacity: 0, y: placement === "bottom" ? -4 : 4, scale: 0.995 }}
            transition={{ duration: 0.14, ease: "easeOut" }}
            className={[
              "absolute z-20 min-w-[140px] overflow-hidden rounded-xl border bg-[var(--surface)] shadow-xl",
              placement === "bottom" ? "top-full mt-1.5 right-0" : "bottom-full mb-1.5 right-0",
              "border-[var(--border)]",
            ].join(" ")}
            style={{ transformOrigin: placement === "bottom" ? "top right" : "bottom right" }}
          >
            {options.map((opt) => {
              const active = opt === value;
              return (
                <button
                  key={opt}
                  role="option"
                  aria-selected={active}
                  className={[
                    "flex w-full items-center justify-between px-3 py-2 text-sm",
                    "hover:bg-[color-mix(in oklab,var(--color-foreground) 6%,transparent)]",
                    active ? "font-medium text-[var(--foreground)]" : "text-[var(--muted-foreground)]",
                  ].join(" ")}
                  onClick={() => {
                    onChange(opt);
                    setOpen(false);
                  }}
                >
                  <span>{opt}/hal</span>
                  {active ? <span>✓</span> : null}
                </button>
              );
            })}
          </motion.div>
        )}
      </AnimatePresence>
    </div>
  );
}

/** Pagination utama */
export default function Pagination({
  page = 1,
  perPage = 10,
  total = 0,
  onPageChange,
  onPerPageChange,
  perPageOptions = [10, 20, 30, 50],
}: Props) {
  const totalPages = Math.max(1, Math.ceil(total / Math.max(1, perPage)));
  const canPrev = page > 1;
  const canNext = page < totalPages;

  const goFirst = React.useCallback(() => onPageChange(1), [onPageChange]);
  const goPrev = React.useCallback(() => onPageChange(Math.max(1, page - 1)), [onPageChange, page]);
  const goNext = React.useCallback(
    () => onPageChange(Math.min(totalPages, page + 1)),
    [onPageChange, page, totalPages]
  );
  const goLast = React.useCallback(() => onPageChange(totalPages), [onPageChange, totalPages]);

  return (
    <div className="flex flex-wrap items-center justify-between gap-3">
      {/* Info (subtle fade) */}
      <motion.div
        key={`${page}-${totalPages}-${total}`}
        initial={{ opacity: 0 }}
        animate={{ opacity: 1 }}
        transition={{ duration: 0.12 }}
        className="text-sm text-[var(--muted-foreground)]"
        aria-live="polite"
        aria-atomic="true"
      >
        Halaman {page} dari {totalPages} • Total {total}
      </motion.div>

      {/* Controls */}
      <div className="flex items-center gap-2">
        <PerPageSelect value={perPage} options={perPageOptions} onChange={(n) => onPerPageChange(n)} />

        <div className="flex items-center gap-1">
          <motion.div whileTap={{ scale: 0.98 }}>
            <Button size="sm" variant="soft" tone="primary" onClick={goFirst} disabled={!canPrev} aria-label="Ke halaman pertama">
              «
            </Button>
          </motion.div>
          <motion.div whileTap={{ scale: 0.98 }}>
            <Button size="sm" variant="soft" tone="primary" onClick={goPrev} disabled={!canPrev} aria-label="Sebelumnya">
              ‹
            </Button>
          </motion.div>

          {/* Page bubble (very subtle crossfade) */}
          <div className="border-border mx-1 inline-flex h-8 min-w-10 items-center justify-center rounded-full border px-2 text-sm">
            <AnimatePresence mode="wait">
              <motion.span
                key={page}
                initial={{ opacity: 0 }}
                animate={{ opacity: 1 }}
                exit={{ opacity: 0 }}
                transition={{ duration: 0.12 }}
                className="tabular-nums"
              >
                {page}
              </motion.span>
            </AnimatePresence>
          </div>

          <motion.div whileTap={{ scale: 0.98 }}>
            <Button size="sm" variant="soft" tone="primary" onClick={goNext} disabled={!canNext} aria-label="Berikutnya">
              ›
            </Button>
          </motion.div>
          <motion.div whileTap={{ scale: 0.98 }}>
            <Button size="sm" variant="soft" tone="primary" onClick={goLast} disabled={!canNext} aria-label="Ke halaman terakhir">
              »
            </Button>
          </motion.div>
        </div>
      </div>
    </div>
  );
}
