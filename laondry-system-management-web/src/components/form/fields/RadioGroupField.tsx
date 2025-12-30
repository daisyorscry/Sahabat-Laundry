"use client";

import { Control, Controller, FieldValues } from "react-hook-form";
import { FaCircleExclamation } from "react-icons/fa6";

import { useFormTheme } from "../../theme/formTheme";
import { RadioGroupField } from "../types";

type Props<T extends FieldValues> = {
  control: Control<T>;
  field: RadioGroupField<T> & {
    inline?: boolean;
    dense?: boolean;
    framed?: boolean;
  };
};

export default function RadioGroupFieldComp<T extends FieldValues>({ control, field }: Props<T>) {
  const theme = useFormTheme();

  const id = String(field.name);
  const helpId = `${id}__help`;
  const errId = `${id}__error`;
  const inline = field.inline ?? true;
  const dense = field.dense ?? true;
  const framed = field.framed ?? false;

  const chipsGap = dense ? "gap-1.5" : "gap-2";
  const chipPad = dense ? "px-3 py-1.5" : "px-3 py-2";

  return (
    <div className={dense ? "flex flex-col gap-1" : "flex flex-col gap-1.5"}>
      {field.label && (
        <div className={dense ? `${theme.label} mb-0.5` : theme.label}>{field.label}</div>
      )}

      <Controller
        control={control}
        name={field.name as any}
        render={({ field: rhf, fieldState }) => {
          const invalid = !!fieldState.error;
          const withFrame = invalid || framed;

          const wrapperCls = withFrame
            ? [
                theme.popover, // border border-border  + bg + shadow sesuai theme
                dense ? "p-1" : "px-2 py-2",
                // tambahkan ring saat invalid
                invalid ? "ring-2 ring-rose-200/60 dark:ring-rose-500/20" : "",
              ]
                .filter(Boolean)
                .join(" ")
            : "";

          return (
            <>
              <div
                className={wrapperCls}
                role="radiogroup"
                aria-invalid={invalid}
                aria-describedby={invalid ? errId : field.helperText ? helpId : undefined}
              >
                <div
                  className={inline ? `flex flex-wrap ${chipsGap}` : `flex flex-col ${chipsGap}`}
                >
                  {field.options.map((o) => {
                    const valStr = String(o.value);
                    const checked = String(rhf.value ?? "") === valStr;
                    const disabled = (o as any).disabled ?? field.disabled;

                    return (
                      <label
                        key={valStr}
                        className={[
                          theme.chip.base,
                          chipPad,
                          disabled ? "cursor-not-allowed opacity-60" : "cursor-pointer",
                          checked ? theme.chip.checked : theme.chip.unchecked,
                        ].join(" ")}
                      >
                        <input
                          type="radio"
                          name={id}
                          value={valStr}
                          checked={checked}
                          disabled={disabled}
                          onChange={() => rhf.onChange(o.value)}
                          onBlur={rhf.onBlur}
                          className="sr-only"
                        />
                        <span
                          aria-hidden
                          className={[
                            "mr-2 inline-block h-2.5 w-2.5 rounded-full align-middle",
                            checked ? "bg-sky-500" : "bg-slate-300 dark:bg-slate-600",
                          ].join(" ")}
                        />
                        <span className="align-middle">{o.label}</span>
                      </label>
                    );
                  })}
                </div>
              </div>

              {field.helperText && !invalid && (
                <small id={helpId} className={theme.helper}>
                  {field.helperText}
                </small>
              )}
              {invalid && (
                <div className="mt-0.5 flex items-center gap-1.5">
                  <FaCircleExclamation className="h-4 w-4 text-rose-500" aria-hidden />
                  <small id={errId} className={theme.error}>
                    {fieldState.error!.message}
                  </small>
                </div>
              )}
            </>
          );
        }}
      />
    </div>
  );
}
