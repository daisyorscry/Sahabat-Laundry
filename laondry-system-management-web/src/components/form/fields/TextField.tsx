"use client";

import React from "react";
import { Control, Controller, FieldValues } from "react-hook-form";
import { FaCircleExclamation, FaEnvelope, FaRegKeyboard } from "react-icons/fa6";

import { useFormTheme } from "../../theme/formTheme";
import { TextField } from "../types";

type Props<T extends FieldValues> = {
  control: Control<T>;
  field: TextField<T> & {
    leftIcon?: React.ReactNode;
    rightIcon?: React.ReactNode;
  };
};

export default function TextFieldComp<T extends FieldValues>({ control, field }: Props<T>) {
  const theme = useFormTheme();
  const isTextarea = field.type === "textarea";
  const nameStr = String(field.name);
  const helpId = `${nameStr}__help`;
  const errId = `${nameStr}__error`;

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

          if (isTextarea) {
            const padding =
              theme.inputPadding?.({ leftIcon: !!field.leftIcon, rightIcon: !!field.rightIcon }) ??
              "px-3";
            const cls = `${theme.inputBase} ${surf} ${padding} py-2 min-h-[92px]`;

            return (
              <>
                <textarea
                  id={nameStr}
                  className={cls}
                  placeholder={field.placeholder}
                  rows={field.rows ?? 3}
                  disabled={field.disabled}
                  value={rhf.value ?? ""}
                  onChange={(e) => rhf.onChange(e.target.value)}
                  onBlur={rhf.onBlur}
                  aria-invalid={invalid}
                  aria-describedby={invalid ? errId : field.helperText ? helpId : undefined}
                />
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
          }

          // input text/email
          const padding =
            theme.inputPadding?.({
              leftIcon: !!field.leftIcon,
              rightIcon: true, // reserve untuk error/success
            }) ?? "px-3 pr-10";
          const cls = `${theme.inputBase} ${surf} ${padding} h-10`;
          const inputType: "text" | "email" = field.type === "email" ? "email" : "text";
          const IconDefault = field.type === "email" ? FaEnvelope : FaRegKeyboard;

          return (
            <>
              <div className="relative">
                {/* left icon */}
                {field.leftIcon && (
                  <span className="absolute top-1/2 left-3 h-4 w-4 -translate-y-1/2 text-slate-500 dark:text-slate-400">
                    {field.leftIcon}
                  </span>
                )}

                <input
                  id={nameStr}
                  className={cls}
                  type={inputType}
                  placeholder={field.placeholder}
                  autoComplete={field.autoComplete}
                  maxLength={field.maxLength}
                  disabled={field.disabled}
                  value={rhf.value ?? ""}
                  onChange={(e) => rhf.onChange(e.target.value)}
                  onBlur={rhf.onBlur}
                  aria-invalid={invalid}
                  aria-describedby={invalid ? errId : field.helperText ? helpId : undefined}
                  style={field.leftIcon ? { paddingLeft: "2.25rem" } : {}}
                />

                {invalid ? (
                  <FaCircleExclamation
                    className="pointer-events-none absolute top-1/2 right-3 h-5 w-5 -translate-y-1/2 text-rose-500"
                    aria-hidden
                  />
                ) : field.rightIcon === null ? null : field.rightIcon ? (
                  <span className="pointer-events-none absolute top-1/2 right-3 -translate-y-1/2">
                    {field.rightIcon}
                  </span>
                ) : (
                  <IconDefault
                    className="pointer-events-none absolute top-1/2 right-3 h-4 w-4 -translate-y-1/2 text-slate-500 dark:text-slate-400"
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
