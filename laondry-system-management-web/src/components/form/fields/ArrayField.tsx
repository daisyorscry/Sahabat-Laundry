/* eslint-disable @typescript-eslint/no-explicit-any */
// fields/ArrayField.tsx
"use client";

import React, { useMemo } from "react";
import { Control, FieldValues, useFieldArray, useFormState } from "react-hook-form";
import { FaPlus, FaTrash } from "react-icons/fa6";

import { ControlRegistry, controlRegistry } from "../registry";
import { ArrayField, FieldConfig } from "../types";

type Props<T extends FieldValues> = {
  control: Control<T>;
  field: ArrayField<T>;
};

function getByPath(obj: any, path: string): any {
  return path.split(".").reduce((acc, key) => {
    if (!acc) return undefined;
    const idx = Number(key);
    return Number.isInteger(idx) && key === String(idx) ? acc[idx] : acc[key];
  }, obj);
}

export default function ArrayFieldComp<T extends FieldValues>({ control, field }: Props<T>) {
  const name = field.name as any;
  const { errors, isSubmitting } = useFormState({ control, name });

  const { fields, append, remove } = useFieldArray<T>({ control, name });

  const ItemComp = (controlRegistry as unknown as ControlRegistry<T>)[field.of.type] as React.FC<{
    control: Control<T>;
    field: FieldConfig<T>;
  }>;

  const min = field.minItems ?? 0;
  const max = field.maxItems ?? Infinity;
  const canAdd = fields.length < max && !field.disabled;
  const canRemove = (idx: number) => fields.length > min && !field.disabled;

  const newItemValue = useMemo(() => {
    const t = (field.of as any)?.type as string;
    switch (t) {
      case "number":
      case "decimal":
      case "currency":
        return undefined;
      case "checkbox":
      case "switch":
        return false;
      case "date":
      case "pin":
      case "text":
      case "email":
      case "password":
      case "textarea":
      case "tel":
      case "select":
      case "radio":
      case "async-select":
        return "";
      case "date-range":
        return { start: "", end: "" };
      case "file":
        return (field.of as any)?.multiple ? [] : null;
      default:
        return "";
    }
  }, [field.of]);

  const arrayErrNode = getByPath(errors, String(field.name));
  const arrayInvalid = !!arrayErrNode;
  const arrayMessage: string | undefined = (arrayErrNode as any)?.message;

  const helpId = `${String(field.name)}__help`;
  const errId = `${String(field.name)}__error`;

  return (
    <div className="flex flex-col gap-1.5">
      {field.label && (
        <label className="text-[13px] font-medium tracking-tight text-slate-800 dark:text-slate-200">
          {field.label}
        </label>
      )}

      <div className="rounded-xl border border-slate-200 bg-white/60 p-3 ring-1 ring-slate-100/60 dark:border-slate-700 dark:bg-slate-900/50 dark:ring-0">
        <div className="flex flex-col gap-2">
          {fields.length === 0 && (
            <div className="rounded-md border border-dashed border-slate-300 bg-white/40 p-3 text-sm text-slate-500 dark:border-slate-700 dark:bg-slate-900/40 dark:text-slate-400">
              Belum ada data.
            </div>
          )}

          {fields.map((f, idx) => {
            const itemName = `${String(field.name)}.${idx}` as any;
            const itemField: FieldConfig<T> = {
              ...(field.of as any),
              name: itemName,
              disabled: field.disabled ?? (field.of as any)?.disabled,
            };

            const itemErrNode = getByPath(errors, `${String(field.name)}.${idx}`);
            const itemInvalid = !!itemErrNode;
            const itemMessage: string | undefined = (itemErrNode as any)?.message;

            const base =
              "group relative rounded-lg border bg-white/80 p-2 transition-shadow focus-within:ring-2 dark:bg-slate-900/60";
            const surf = itemInvalid
              ? "border-rose-400/70 focus-within:ring-rose-300/50 dark:focus-within:ring-rose-500/20"
              : "border-slate-200 hover:border-slate-300 focus-within:ring-sky-200/60 dark:border-slate-700 dark:hover:border-slate-600 dark:focus-within:ring-sky-500/20";

            return (
              <div key={f.id} className={`${base} ${surf}`}>
                <div className="flex items-start gap-2">
                  {/* badge index */}
                  <div className="pt-[6px]">
                    <span
                      className={[
                        "inline-flex h-5 min-w-5 items-center justify-center rounded-full px-1 text-[11px] font-medium",
                        itemInvalid
                          ? "bg-rose-100 text-rose-700 dark:bg-rose-900/30 dark:text-rose-300"
                          : "bg-slate-100 text-slate-600 dark:bg-slate-800 dark:text-slate-300",
                      ].join(" ")}
                    >
                      {idx + 1}
                    </span>
                  </div>

                  <div className="flex-1">
                    <ItemComp control={control} field={itemField} />
                    {itemInvalid && typeof itemMessage === "string" && (
                      <small className="mt-1 block text-[12px] font-medium text-rose-600 dark:text-rose-400">
                        {itemMessage}
                      </small>
                    )}
                  </div>

                  <button
                    type="button"
                    onClick={() => remove(idx)}
                    disabled={!canRemove(idx)}
                    title="Hapus"
                    className={[
                      "absolute top-2 right-2 inline-flex h-8 w-8 items-center justify-center rounded-md border text-sm opacity-0 transition-opacity",
                      "group-focus-within:opacity-100 group-hover:opacity-100",
                      canRemove(idx)
                        ? "border-slate-300 text-rose-600 hover:bg-rose-50 dark:border-slate-700 dark:hover:bg-rose-950/30"
                        : "cursor-not-allowed border-slate-200 text-slate-400 opacity-40 dark:border-slate-800 dark:text-slate-600",
                    ].join(" ")}
                    aria-label={`Hapus item ${idx + 1}`}
                  >
                    <FaTrash />
                  </button>
                </div>
              </div>
            );
          })}
        </div>

        <div className="mt-3">
          <button
            type="button"
            onClick={() => append(newItemValue as any)}
            disabled={!canAdd || isSubmitting}
            className={[
              "inline-flex items-center gap-2 rounded-lg border px-3 py-1.5 text-sm",
              canAdd
                ? "border-slate-300 bg-white/70 hover:bg-slate-50 dark:border-slate-700 dark:bg-slate-900/60 dark:hover:bg-slate-800"
                : "cursor-not-allowed border-slate-200 text-slate-400 dark:border-slate-800 dark:text-slate-600",
            ].join(" ")}
            aria-describedby={arrayInvalid ? errId : field.helperText ? helpId : undefined}
          >
            <FaPlus /> {field.addText ?? "Tambah Tag"}
          </button>
        </div>
      </div>

      {field.helperText && !arrayInvalid && (
        <small id={helpId} className="text-[12px] text-slate-500 dark:text-slate-400">
          {field.helperText}
        </small>
      )}
      {arrayInvalid && (
        <small id={errId} className="text-[12px] font-medium text-rose-600 dark:text-rose-400">
          {arrayMessage}
        </small>
      )}
    </div>
  );
}
