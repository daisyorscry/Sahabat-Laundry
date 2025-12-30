// fields/AsyncSelectField.tsx
"use client";

import { useCallback, useEffect, useMemo, useRef, useState } from "react";
import { Control, Controller, FieldValues } from "react-hook-form";
import { FaCheck, FaChevronDown, FaCircleExclamation, FaXmark } from "react-icons/fa6";

import { AsyncSelectField, SelectOption } from "../types";

// fields/AsyncSelectField.tsx

type Props<T extends FieldValues> = { control: Control<T>; field: AsyncSelectField<T> };

export default function AsyncSelectFieldComp<T extends FieldValues>({ control, field }: Props<T>) {
  const id = String(field.name);
  const helpId = `${id}__help`;
  const errId = `${id}__error`;

  const debounceMs = field.debounceMs ?? 300;
  const minChars = field.minChars ?? 0;

  const [open, setOpen] = useState(false);
  const [q, setQ] = useState(field.initialQuery ?? "");
  const [loading, setLoading] = useState(false);
  const [opts, setOpts] = useState<SelectOption[]>([]);
  const [active, setActive] = useState(0);

  const rootRef = useRef<HTMLDivElement | null>(null);
  const abortRef = useRef<AbortController | null>(null);
  const debounceRef = useRef<number | null>(null);

  const runSearch = useCallback(
    (query: string) => {
      if (abortRef.current) abortRef.current.abort();
      const ctrl = new AbortController();
      abortRef.current = ctrl;

      if (query.length < minChars) {
        setOpts([]);
        setLoading(false);
        return;
      }

      setLoading(true);
      field
        .loadOptions(query, ctrl.signal)
        .then((data) => setOpts(data || []))
        .catch(() => {
          /* silent */
        })
        .finally(() => setLoading(false));
    },
    [field, minChars]
  );

  useEffect(() => {
    if (debounceRef.current) window.clearTimeout(debounceRef.current);
    debounceRef.current = window.setTimeout(() => runSearch(q), debounceMs);
    return () => {
      if (debounceRef.current) window.clearTimeout(debounceRef.current);
    };
  }, [q, debounceMs, runSearch]);

  useEffect(() => {
    const onDocClick = (e: MouseEvent) => {
      if (!rootRef.current) return;
      if (!rootRef.current.contains(e.target as Node)) setOpen(false);
    };
    document.addEventListener("mousedown", onDocClick);
    return () => document.removeEventListener("mousedown", onDocClick);
  }, []);

  return (
    <Controller
      control={control}
      name={field.name as any}
      render={({ field: rhf, fieldState }) => {
        const invalid = !!fieldState.error;

        const selected = useMemo(() => {
          const v = rhf.value;
          return opts.find((o) => String(o.value) === String(v));
        }, [opts, rhf.value]);

        useEffect(() => {
          if (open) {
            if (selected && q.length === 0) setQ(selected.label);
          } else {
            if (selected) setQ(selected.label);
            else if (!selected && q.length > 0) setQ("");
          }
        }, [open]);

        const base =
          "w-full h-10 rounded-xl border bg-white/90 text-sm text-slate-900 transition focus:outline-none " +
          "placeholder:text-slate-400 dark:bg-slate-900/70 dark:text-slate-100 dark:placeholder:text-slate-500";
        const surf =
          (invalid
            ? "border-rose-500/70 focus:border-rose-500 focus:ring-2 focus:ring-rose-200/60 dark:focus:ring-rose-500/20"
            : "border-slate-300 hover:border-slate-400 focus:border-sky-500 focus:ring-2 focus:ring-sky-200/60 " +
              "dark:border-slate-700 dark:hover:border-slate-600 dark:focus:border-sky-400 dark:focus:ring-sky-500/20") +
          " focus:ring-offset-0";

        return (
          <div className="flex flex-col gap-1.5" ref={rootRef}>
            {field.label && (
              <label
                htmlFor={id}
                className="text-[13px] font-medium tracking-tight text-slate-800 dark:text-slate-200"
              >
                {field.label}
              </label>
            )}

            <div className="relative">
              <div
                className={`${base} ${surf} flex items-center justify-between pr-10 pl-3`}
                aria-invalid={invalid}
                aria-describedby={invalid ? errId : field.helperText ? helpId : undefined}
                onClick={() => setOpen(true)}
              >
                <input
                  id={id}
                  className="flex-1 bg-transparent outline-none"
                  placeholder={field.placeholder ?? "Ketik untuk mencari..."}
                  disabled={field.disabled}
                  value={open ? q : (selected?.label ?? "")}
                  onChange={(e) => {
                    if (!open) setOpen(true);
                    setQ(e.target.value);
                    setActive(0);
                  }}
                  onFocus={() => setOpen(true)}
                  onKeyDown={(e) => {
                    if (!open && (e.key === "ArrowDown" || e.key === "Enter")) {
                      setOpen(true);
                      return;
                    }
                    if (e.key === "ArrowDown") {
                      e.preventDefault();
                      setActive((a) => Math.min(a + 1, Math.max(0, opts.length - 1)));
                    } else if (e.key === "ArrowUp") {
                      e.preventDefault();
                      setActive((a) => Math.max(a - 1, 0));
                    } else if (e.key === "Enter") {
                      e.preventDefault();
                      const o = opts[active];
                      if (o && !o.disabled) {
                        const val = field.mapValue ? field.mapValue(o) : o.value;
                        rhf.onChange(val);
                        setOpen(false);
                      }
                    } else if (e.key === "Escape" || e.key === "Tab") {
                      setOpen(false);
                    }
                  }}
                />

                {rhf.value != null && String(rhf.value) !== "" ? (
                  <button
                    type="button"
                    className="absolute right-7 p-1 text-slate-400 hover:text-slate-600"
                    aria-label="Clear selection"
                    onClick={(e) => {
                      e.stopPropagation();
                      rhf.onChange(undefined);
                      setQ("");
                      setOpts([]);
                      setActive(0);
                    }}
                  >
                    <FaXmark className="h-4 w-4" />
                  </button>
                ) : null}

                {invalid ? (
                  <FaCircleExclamation
                    className="absolute right-2 h-5 w-5 text-rose-500"
                    aria-hidden
                  />
                ) : (
                  <FaChevronDown
                    className="absolute right-2 h-4 w-4 text-slate-400 dark:text-slate-500"
                    aria-hidden
                  />
                )}
              </div>

              {open && (
                <div
                  className="absolute z-30 mt-1 w-full rounded-xl border border-slate-200 bg-white shadow-lg ring-1 ring-black/5 dark:border-slate-700 dark:bg-slate-900"
                  role="listbox"
                >
                  {loading ? (
                    <div className="px-3 py-2 text-sm text-slate-400">Memuat…</div>
                  ) : opts.length === 0 ? (
                    <div className="px-3 py-2 text-sm text-slate-400">
                      {field.emptyText ?? "Tidak ada data"}
                    </div>
                  ) : (
                    opts.map((o, i) => {
                      const isSel = String(rhf.value ?? "") === String(o.value);
                      const isActive = i === active;
                      const disabled = !!o.disabled;
                      return (
                        <div
                          key={String(o.value)}
                          role="option"
                          aria-selected={isSel}
                          className={[
                            "flex items-center justify-between px-3 py-2 text-sm",
                            disabled
                              ? "cursor-not-allowed opacity-60"
                              : isActive
                                ? "cursor-pointer bg-slate-100 dark:bg-slate-800"
                                : "cursor-pointer hover:bg-slate-100 dark:hover:bg-slate-800",
                          ].join(" ")}
                          onMouseEnter={() => setActive(i)}
                          onMouseDown={(e) => e.preventDefault()} // cegah blur sebelum onClick
                          onClick={() => {
                            if (disabled) return;
                            const val = field.mapValue ? field.mapValue(o) : o.value;
                            rhf.onChange(val);
                            setOpen(false);
                          }}
                        >
                          <span className="truncate">{o.label}</span>
                          {isSel && <FaCheck className="h-4 w-4 text-sky-600 dark:text-sky-400" />}
                        </div>
                      );
                    })
                  )}
                </div>
              )}
            </div>

            {field.helperText && !invalid && (
              <small id={helpId} className="text-[12px] text-slate-500 dark:text-slate-400">
                {field.helperText}
              </small>
            )}
            {invalid && (
              <small
                id={errId}
                className="text-[12px] font-medium text-rose-600 dark:text-rose-400"
              >
                {fieldState.error!.message}
              </small>
            )}
          </div>
        );
      }}
    />
  );
}
