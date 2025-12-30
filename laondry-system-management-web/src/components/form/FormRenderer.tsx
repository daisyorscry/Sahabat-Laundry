import { useMemo } from "react";
import { Control, FieldValues } from "react-hook-form";

import { controlRegistry, FieldRenderer } from "./registry";
import { FieldConfig } from "./types";

type BP = "base" | "sm" | "md" | "lg" | "xl" | "2xl";
type GridCols = Partial<Record<BP, 1 | 2 | 3 | 4 | 5 | 6 | 7 | 8 | 9 | 10 | 11 | 12>>;
type SpanCols = Partial<Record<BP, 1 | 2 | 3 | 4 | 5 | 6 | 7 | 8 | 9 | 10 | 11 | 12>>;

type Layout<T extends FieldValues> = {
  mode?: "stack" | "grid"; // default: "stack"
  cols?: GridCols; // default grid: { base:1, md:2 }
  gap?: string; // tailwind class, default: "gap-3"
  itemSpan?: (f: FieldConfig<T>, i: number) => number | SpanCols | undefined;
  itemClassName?: (f: FieldConfig<T>, i: number) => string | undefined;
};

type Props<T extends FieldValues> = {
  control: Control<T>;
  fields: Array<FieldConfig<T>>;
  className?: string;
  namePrefix?: string;
  layout?: Layout<T>;
};

function withPrefix<T extends FieldValues>(f: FieldConfig<T>, prefix?: string): FieldConfig<T> {
  if (!prefix) return f;
  return { ...f, name: `${prefix}.${String(f.name)}` as any };
}

function colsToClass(cols?: GridCols) {
  const c = cols ?? { base: 1, md: 2 };
  const parts: string[] = [];
  if (c.base) parts.push(`grid-cols-${c.base}`);
  if (c.sm) parts.push(`sm:grid-cols-${c.sm}`);
  if (c.md) parts.push(`md:grid-cols-${c.md}`);
  if (c.lg) parts.push(`lg:grid-cols-${c.lg}`);
  if (c.xl) parts.push(`xl:grid-cols-${c.xl}`);
  if (c["2xl"]) parts.push(`2xl:grid-cols-${c["2xl"]}`);
  return parts.join(" ");
}

function spanToClass(span?: number | SpanCols) {
  if (!span) return "";
  if (typeof span === "number") return `col-span-${span}`;
  const parts: string[] = [];
  if (span.base) parts.push(`col-span-${span.base}`);
  if (span.sm) parts.push(`sm:col-span-${span.sm}`);
  if (span.md) parts.push(`md:col-span-${span.md}`);
  if (span.lg) parts.push(`lg:col-span-${span.lg}`);
  if (span.xl) parts.push(`xl:col-span-${span.xl}`);
  if (span["2xl"]) parts.push(`2xl:col-span-${span["2xl"]}`);
  return parts.join(" ");
}

export function FormRenderer<T extends FieldValues>({
  control,
  fields,
  className,
  namePrefix,
  layout,
}: Props<T>) {
  const effFields = useMemo(
    () => fields.map((f) => withPrefix(f, namePrefix)),
    [fields, namePrefix]
  );

  const mode = layout?.mode ?? "stack";
  const gap = layout?.gap ?? "gap-3";

  const containerClass =
    mode === "grid"
      ? ["grid", gap, colsToClass(layout?.cols)].join(" ")
      : ["flex", "flex-col", gap].join(" ");

  return (
    <div className={[containerClass, className].filter(Boolean).join(" ")}>
      {effFields.map((f, i) => {
        const Comp = controlRegistry[f.type] as unknown as FieldRenderer<T, typeof f>;

        const itemCls = [
          mode === "grid" ? spanToClass(layout?.itemSpan?.(f, i)) : "",
          layout?.itemClassName?.(f, i) ?? "",
        ]
          .filter(Boolean)
          .join(" ");

        return (
          <div key={String(f.name)} className={itemCls}>
            <Comp control={control} field={f} />
          </div>
        );
      })}
    </div>
  );
}

export default FormRenderer;
