"use client";

import { useRef } from "react";
import { Control, Controller, FieldValues } from "react-hook-form";
import { FaCircleExclamation } from "react-icons/fa6";

import { useFormTheme } from "../../theme/formTheme";
import { formatDecimal, normalizeDecimal } from "../numbering";
import { DecimalField } from "../types";

type Props<T extends FieldValues> = {
  control: Control<T>;
  field: DecimalField<T>;
};

export default function DecimalFieldComp<T extends FieldValues>({ control, field }: Props<T>) {
  const theme = useFormTheme();

  const dec = field.decimalSeparator ?? ",";
  const thou = field.thousandSeparator ?? ".";
  const precision = field.precision ?? 2;
  const allowNegative = field.allowNegative ?? false;

  const id = String(field.name);
  const helpId = `${id}__help`;
  const errId = `${id}__error`;
  const inputRef = useRef<HTMLInputElement | null>(null);

  const sanitizeDraft = (raw: string) => {
    let s = raw ?? "";

    if (thou) s = s.replace(new RegExp(`\\${thou}`, "g"), "");
    s = s.replace(/\s+/g, "");

    const allowed = `[0-9\\${dec}-]`;
    s = s.replace(new RegExp(`[^${allowed}]`, "g"), "");

    if (allowNegative) {
      const neg = s.startsWith("-") ? "-" : "";
      s = neg + s.replace(/-/g, "");
    } else {
      s = s.replace(/-/g, "");
    }

    const firstIdx = s.indexOf(dec);
    if (firstIdx !== -1) {
      const head = s.slice(0, firstIdx + 1);
      const tail = s.slice(firstIdx + 1).replace(new RegExp(`\\${dec}`, "g"), "");
      s = head + tail;

      if (precision >= 0) {
        const frac = s.slice(firstIdx + 1);
        if (frac.length > precision) s = head + frac.slice(0, precision);
      }
    }

    return s;
  };

  return (
    <div className="flex flex-col gap-1.5">
      {field.label && (
        <label htmlFor={id} className={theme.label}>
          {field.label}
        </label>
      )}

      <Controller
        control={control}
        name={field.name as any}
        render={({ field: rhf, fieldState }) => {
          const invalid = !!fieldState.error;

          const surf = invalid ? theme.inputSurf.invalid : theme.inputSurf.normal;
          const padding =
            theme.inputPadding?.({
              leftIcon: !!field.iconLeft,
              rightIcon: true, // sediakan ruang untuk error/iconRight
            }) ?? `${field.iconLeft ? "pl-10" : "pl-3"} pr-10`;
          const cls = `${theme.inputBase} ${surf} ${padding} h-10`;

          const display =
            typeof rhf.value === "number"
              ? formatDecimal(rhf.value, precision, dec, thou)
              : (rhf.value ?? "");

          return (
            <>
              <div className="relative">
                {field.iconLeft && (
                  <span className="pointer-events-none absolute top-1/2 left-3 -translate-y-1/2 text-slate-400 dark:text-slate-500">
                    {field.iconLeft}
                  </span>
                )}

                <input
                  ref={inputRef}
                  id={id}
                  className={cls}
                  type="text"
                  inputMode="decimal"
                  autoComplete="off"
                  placeholder={field.placeholder}
                  disabled={field.disabled}
                  value={display}
                  onChange={(e) => {
                    const sanitized = sanitizeDraft(e.target.value);

                    const norm = normalizeDecimal(sanitized, dec, thou);
                    if (norm === "" || norm === "-" || norm === "." || norm === dec) {
                      rhf.onChange(undefined);
                    } else {
                      const asNum = Number(norm);
                      rhf.onChange(Number.isNaN(asNum) ? undefined : asNum);
                    }

                    if (inputRef.current) {
                      const el = inputRef.current;
                      const sel = el.selectionStart ?? sanitized.length;
                      el.value = sanitized;
                      const pos = Math.min(sanitized.length, sel);
                      requestAnimationFrame(() => el.setSelectionRange(pos, pos));
                    }
                  }}
                  onBlur={() => {
                    rhf.onBlur();
                    if (typeof rhf.value === "number") {
                      const rounded = Number(rhf.value.toFixed(precision));
                      rhf.onChange(rounded);
                    }
                  }}
                  aria-invalid={invalid}
                  aria-describedby={invalid ? errId : field.helperText ? helpId : undefined}
                />

                {invalid ? (
                  <FaCircleExclamation
                    className="pointer-events-none absolute top-1/2 right-3 h-5 w-5 -translate-y-1/2 text-rose-500"
                    aria-hidden
                  />
                ) : (
                  field.iconRight && (
                    <span className="pointer-events-none absolute top-1/2 right-3 -translate-y-1/2 text-slate-400 dark:text-slate-500">
                      {field.iconRight}
                    </span>
                  )
                )}
              </div>

              {field.helperText && !invalid && (
                <small id={helpId} className={theme.helper}>
                  {field.helperText}
                </small>
              )}
              {invalid && (
                <small id={errId} className={theme.error}>
                  {fieldState.error!.message}
                </small>
              )}
            </>
          );
        }}
      />
    </div>
  );
}
