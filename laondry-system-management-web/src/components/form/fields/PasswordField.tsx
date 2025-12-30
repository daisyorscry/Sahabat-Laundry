"use client";

import { useState } from "react";
import { Control, Controller, FieldValues } from "react-hook-form";
import { FaEye, FaEyeSlash } from "react-icons/fa6";

import { useFormTheme } from "../../theme/formTheme";
import { PasswordField } from "../types";

type Props<T extends FieldValues> = {
  control: Control<T>;
  field: PasswordField<T>;
};

export default function PasswordFieldComp<T extends FieldValues>({ control, field }: Props<T>) {
  const theme = useFormTheme();
  const [visible, setVisible] = useState(false);

  const nameStr = String(field.name);
  const helpId = `${nameStr}__help`;
  const errId = `${nameStr}__error`;

  const autoComplete = field.autoComplete ?? "new-password";
  const disabled = !!field.disabled;

  return (
    <div className="flex flex-col gap-1.5">
      {field.label && (
        <label htmlFor={nameStr} className={theme.label}>
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
            <div className="relative">
              <div className="relative">
                <input
                  id={nameStr}
                  className={cls}
                  type={visible ? "text" : "password"}
                  placeholder={field.placeholder}
                  autoComplete={autoComplete}
                  maxLength={field.maxLength}
                  disabled={disabled}
                  value={rhf.value ?? ""}
                  onChange={(e) => rhf.onChange(e.target.value)}
                  onBlur={rhf.onBlur}
                  aria-invalid={invalid}
                  aria-describedby={invalid ? errId : field.helperText ? helpId : undefined}
                />

                <button
                  type="button"
                  onMouseDown={(e) => e.preventDefault()} // jaga fokus tetap di input
                  onClick={(e) => {
                    e.preventDefault();
                    setVisible((v) => !v);
                  }}
                  aria-label={visible ? "Sembunyikan password" : "Tampilkan password"}
                  aria-pressed={visible}
                  className="absolute top-1/2 right-3 -translate-y-1/2 text-slate-500 hover:text-slate-700 dark:text-slate-400 dark:hover:text-slate-200"
                  tabIndex={0}
                >
                  {visible ? (
                    <FaEyeSlash className="h-5 w-5" aria-hidden />
                  ) : (
                    <FaEye className="h-5 w-5" aria-hidden />
                  )}
                </button>
              </div>

              {field.helperText && !invalid && (
                <small id={helpId} className={theme.helper + " mt-1 block"}>
                  {field.helperText}
                </small>
              )}
              {invalid && (
                <small id={errId} className={theme.error + " mt-1 block"}>
                  {fieldState.error!.message}
                </small>
              )}
            </div>
          );
        }}
      />
    </div>
  );
}
