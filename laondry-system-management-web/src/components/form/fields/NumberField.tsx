"use client";

import { Control, Controller, FieldValues } from "react-hook-form";
import { FaCircleExclamation } from "react-icons/fa6";

import { useFormTheme } from "../../theme/formTheme";
import { NumberField } from "../types";

type Props<T extends FieldValues> = {
  control: Control<T>;
  field: NumberField<T>;
};

export default function NumberFieldComp<T extends FieldValues>({ control, field }: Props<T>) {
  const theme = useFormTheme();

  const id = String(field.name);
  const helpId = `${id}__help`;
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
            theme.inputPadding?.({
              leftIcon: !!field.iconLeft,
              rightIcon: true,
            }) ?? "pl-3 pr-10";
          const cls = `${theme.inputBase} ${surf} ${padding} h-10`;

          return (
            <>
              <div className="relative">
                {field.iconLeft && (
                  <span className="pointer-events-none absolute top-1/2 left-3 -translate-y-1/2 text-slate-400 dark:text-slate-500">
                    {field.iconLeft}
                  </span>
                )}

                <input
                  id={id}
                  className={cls}
                  type="number"
                  step={field.step as any}
                  min={field.min}
                  max={field.max}
                  placeholder={field.placeholder}
                  disabled={field.disabled}
                  value={rhf.value ?? ""}
                  onChange={(e) => {
                    const v = e.target.value;
                    rhf.onChange(v === "" ? "" : Number(v));
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
