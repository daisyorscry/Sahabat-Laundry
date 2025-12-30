"use client";

import { Control, Controller, FieldValues } from "react-hook-form";

import { useFormTheme } from "../../theme/formTheme";
import { SwitchField } from "../types";

type Props<T extends FieldValues> = {
  control: Control<T>;
  field: SwitchField<T> & {
    size?: "sm" | "md";
    labelPosition?: "right" | "left";
  };
};

export default function SwitchFieldComp<T extends FieldValues>({ control, field }: Props<T>) {
  const theme = useFormTheme();

  const id = String(field.name);
  const helpId = `${id}__help`;
  const errId = `${id}__error`;
  const size = field.size ?? "md";
  const labelPos = field.labelPosition ?? "right";

  const dims =
    size === "sm"
      ? {
          track: "w-11 h-6 p-0.5",
          knob: "h-5 w-5",
          on: "translate-x-5",
          off: "translate-x-0",
        }
      : {
          track: "w-14 h-8 p-1",
          knob: "h-6 w-6",
          on: "translate-x-6",
          off: "translate-x-0",
        };

  return (
    <div className="flex flex-col gap-1">
      <Controller
        control={control}
        // eslint-disable-next-line @typescript-eslint/no-explicit-any
        name={field.name as any}
        render={({ field: rhf, fieldState }) => {
          const checked = !!rhf.value;
          const invalid = !!fieldState.error;
          const disabled = !!field.disabled;

          // Fokus ring tetap lokal (tidak ambil dari theme agar switch stabil)
          const ring = invalid
            ? "focus-visible:ring-2 focus-visible:ring-rose-200/60 dark:focus-visible:ring-rose-500/20"
            : "focus-visible:ring-2 focus-visible:ring-sky-200/60 dark:focus-visible:ring-sky-500/20";

          return (
            <>
              <label
                htmlFor={id}
                className={[
                  "inline-flex items-center",
                  labelPos === "left" ? "flex-row-reverse" : "flex-row",
                  "gap-3 select-none",
                  disabled ? "cursor-not-allowed opacity-60" : "cursor-pointer",
                ].join(" ")}
              >
                {field.label && <span className={theme.label}>{field.label}</span>}

                <button
                  id={id}
                  type="button"
                  role="switch"
                  aria-checked={checked}
                  aria-invalid={invalid}
                  aria-describedby={invalid ? errId : field.helperText ? helpId : undefined}
                  disabled={disabled}
                  onClick={(e) => {
                    e.preventDefault();
                    if (!disabled) rhf.onChange(!checked);
                  }}
                  onKeyDown={(e) => {
                    if (disabled) return;
                    if (e.key === "Enter" || e.key === " ") {
                      e.preventDefault();
                      rhf.onChange(!checked);
                    }
                  }}
                  className={[
                    "relative inline-flex shrink-0 items-center rounded-full outline-none",
                    dims.track,
                    checked
                      ? "bg-sky-500/90 hover:bg-sky-500 dark:bg-sky-500/80"
                      : "bg-slate-300 hover:bg-slate-400 dark:bg-slate-700",
                    "transition-colors",
                    ring,
                    "focus-visible:ring-offset-2 focus-visible:ring-offset-transparent",
                  ].join(" ")}
                >
                  <span
                    aria-hidden
                    className={[
                      "pointer-events-none inline-block rounded-full bg-white shadow",
                      "transition-transform",
                      dims.knob,
                      checked ? dims.on : dims.off,
                    ].join(" ")}
                  />
                </button>
              </label>

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
