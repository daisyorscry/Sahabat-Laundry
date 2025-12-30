"use client";

import { useRef, useState } from "react";
import { Control, Controller, FieldValues } from "react-hook-form";
import { FaCircleExclamation } from "react-icons/fa6";

import { formatDecimal, normalizeDecimal } from "../numbering";
import { CurrencyField } from "../types";

type Props<T extends FieldValues> = {
  control: Control<T>;
  field: CurrencyField<T>;
};

export default function CurrencyFieldComp<T extends FieldValues>({ control, field }: Props<T>) {
  const dec = field.decimalSeparator ?? ",";
  const thou = field.thousandSeparator ?? ".";
  const precision = field.precision ?? 0;
  const allowNegative = field.allowNegative ?? false;
  const prefix = field.prefix ?? "";
  const suffix = field.suffix ?? "";

  const id = String(field.name);
  const helpId = `${id}__help`;
  const errId = `${id}__error`;

  const inputRef = useRef<HTMLInputElement | null>(null);
  const [focused, setFocused] = useState(false);

  const sanitize = (raw: string) => {
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

    const idx = s.indexOf(dec);
    if (idx !== -1) {
      const head = s.slice(0, idx + 1);
      const tail = s.slice(idx + 1).replace(new RegExp(`\\${dec}`, "g"), "");
      s = head + tail;

      if (precision >= 0) {
        const frac = s.slice(idx + 1);
        if (frac.length > precision) s = head + frac.slice(0, precision);
      }
    }

    return s;
  };

  const leftPad = field.iconLeft || prefix ? "pl-8" : "pl-3";
  const rightPad = field.iconRight || suffix ? "pr-12" : "pr-10";

  return (
    <div className="flex flex-col gap-1.5">
      {field.label && (
        <label
          htmlFor={id}
          className="text-[13px] font-medium tracking-tight text-slate-800 dark:text-slate-200"
        >
          {field.label}
        </label>
      )}

      <Controller
        control={control}
        // eslint-disable-next-line @typescript-eslint/no-explicit-any
        name={field.name as any}
        render={({ field: rhf, fieldState }) => {
          const invalid = !!fieldState.error;

          const base =
            "w-full h-10 rounded-xl border border-border  bg-white/90 text-sm text-slate-900 " +
            "placeholder:text-slate-400 transition focus:outline-none " +
            "dark:bg-slate-900/70 dark:text-slate-100 dark:placeholder:text-slate-500";
          const surf =
            (invalid
              ? "border border-border -rose-500/70 focus:border border-border -rose-500 focus:ring-2 focus:ring-rose-200/60 dark:focus:ring-rose-500/20"
              : "border border-border -slate-300 hover:border border-border -slate-400 focus:border border-border -sky-500 focus:ring-2 focus:ring-sky-200/60 " +
                "dark:border border-border -slate-700 dark:hover:border border-border -slate-600 dark:focus:border border-border -sky-400 dark:focus:ring-sky-500/20") +
            " focus:ring-offset-0";
          const cls = `${base} ${surf} ${leftPad} ${rightPad}`;

          let display = "";
          if (focused) {
            if (typeof rhf.value === "number") {
              const s = rhf.value.toFixed(Math.max(precision, 0));
              display = s.replace(".", dec);
              if (precision > 0) {
                display = display.replace(new RegExp(`${dec}0+$`), "");
                display = display.replace(new RegExp(`\\${dec}$`), "");
              }
            } else {
              display = "";
            }
          } else {
            if (typeof rhf.value === "number") {
              display = formatDecimal(rhf.value, precision, dec, thou);
            } else {
              display = "";
            }
          }

          return (
            <>
              <div className="relative">
                {field.iconLeft && (
                  <span className="pointer-events-none absolute top-1/2 left-3 -translate-y-1/2 text-slate-400 dark:text-slate-500">
                    {field.iconLeft}
                  </span>
                )}
                {prefix && (
                  <span className="pointer-events-none absolute top-1/2 left-3 -translate-y-1/2 text-sm text-slate-500 dark:text-slate-400">
                    {prefix}
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
                  onFocus={() => setFocused(true)}
                  onChange={(e) => {
                    const sanitized = sanitize(e.target.value);

                    const norm = normalizeDecimal(sanitized, dec, "");
                    if (norm === "" || norm === "-" || norm === "." || norm === dec) {
                      rhf.onChange(undefined);
                    } else {
                      const n = Number(norm);
                      rhf.onChange(Number.isNaN(n) ? undefined : n);
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
                    setFocused(false);
                    rhf.onBlur();
                    if (typeof rhf.value === "number") {
                      const rounded = Number(rhf.value.toFixed(Math.max(precision, 0)));
                      rhf.onChange(rounded);
                    }
                  }}
                  aria-invalid={invalid}
                  aria-describedby={invalid ? errId : field.helperText ? helpId : undefined}
                />

                {invalid ? (
                  <span className="pointer-events-none absolute top-1/2 right-3 -translate-y-1/2">
                    <FaCircleExclamation className="h-5 w-5 text-rose-500" aria-hidden />
                  </span>
                ) : (
                  <>
                    {suffix && (
                      <span className="pointer-events-none absolute top-1/2 right-3 -translate-y-1/2 text-sm text-slate-500 dark:text-slate-400">
                        {suffix}
                      </span>
                    )}
                    {!suffix && field.iconRight && (
                      <span className="pointer-events-none absolute top-1/2 right-3 -translate-y-1/2 text-slate-400 dark:text-slate-500">
                        {field.iconRight}
                      </span>
                    )}
                  </>
                )}
              </div>

              {field.helperText && !invalid && (
                <small id={helpId} className="text-[12px] text-slate-500 dark:text-slate-400">
                  {field.helperText}
                </small>
              )}
              {invalid && (
                <small
                  id={errId}
                  className="text-[12px] font-medium text-rose-600 dark:text-rose-400"
                >
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
