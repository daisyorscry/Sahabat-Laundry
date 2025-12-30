"use client";

import { Control, Controller, FieldValues } from "react-hook-form";
import { FaExclamationCircle, FaPhone } from "react-icons/fa";

import { useFormTheme } from "../../theme/formTheme";
import { TelephoneField } from "../types";

type Props<T extends FieldValues> = {
  control: Control<T>;
  field: TelephoneField<T>;
};

function onlyDigits(s: string) {
  return (s || "").replace(/\D+/g, "");
}

function toE164(rawDigits: string, countryCode: string) {
  if (!rawDigits) return "";
  let d = rawDigits;
  if (d.startsWith("0")) d = d.replace(/^0+/, "");
  return `+${countryCode}${d}`;
}

export default function TelephoneFieldComp<T extends FieldValues>({ control, field }: Props<T>) {
  const theme = useFormTheme();

  const { countryCode = "62", output = "raw", allowPlus = true, maxDigits = 15 } = field;

  const id = String(field.name);
  const errId = `${id}__error`;

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
            theme.inputPadding?.({ leftIcon: false, rightIcon: true }) ?? "px-3 pr-10";
          const cls = `${theme.inputBase} ${surf} ${padding} h-10`;

          return (
            <>
              <div className="relative">
                <input
                  id={id}
                  className={cls}
                  type="tel"
                  inputMode="tel"
                  autoComplete="tel"
                  placeholder={field.placeholder ?? "08xxxxxxxxxx"}
                  disabled={field.disabled}
                  value={rhf.value ?? ""}
                  onChange={(e) => {
                    const v = e.target.value;

                    let cleaned = v;
                    if (allowPlus) {
                      const hasLeadingPlus = cleaned.startsWith("+");
                      cleaned = (hasLeadingPlus ? "+" : "") + onlyDigits(cleaned);
                    } else {
                      cleaned = onlyDigits(cleaned);
                    }

                    const digits = onlyDigits(cleaned);
                    if (maxDigits && digits.length > maxDigits) return;

                    if (output === "e164") {
                      if (cleaned.startsWith("+")) {
                        rhf.onChange("+" + cleaned.replace(/^\++/, ""));
                      } else {
                        rhf.onChange(toE164(digits, countryCode));
                      }
                    } else {
                      if (cleaned.startsWith("+")) {
                        const d = onlyDigits(cleaned);
                        if (d.startsWith(countryCode)) {
                          rhf.onChange("0" + d.slice(countryCode.length));
                        } else {
                          rhf.onChange(d);
                        }
                      } else {
                        rhf.onChange(digits);
                      }
                    }
                  }}
                  onBlur={rhf.onBlur}
                  aria-invalid={invalid}
                  aria-describedby={invalid ? errId : undefined}
                />

                {invalid ? (
                  <FaExclamationCircle
                    className="pointer-events-none absolute top-1/2 right-3 h-5 w-5 -translate-y-1/2 text-rose-500"
                    aria-hidden
                  />
                ) : (
                  <FaPhone
                    className="pointer-events-none absolute top-1/2 right-3 h-4 w-4 -translate-y-1/2 text-slate-500 dark:text-slate-400"
                    aria-hidden
                  />
                )}
              </div>

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
