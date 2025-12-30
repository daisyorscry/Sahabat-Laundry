"use client";

import { useFormTheme } from "../theme/formTheme";
import { FormThemeSlots } from "./types";

export function useFieldTheme(override?: Partial<FormThemeSlots>) {
  const base = useFormTheme();
  if (!override) return base;

  return {
    ...base,
    ...override,
    inputSurf: { ...base.inputSurf, ...(override.inputSurf ?? {}) },
    chip: { ...base.chip, ...(override.chip ?? {}) },
    inputPadding: override.inputPadding ?? base.inputPadding,
  } as FormThemeSlots;
}
