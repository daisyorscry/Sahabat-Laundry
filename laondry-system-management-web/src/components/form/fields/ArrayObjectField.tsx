// fields/ArrayObjectField.tsx
"use client";

import { Control, FieldValues, useFieldArray, useFormState, useWatch } from "react-hook-form";
import { FaArrowDown, FaArrowUp, FaGripVertical, FaPlus, FaTrash } from "react-icons/fa6";

import FormRenderer from "../FormRenderer";
import { ArrayObjectField, FieldConfig } from "../types";

// fields/ArrayObjectField.tsx

type Props<T extends FieldValues> = {
  control: Control<T>;
  field: ArrayObjectField<T>;
};

function getIn(obj: any, path: string): any {
  return path.split(".").reduce((o, k) => (o && o[k] != null ? o[k] : undefined), obj);
}

function firstErrorMessage(errNode: any): string | undefined {
  if (!errNode) return undefined;
  if (typeof errNode.message === "string" && errNode.message) return errNode.message;
  if (typeof errNode === "object") {
    for (const k of Object.keys(errNode)) {
      const m = firstErrorMessage(errNode[k]);
      if (m) return m;
    }
  }
  return undefined;
}

export default function ArrayObjectFieldComp<T extends FieldValues>({ control, field }: Props<T>) {
  const values = useWatch({ control }) as T;
  const { errors } = useFormState({ control });

  const {
    fields: items,
    append,
    remove,
    move,
  } = useFieldArray({
    control,
    name: field.name as any,
  });

  const min = field.minItems ?? 0;
  const max = field.maxItems ?? Infinity;

  const arrayError = firstErrorMessage(getIn(errors, String(field.name)));

  return (
    <div className="flex flex-col gap-2">
      {field.label && (
        <div className="text-[13px] font-medium text-slate-800 dark:text-slate-200">
          {field.label}
        </div>
      )}

      <div className="flex flex-col gap-3">
        {items.map((it, idx) => {
          const title = field.itemLabel?.(idx, values) ?? `Item #${idx + 1}`;
          const itemErrNode = getIn(errors, `${String(field.name)}.${idx}`);
          const itemHasError = !!itemErrNode;
          const itemErrMsg = firstErrorMessage(itemErrNode);

          return (
            <div
              key={it.id}
              className={["rounded-xl border p-3", "border-slate-200 dark:border-slate-700"].join(
                " "
              )}
            >
              <div className="mb-2 flex items-center justify-between">
                <div className="flex items-center gap-2">
                  <FaGripVertical className={itemHasError ? "text-rose-500" : "text-slate-400"} />
                  <div className="text-sm font-medium">{title}</div>
                </div>
                <div className="flex items-center gap-1">
                  {field.sortable && (
                    <>
                      <button
                        type="button"
                        className="rounded border px-2 py-1 text-xs"
                        onClick={() => move(idx, Math.max(0, idx - 1))}
                        title="Pindah ke atas"
                      >
                        <FaArrowUp />
                      </button>
                      <button
                        type="button"
                        className="rounded border px-2 py-1 text-xs"
                        onClick={() => move(idx, Math.min(items.length - 1, idx + 1))}
                        title="Pindah ke bawah"
                      >
                        <FaArrowDown />
                      </button>
                    </>
                  )}
                  <button
                    type="button"
                    className="rounded border px-2 py-1 text-xs text-rose-600"
                    onClick={() => remove(idx)}
                    disabled={items.length <= min}
                    title="Hapus"
                  >
                    <FaTrash />
                  </button>
                </div>
              </div>

              {itemHasError && (
                <div className="mb-2 text-[12px] font-medium text-rose-600 dark:text-rose-400">
                  {itemErrMsg}
                </div>
              )}

              <FormRenderer<T>
                control={control}
                fields={field.itemFields as FieldConfig<T>[]}
                namePrefix={`${String(field.name)}.${idx}`}
              />
            </div>
          );
        })}
      </div>

      <div>
        <button
          type="button"
          onClick={() => append({} as any)}
          disabled={items.length >= max}
          className="inline-flex items-center gap-2 rounded-lg border-slate-300 px-3 py-1.5 text-sm hover:bg-slate-50 dark:border-slate-700 dark:hover:bg-slate-800"
        >
          <FaPlus /> {field.addText ?? "Tambah Item"}
        </button>
      </div>

      {arrayError && (
        <small className="text-[12px] font-medium text-rose-600 dark:text-rose-400">
          {arrayError}
        </small>
      )}

      {field.helperText && (
        <small className="text-[12px] text-slate-500 dark:text-slate-400">{field.helperText}</small>
      )}
    </div>
  );
}
