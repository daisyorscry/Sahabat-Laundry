"use client";

import React from "react";
import type { GridCols } from "./types";

export function clsx(...xs: Array<string | false | null | undefined>) {
  return xs.filter(Boolean).join(" ");
}

export function gridClass(cols?: GridCols) {
  const c = { base: 1, sm: 2, md: 3, lg: 4, xl: 4, ...(cols ?? {}) };
  return clsx(
    "grid gap-4",
    `grid-cols-${c.base}`,
    c.sm ? `sm:grid-cols-${c.sm}` : null,
    c.md ? `md:grid-cols-${c.md}` : null,
    c.lg ? `lg:grid-cols-${c.lg}` : null,
    c.xl ? `xl:grid-cols-${c.xl}` : null,
  );
}

export function useOnClickOutside<T extends HTMLElement>(
  ref: React.RefObject<T | null>,
  cb: () => void
) {
  React.useEffect(() => {
    function handler(e: MouseEvent) {
      if (!ref.current) return;
      if (!ref.current.contains(e.target as Node)) cb();
    }
    document.addEventListener("mousedown", handler);
    return () => document.removeEventListener("mousedown", handler);
  }, [cb, ref]);
}
