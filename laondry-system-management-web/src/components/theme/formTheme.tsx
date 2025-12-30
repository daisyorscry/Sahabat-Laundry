"use client";

import React, { createContext, useContext } from "react";

import type { FormThemeSlots } from "../form/types";

/** Default theme pakai CSS variable tokens (bg-background, text-foreground, dst.) */
export const tailwindTheme: FormThemeSlots = {
  label: "text-[13px] font-medium text-foreground tracking-tight",

  // Base untuk semua input
  inputBase: [
    "w-full h-9 rounded-md px-3 text-sm",
    "border border-border",
    "bg-background text-foreground placeholder:text-foreground/60",
    "transition-colors",
    "outline-none focus:outline-none focus-visible:outline-none",
    "ring-[var(--border-primary)] focus:ring-2 focus-visible:ring-2",
    "ring-offset-background focus:ring-offset-0 focus-visible:ring-offset-0",
  ].join(" "),

  inputSurf: {
    normal: [
      "hover:bg-background/80",
      "ring-[var(--border-primary)] focus:ring-2 focus-visible:ring-2",
      "focus:ring-offset-0 focus-visible:ring-offset-0",
    ].join(" "),
    invalid: [
      "border-[oklch(65%_0.25_25)]",
      "focus:border-[oklch(65%_0.25_25)]",
      "ring-[oklch(85%_0.15_25)]/60 focus:ring-2 focus:ring-offset-0",
    ].join(" "),
  },

  inputPadding: ({ leftIcon, rightIcon }) =>
    `${leftIcon ? "pl-10" : "pl-3"} ${rightIcon ? "pr-10" : "pr-3"}`,

  helper: "text-[12px] text-foreground/60",
  error: "text-[12px] font-medium text-[oklch(65%_0.25_25)]",

  chip: {
    base: [
      "group relative select-none cursor-pointer",
      "rounded-lg px-3 py-1.5 text-sm transition-colors",
      "border border-border bg-background text-foreground",
      "hover:bg-background/80",
    ].join(" "),
    checked: ["bg-primary/10 text-primary", "border border-border"].join(" "),
    unchecked: "",
  },

  popover: "rounded-lg bg-card-primary border border-border shadow-sm",
};

const ThemeCtx = createContext<FormThemeSlots>(tailwindTheme);

function mergeTheme(base: FormThemeSlots, override?: Partial<FormThemeSlots>): FormThemeSlots {
  if (!override) return base;
  return {
    ...base,
    ...override,
    inputSurf: { ...base.inputSurf, ...(override.inputSurf ?? {}) },
    chip: { ...base.chip, ...(override.chip ?? {}) },
    inputPadding: override.inputPadding ?? base.inputPadding,
  };
}

export function FormThemeProvider({
  value,
  children,
}: {
  value?: Partial<FormThemeSlots>;
  children: React.ReactNode;
}) {
  const merged = mergeTheme(tailwindTheme, value);
  return <ThemeCtx.Provider value={merged}>{children}</ThemeCtx.Provider>;
}

export function useFormTheme() {
  return useContext(ThemeCtx);
}
