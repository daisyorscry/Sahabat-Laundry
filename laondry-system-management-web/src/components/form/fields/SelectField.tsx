"use client";

import React, { useEffect, useMemo, useRef, useState } from "react";
import { Control, Controller, FieldValues } from "react-hook-form";
import { FaCheck, FaChevronDown, FaCircleExclamation } from "react-icons/fa6";

import { useFormTheme } from "../../theme/formTheme";
import { SelectField } from "../types";

type Props<T extends FieldValues> = {
  control: Control<T>;
  field: SelectField<T> & {
    maxMenuHeight?: number;
  };
};

export default function SelectFieldComp<T extends FieldValues>({ control, field }: Props<T>) {
  const id = String(field.name);
  const helpId = `${id}__help`;
  const errId = `${id}__error`;
  const maxMenuHeight = field.maxMenuHeight ?? 240;

  const theme = useFormTheme();

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

          // classes dari theme
          const surf = invalid ? theme.inputSurf.invalid : theme.inputSurf.normal;
          const padding = theme.inputPadding?.({ leftIcon: false, rightIcon: true }) ?? "";
          const triggerCls = `${theme.inputBase} ${surf} ${padding} text-left`;

          const selected = useMemo(
            () => field.options.find((o) => String(o.value) === String(rhf.value ?? "")),
            [field.options, rhf.value]
          );

          const placeholder = field.placeholder ?? "-- pilih --";
          const [open, setOpen] = useState(false);
          const [activeIndex, setActiveIndex] = useState<number>(() => {
            const idx = field.options.findIndex((o) => String(o.value) === String(rhf.value ?? ""));
            return idx >= 0 ? idx : 0;
          });

          const wrapRef = useRef<HTMLDivElement | null>(null);
          const btnRef = useRef<HTMLButtonElement | null>(null);
          const listRef = useRef<HTMLDivElement | null>(null);

          useEffect(() => {
            function onDocDown(e: MouseEvent) {
              if (!wrapRef.current) return;
              if (wrapRef.current.contains(e.target as Node)) return;
              setOpen(false);
            }
            if (open) document.addEventListener("mousedown", onDocDown);
            return () => document.removeEventListener("mousedown", onDocDown);
          }, [open]);

          useEffect(() => {
            if (!open || activeIndex < 0) return;
            const list = listRef.current;
            const item = list?.querySelector<HTMLDivElement>(`[data-index="${activeIndex}"]`);
            if (list && item) {
              const lTop = list.scrollTop;
              const lBottom = lTop + list.clientHeight;
              const iTop = item.offsetTop;
              const iBottom = iTop + item.offsetHeight;
              if (iTop < lTop) list.scrollTop = iTop;
              else if (iBottom > lBottom) list.scrollTop = iBottom - list.clientHeight;
            }
          }, [open, activeIndex]);

          const openMenu = () => {
            if (field.disabled) return;
            setOpen(true);
            const idx = field.options.findIndex((o) => String(o.value) === String(rhf.value ?? ""));
            setActiveIndex(idx >= 0 ? idx : 0);
          };
          const closeMenu = () => setOpen(false);

          const onKeyDown = (e: React.KeyboardEvent) => {
            if (!open) {
              if (
                e.key === "ArrowDown" ||
                e.key === "ArrowUp" ||
                e.key === "Enter" ||
                e.key === " "
              ) {
                e.preventDefault();
                openMenu();
              }
              return;
            }
            if (e.key === "Escape") {
              e.preventDefault();
              closeMenu();
              btnRef.current?.focus();
              return;
            }
            if (e.key === "Enter" || e.key === " ") {
              e.preventDefault();
              const item = field.options[activeIndex];
              if (!item) return;
              if ((item as any).disabled) return;
              rhf.onChange(item.value);
              closeMenu();
              btnRef.current?.focus();
              return;
            }
            if (e.key === "ArrowDown" || e.key === "ArrowUp") {
              e.preventDefault();
              const dir = e.key === "ArrowDown" ? 1 : -1;
              let i = activeIndex;
              for (let step = 0; step < field.options.length; step++) {
                i = (i + dir + field.options.length) % field.options.length;
                if (!(field.options[i] as any).disabled) break;
              }
              setActiveIndex(i);
            }
            if (e.key === "Home" || e.key === "End") {
              e.preventDefault();
              const i = e.key === "Home" ? 0 : field.options.length - 1;
              setActiveIndex(i);
            }
          };

          return (
            <>
              <div className="relative" ref={wrapRef}>
                <button
                  type="button"
                  id={id}
                  ref={btnRef}
                  className={triggerCls}
                  disabled={field.disabled}
                  onClick={() => (open ? closeMenu() : openMenu())}
                  onKeyDown={onKeyDown}
                  aria-haspopup="listbox"
                  aria-expanded={open}
                  aria-invalid={invalid}
                  aria-describedby={invalid ? errId : field.helperText ? helpId : undefined}
                >
                  <span className={selected ? "" : "text-slate-400 dark:text-slate-500"}>
                    {selected ? selected.label : placeholder}
                  </span>
                  {invalid ? (
                    <FaCircleExclamation
                      className="pointer-events-none absolute top-1/2 right-3 h-5 w-5 -translate-y-1/2 text-rose-500"
                      aria-hidden
                    />
                  ) : (
                    <FaChevronDown
                      className="pointer-events-none absolute top-1/2 right-3 h-4 w-4 -translate-y-1/2 text-slate-400 dark:text-slate-500"
                      aria-hidden
                    />
                  )}
                </button>

                {open && (
                  <div
                    ref={listRef}
                    role="listbox"
                    tabIndex={-1}
                    aria-labelledby={id}
                    className={`absolute z-20 mt-1 w-full overflow-auto ${theme.popover}`}
                    style={{ maxHeight: maxMenuHeight }}
                    onKeyDown={onKeyDown}
                  >
                    {field.options.map((o, i) => {
                      const isSelected = String(rhf.value ?? "") === String(o.value);
                      const disabled = (o as any).disabled ?? field.disabled;
                      const active = i === activeIndex;
                      return (
                        <div
                          key={String(o.value)}
                          role="option"
                          aria-selected={isSelected}
                          data-index={i}
                          className={[
                            "flex items-center justify-between px-3 py-2 text-sm",
                            disabled ? "cursor-not-allowed opacity-60" : "cursor-pointer",
                            active
                              ? "bg-sky-50 text-sky-900 dark:bg-sky-400/10 dark:text-sky-200"
                              : "bg-transparent text-slate-800 dark:text-slate-100",
                          ].join(" ")}
                          onMouseEnter={() => setActiveIndex(i)}
                          onClick={() => {
                            if (disabled) return;
                            rhf.onChange(o.value);
                            closeMenu();
                            btnRef.current?.focus();
                          }}
                        >
                          <span className="truncate">{o.label}</span>
                          {isSelected && (
                            <FaCheck
                              className="h-4 w-4 text-sky-600 dark:text-sky-400"
                              aria-hidden
                            />
                          )}
                        </div>
                      );
                    })}
                  </div>
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
