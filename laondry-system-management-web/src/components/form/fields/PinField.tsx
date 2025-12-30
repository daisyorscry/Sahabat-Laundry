"use client";

import { Control, Controller, FieldValues } from "react-hook-form";
import { FaCircleExclamation, FaKey } from "react-icons/fa6";

import { useFormTheme } from "../../theme/formTheme";
import { PinField } from "../types";

type Props<T extends FieldValues> = {
  control: Control<T>;
  field: PinField<T>;
};

export default function PinFieldComp<T extends FieldValues>({ control, field }: Props<T>) {
  const theme = useFormTheme();

  const id = String(field.name);
  const helpId = `${id}__help`;
  const errId = `${id}__error`;
  const maxLen = field.length ?? 6;

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
            theme.inputPadding?.({ leftIcon: false, rightIcon: true }) ?? "pl-3 pr-10";
          const cls = `${theme.inputBase} ${surf} ${padding} h-10`;

          return (
            <>
              <div className="relative">
                <input
                  id={id}
                  className={`${cls} font-mono tracking-[0.3em]`}
                  type="text"
                  inputMode="numeric"
                  pattern="\d*"
                  autoComplete="one-time-code"
                  maxLength={maxLen}
                  placeholder={field.placeholder ?? "•".repeat(Math.min(6, maxLen))}
                  disabled={field.disabled}
                  value={rhf.value ?? ""}
                  onChange={(e) => {
                    const s = e.target.value.replace(/[^\d]/g, "").slice(0, maxLen);
                    rhf.onChange(s);
                  }}
                  onPaste={(e) => {
                    const text = (e.clipboardData.getData("text") || "").replace(/[^\d]/g, "");
                    if (text) {
                      e.preventDefault();
                      rhf.onChange(text.slice(0, maxLen));
                    }
                  }}
                  onBlur={rhf.onBlur}
                  aria-invalid={invalid}
                  aria-describedby={invalid ? errId : field.helperText ? helpId : undefined}
                />

                {invalid ? (
                  <FaCircleExclamation
                    className="pointer-events-none absolute top-1/2 right-3 h-5 w-5 -translate-y-1/2 text-rose-500"
                    aria-hidden
                  />
                ) : (
                  <FaKey
                    className="pointer-events-none absolute top-1/2 right-3 h-4 w-4 -translate-y-1/2 text-slate-400 dark:text-slate-500"
                    aria-hidden
                  />
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
