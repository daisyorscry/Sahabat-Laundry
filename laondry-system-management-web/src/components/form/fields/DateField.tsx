// fields/DateField.tsx (custom picker with year navigation)
"use client";

import React, { useEffect, useMemo, useRef, useState } from "react";
import { Control, Controller, FieldValues } from "react-hook-form";
import {
  FaAnglesLeft,
  FaAnglesRight,
  FaChevronLeft,
  FaChevronRight,
  FaCircleExclamation,
  FaRegCalendar,
} from "react-icons/fa6";

import { DateField } from "../types";

// fields/DateField.tsx (custom picker with year navigation)

type Props<T extends FieldValues> = {
  control: Control<T>;
  field: DateField<T> & {
    min?: string;
    max?: string;
    timeStepMinutes?: number;
  };
};

type Mode = "date" | "time" | "datetime";

const ID_MONTHS = [
  "Jan",
  "Feb",
  "Mar",
  "Apr",
  "Mei",
  "Jun",
  "Jul",
  "Agu",
  "Sep",
  "Okt",
  "Nov",
  "Des",
];
const ID_DAYS = ["Sen", "Sel", "Rab", "Kam", "Jum", "Sab", "Min"];
const pad2 = (n: number) => (n < 10 ? `0${n}` : `${n}`);

function parseDateOnly(s: string): Date | null {
  const m = /^(\d{4})-(\d{2})-(\d{2})$/.exec(s);
  if (!m) return null;
  const d = new Date(Number(m[1]), Number(m[2]) - 1, Number(m[3]), 0, 0, 0, 0);
  return isNaN(d.getTime()) ? null : d;
}
function parseTimeOnly(s: string): { h: number; m: number } | null {
  const m = /^(\d{2}):(\d{2})$/.exec(s);
  if (!m) return null;
  const h = Number(m[1]),
    mm = Number(m[2]);
  if (h < 0 || h > 23 || mm < 0 || mm > 59) return null;
  return { h, m: mm };
}
function parseDateTimeLocal(s: string): Date | null {
  const m = /^(\d{4})-(\d{2})-(\d{2})T(\d{2}):(\d{2})$/.exec(s);
  if (!m) return null;
  const d = new Date(
    Number(m[1]),
    Number(m[2]) - 1,
    Number(m[3]),
    Number(m[4]),
    Number(m[5]),
    0,
    0
  );
  return isNaN(d.getTime()) ? null : d;
}
function startOfDay(d: Date) {
  const x = new Date(d);
  x.setHours(0, 0, 0, 0);
  return x;
}
function isSameDay(a: Date, b: Date) {
  return (
    a.getFullYear() === b.getFullYear() &&
    a.getMonth() === b.getMonth() &&
    a.getDate() === b.getDate()
  );
}
function weekDayMon0(d: Date) {
  return (d.getDay() + 6) % 7;
}
function clampDate(dt: Date, min?: Date | null, max?: Date | null) {
  if (min && dt < min) return new Date(min);
  if (max && dt > max) return new Date(max);
  return dt;
}
function fmtDisplay(mode: Mode, v: string): string {
  if (!v) return "";
  if (mode === "date") {
    const d = parseDateOnly(v);
    if (!d) return v;
    return `${d.getDate()} ${ID_MONTHS[d.getMonth()]} ${d.getFullYear()}`;
  }
  if (mode === "time") {
    const t = parseTimeOnly(v);
    if (!t) return v;
    return `${pad2(t.h)}:${pad2(t.m)}`;
  }
  const dt = parseDateTimeLocal(v);
  if (!dt) return v;
  return `${dt.getDate()} ${ID_MONTHS[dt.getMonth()]} ${dt.getFullYear()}, ${pad2(dt.getHours())}:${pad2(dt.getMinutes())}`;
}
function toValueString(mode: Mode, d: Date | null, t?: { h: number; m: number } | null) {
  if (mode === "date") {
    if (!d) return "";
    return `${d.getFullYear()}-${pad2(d.getMonth() + 1)}-${pad2(d.getDate())}`;
  }
  if (mode === "time") {
    if (!t) return "";
    return `${pad2(t.h)}:${pad2(t.m)}`;
  }
  if (!d) return "";
  const hh = t ? t.h : d.getHours();
  const mm = t ? t.m : d.getMinutes();
  const d2 = new Date(d);
  d2.setHours(hh, mm, 0, 0);
  return `${d2.getFullYear()}-${pad2(d2.getMonth() + 1)}-${pad2(d2.getDate())}T${pad2(d2.getHours())}:${pad2(d2.getMinutes())}`;
}
function parseMinMax(mode: Mode, min?: string, max?: string) {
  const today = new Date();
  today.setSeconds(0, 0);
  const anchor = new Date(today.getFullYear(), today.getMonth(), today.getDate(), 0, 0, 0, 0);
  const toDate = (s?: string | null) => {
    if (!s) return null;
    if (mode === "date") return parseDateOnly(s);
    if (mode === "time") {
      const t = parseTimeOnly(s);
      if (!t) return null;
      const d = new Date(anchor);
      d.setHours(t.h, t.m, 0, 0);
      return d;
    }
    return parseDateTimeLocal(s);
  };
  return { minDate: toDate(min), maxDate: toDate(max) };
}

export default function DateFieldComp<T extends FieldValues>({ control, field }: Props<T>) {
  const id = String(field.name);
  const helpId = `${id}__help`;
  const errId = `${id}__error`;
  const mode: Mode =
    field.mode === "time" ? "time" : field.mode === "datetime" ? "datetime" : "date";
  const step = Math.max(1, field.timeStepMinutes ?? 5);

  const [open, setOpen] = useState(false);
  const [view, setView] = useState<{ y: number; m: number }>(() => {
    const now = new Date();
    return { y: now.getFullYear(), m: now.getMonth() };
  });
  const [pickerView, setPickerView] = useState<"calendar" | "year-select">("calendar");
  const [tmpTime, setTmpTime] = useState<{ h: number; m: number } | null>(null);

  const popRef = useRef<HTMLDivElement | null>(null);
  const anchorRef = useRef<HTMLDivElement | null>(null);

  useEffect(() => {
    function handle(e: MouseEvent) {
      if (!open) return;
      const t = e.target as Node;
      if (popRef.current && popRef.current.contains(t)) return;
      if (anchorRef.current && anchorRef.current.contains(t)) return;
      setOpen(false);
      setPickerView("calendar");
    }
    window.addEventListener("mousedown", handle);
    return () => window.removeEventListener("mousedown", handle);
  }, [open]);

  return (
    <div className="flex flex-col gap-1.5">
      {field.label && (
        <label
          htmlFor={id}
          className="text-[13px] font-medium tracking-tight text-slate-800 dark:text-slate-200"
        >
          {field.label}
        </label>
      )}

      <Controller
        control={control}
        name={field.name as any}
        render={({ field: rhf, fieldState }) => {
          const invalid = !!fieldState.error;

          const base =
            "w-full h-10 rounded-xl border bg-white/90 text-sm text-slate-900 transition focus:outline-none " +
            "placeholder:text-slate-400 dark:bg-slate-900/70 dark:text-slate-100 dark:placeholder:text-slate-500";
          const surf =
            (invalid
              ? "border-rose-500/70 focus:border-rose-500 focus:ring-2 focus:ring-rose-200/60 dark:focus:ring-rose-500/20"
              : "border-slate-300 hover:border-slate-400 focus:border-sky-500 focus:ring-2 focus:ring-sky-200/60 " +
                "dark:border-slate-700 dark:hover:border-slate-600 dark:focus:border-sky-400 dark:focus:ring-sky-500/20") +
            " focus:ring-offset-0";
          const cls = `${base} ${surf} pl-3 pr-10`;

          const valueStr = (rhf.value ?? "") as string;
          const display = fmtDisplay(mode, valueStr);
          const { minDate, maxDate } = parseMinMax(mode, (field as any).min, (field as any).max);

          const selectedDate = useMemo(() => {
            if (!valueStr) return null;
            if (mode === "date") return parseDateOnly(valueStr);
            if (mode === "time") {
              const t = parseTimeOnly(valueStr);
              if (!t) return null;
              const base = new Date();
              base.setSeconds(0, 0);
              base.setHours(t.h, t.m, 0, 0);
              return base;
            }
            return parseDateTimeLocal(valueStr);
          }, [valueStr, mode]);

          useEffect(() => {
            const d = selectedDate ?? new Date();
            setView({ y: d.getFullYear(), m: d.getMonth() });
            if (mode !== "time" && selectedDate) {
              setTmpTime({ h: selectedDate.getHours(), m: selectedDate.getMinutes() });
            }
          }, [open]);

          const gridDays = useMemo(() => {
            if (mode === "time") return [];
            const first = new Date(view.y, view.m, 1);
            const firstOffset = weekDayMon0(first);
            const start = new Date(first);
            start.setDate(first.getDate() - firstOffset);

            const arr: {
              d: Date;
              inMonth: boolean;
              disabled: boolean;
              isToday: boolean;
              isSelected: boolean;
            }[] = [];
            for (let i = 0; i < 42; i++) {
              const d = new Date(start);
              d.setDate(start.getDate() + i);
              const inMonth = d.getMonth() === view.m;
              const isToday = isSameDay(d, new Date());
              const isSel = !!selectedDate && isSameDay(d, selectedDate);
              let disabled = false;
              if (minDate && startOfDay(d) < startOfDay(minDate)) disabled = true;
              if (maxDate && startOfDay(d) > startOfDay(maxDate)) disabled = true;
              arr.push({ d, inMonth, disabled, isToday, isSelected: isSel });
            }
            return arr;
          }, [mode, view.y, view.m, minDate, maxDate, selectedDate]);

          const selectDay = (d: Date) => {
            if (mode === "date") {
              rhf.onChange(toValueString("date", d));
              setOpen(false);
              setPickerView("calendar");
              return;
            }
            if (mode === "datetime") {
              const t = tmpTime ?? { h: 0, m: 0 };
              const dt = new Date(d);
              dt.setHours(t.h, t.m, 0, 0);
              const clamped = clampDate(dt, minDate ?? null, maxDate ?? null);
              rhf.onChange(toValueString("datetime", clamped));
              // tetap buka, user bisa atur waktu
              return;
            }
          };

          const hours = Array.from({ length: 24 }, (_, i) => i);
          const minutes = Array.from({ length: Math.ceil(60 / step) }, (_, i) => (i * step) % 60);

          const onTimeChange = (h?: number, m?: number) => {
            const cur = tmpTime ?? { h: 0, m: 0 };
            const next = { h: h ?? cur.h, m: m ?? cur.m };
            setTmpTime(next);

            if (mode === "time") {
              const anchor = new Date();
              anchor.setSeconds(0, 0);
              const picked = new Date(
                anchor.getFullYear(),
                anchor.getMonth(),
                anchor.getDate(),
                next.h,
                next.m,
                0,
                0
              );
              const clamped = clampDate(picked, minDate ?? null, maxDate ?? null);
              const out = { h: clamped.getHours(), m: clamped.getMinutes() };
              rhf.onChange(toValueString("time", null, out));
              return;
            }
            if (mode === "datetime" && selectedDate) {
              const d = new Date(selectedDate);
              d.setHours(next.h, next.m, 0, 0);
              const clamped = clampDate(d, minDate ?? null, maxDate ?? null);
              rhf.onChange(toValueString("datetime", clamped));
            }
          };

          const goMonth = (delta: number) => {
            const m = view.m + delta;
            const y = view.y + Math.floor(m / 12);
            const nm = ((m % 12) + 12) % 12;
            setView({ y, m: nm });
          };
          const goYear = (delta: number) => setView((v) => ({ y: v.y + delta, m: v.m }));

          const yearBlock = useMemo(() => {
            const start = view.y - 6;
            return Array.from({ length: 12 }, (_, i) => start + i);
          }, [view.y]);

          const yearDisabled = (y: number) => {
            if (mode === "time") return false;
            if (minDate && y < minDate.getFullYear()) return true;
            if (maxDate && y > maxDate.getFullYear()) return true;
            return false;
          };

          return (
            <>
              <div className="relative" ref={anchorRef}>
                <button
                  id={id}
                  type="button"
                  className={`${cls} flex items-center justify-between text-left`}
                  disabled={field.disabled}
                  onClick={() => setOpen((v) => !v)}
                  aria-invalid={invalid}
                  aria-describedby={invalid ? errId : field.helperText ? helpId : undefined}
                >
                  <span
                    className={
                      display
                        ? "text-slate-900 dark:text-slate-100"
                        : "text-slate-400 dark:text-slate-500"
                    }
                  >
                    {display ||
                      field.placeholder ||
                      (mode === "time" ? "Pilih waktu…" : "Pilih tanggal…")}
                  </span>
                  {invalid ? (
                    <FaCircleExclamation className="h-5 w-5 text-rose-500" aria-hidden />
                  ) : (
                    <FaRegCalendar
                      className="h-4 w-4 text-slate-400 dark:text-slate-500"
                      aria-hidden
                    />
                  )}
                </button>

                {open && (
                  <div
                    ref={popRef}
                    className="absolute z-30 mt-1 w-[320px] overflow-hidden rounded-xl border border-slate-200 bg-white shadow-lg ring-1 ring-black/5 dark:border-slate-700 dark:bg-slate-900"
                    role="dialog"
                    aria-modal="true"
                  >
                    {mode !== "time" && (
                      <div className="flex items-center justify-between border-b border-slate-200 px-2 py-2 text-sm dark:border-slate-700">
                        <div className="flex items-center gap-1">
                          {/* prev year */}
                          <button
                            type="button"
                            className="inline-flex h-8 w-8 items-center justify-center rounded-md hover:bg-slate-100 dark:hover:bg-slate-800"
                            onClick={() => goYear(-1)}
                            title="Tahun sebelumnya"
                            aria-label="Previous year"
                          >
                            <FaAnglesLeft />
                          </button>
                          <button
                            type="button"
                            className="inline-flex h-8 w-8 items-center justify-center rounded-md hover:bg-slate-100 dark:hover:bg-slate-800"
                            onClick={() => goMonth(-1)}
                            title="Bulan sebelumnya"
                            aria-label="Previous month"
                          >
                            <FaChevronLeft />
                          </button>
                        </div>

                        <button
                          type="button"
                          className="rounded px-2 py-1 font-medium hover:bg-slate-100 dark:hover:bg-slate-800"
                          onClick={() =>
                            setPickerView((v) => (v === "calendar" ? "year-select" : "calendar"))
                          }
                          title="Pilih tahun"
                          aria-expanded={pickerView === "year-select"}
                        >
                          {ID_MONTHS[view.m]} {view.y}
                        </button>

                        <div className="flex items-center gap-1">
                          <button
                            type="button"
                            className="inline-flex h-8 w-8 items-center justify-center rounded-md hover:bg-slate-100 dark:hover:bg-slate-800"
                            onClick={() => goMonth(1)}
                            title="Bulan berikutnya"
                            aria-label="Next month"
                          >
                            <FaChevronRight />
                          </button>
                          <button
                            type="button"
                            className="inline-flex h-8 w-8 items-center justify-center rounded-md hover:bg-slate-100 dark:hover:bg-slate-800"
                            onClick={() => goYear(1)}
                            title="Tahun berikutnya"
                            aria-label="Next year"
                          >
                            <FaAnglesRight />
                          </button>
                        </div>
                      </div>
                    )}

                    <div className="p-3">
                      {mode !== "time" && pickerView === "year-select" && (
                        <div className="grid grid-cols-3 gap-2">
                          {yearBlock.map((y) => {
                            const isCur = y === view.y;
                            const disabled = yearDisabled(y);
                            return (
                              <button
                                key={y}
                                type="button"
                                disabled={disabled}
                                onClick={() => {
                                  setView({ y, m: view.m });
                                  setPickerView("calendar");
                                }}
                                className={[
                                  "h-9 rounded-md text-sm",
                                  disabled
                                    ? "cursor-not-allowed opacity-40"
                                    : isCur
                                      ? "bg-sky-600 text-white"
                                      : "hover:bg-slate-100 dark:hover:bg-slate-800",
                                ].join(" ")}
                              >
                                {y}
                              </button>
                            );
                          })}
                        </div>
                      )}

                      {mode !== "time" && pickerView === "calendar" && (
                        <div>
                          <div className="mb-1 grid grid-cols-7 gap-1 text-center text-[11px] tracking-wide text-slate-500 uppercase dark:text-slate-400">
                            {ID_DAYS.map((d) => (
                              <div key={d}>{d}</div>
                            ))}
                          </div>
                          <div className="grid grid-cols-7 gap-1">
                            {gridDays.map((g, i) => {
                              const cellCls =
                                "h-9 select-none rounded-md text-sm leading-9 text-center cursor-pointer";
                              const tone = g.disabled
                                ? "opacity-40 cursor-not-allowed"
                                : g.isSelected
                                  ? "bg-sky-600 text-white"
                                  : g.inMonth
                                    ? "hover:bg-slate-100 dark:hover:bg-slate-800"
                                    : "text-slate-400 dark:text-slate-500 hover:bg-slate-100 dark:hover:bg-slate-800";
                              return (
                                <div
                                  key={i}
                                  className={`${cellCls} ${tone} ${g.isToday && !g.isSelected ? "ring-1 ring-sky-300 dark:ring-sky-700" : ""}`}
                                  onClick={() => !g.disabled && selectDay(g.d)}
                                  aria-disabled={g.disabled}
                                  role="button"
                                  tabIndex={-1}
                                >
                                  {g.d.getDate()}
                                </div>
                              );
                            })}
                          </div>
                          <div className="mt-3 flex items-center justify-between">
                            <button
                              type="button"
                              className="rounded-md border border-slate-200 px-2 py-1 text-xs hover:bg-slate-50 dark:border-slate-700 dark:hover:bg-slate-800"
                              onClick={() => {
                                const now = new Date();
                                if (mode === "date") {
                                  const d = clampDate(
                                    startOfDay(now),
                                    minDate ?? null,
                                    maxDate ?? null
                                  );
                                  rhf.onChange(toValueString("date", d));
                                  setOpen(false);
                                  setPickerView("calendar");
                                } else {
                                  const t = tmpTime ?? { h: 0, m: 0 };
                                  const d = clampDate(now, minDate ?? null, maxDate ?? null);
                                  d.setSeconds(0, 0);
                                  rhf.onChange(toValueString("datetime", d, t));
                                }
                              }}
                            >
                              Today
                            </button>
                            <button
                              type="button"
                              className="rounded-md border border-slate-200 px-2 py-1 text-xs text-rose-600 hover:bg-rose-50 dark:border-slate-700 dark:hover:bg-rose-950/30"
                              onClick={() => {
                                rhf.onChange("");
                                setTmpTime(null);
                                setOpen(false);
                                setPickerView("calendar");
                              }}
                            >
                              Clear
                            </button>
                          </div>
                        </div>
                      )}
                      {(mode === "time" || mode === "datetime") && (
                        <div
                          className={`${mode === "datetime" ? "mt-4 border-t border-slate-200 pt-3 dark:border-slate-700" : ""}`}
                        >
                          <div className="mb-2 text-xs font-medium text-slate-600 dark:text-slate-300">
                            Pilih Waktu
                          </div>
                          <div className="flex gap-2">
                            <div className="max-h-40 w-20 overflow-auto rounded-md border border-slate-200 dark:border-slate-700">
                              {hours.map((h) => {
                                let disabled = false;
                                if (mode === "time") {
                                  if (minDate && h < minDate.getHours()) disabled = true;
                                  if (maxDate && h > maxDate.getHours()) disabled = true;
                                }
                                const active = (tmpTime?.h ?? selectedDate?.getHours() ?? 0) === h;
                                return (
                                  <div
                                    key={h}
                                    className={[
                                      "cursor-pointer px-2 py-1 text-sm",
                                      disabled
                                        ? "cursor-not-allowed opacity-40"
                                        : active
                                          ? "bg-sky-600 text-white"
                                          : "hover:bg-slate-100 dark:hover:bg-slate-800",
                                    ].join(" ")}
                                    onClick={() => !disabled && onTimeChange(h, undefined)}
                                  >
                                    {pad2(h)}
                                  </div>
                                );
                              })}
                            </div>
                            <div className="max-h-40 w-20 overflow-auto rounded-md border border-slate-200 dark:border-slate-700">
                              {minutes.map((m) => {
                                let disabled = false;
                                if (mode === "time") {
                                  const curH = tmpTime?.h ?? selectedDate?.getHours() ?? 0;
                                  if (
                                    minDate &&
                                    curH === minDate.getHours() &&
                                    m < minDate.getMinutes()
                                  )
                                    disabled = true;
                                  if (
                                    maxDate &&
                                    curH === maxDate.getHours() &&
                                    m > maxDate.getMinutes()
                                  )
                                    disabled = true;
                                }
                                if (mode === "datetime" && selectedDate) {
                                  const d = new Date(selectedDate);
                                  const h = tmpTime?.h ?? d.getHours();
                                  const test = new Date(d);
                                  test.setHours(h, m, 0, 0);
                                  if (minDate && test < minDate) disabled = true;
                                  if (maxDate && test > maxDate) disabled = true;
                                }
                                const active =
                                  (tmpTime?.m ?? selectedDate?.getMinutes() ?? 0) === m;
                                return (
                                  <div
                                    key={m}
                                    className={[
                                      "cursor-pointer px-2 py-1 text-sm",
                                      disabled
                                        ? "cursor-not-allowed opacity-40"
                                        : active
                                          ? "bg-sky-600 text-white"
                                          : "hover:bg-slate-100 dark:hover:bg-slate-800",
                                    ].join(" ")}
                                    onClick={() => !disabled && onTimeChange(undefined, m)}
                                  >
                                    {pad2(m)}
                                  </div>
                                );
                              })}
                            </div>
                          </div>

                          {mode === "time" && (
                            <div className="mt-3 flex items-center justify-between">
                              <button
                                type="button"
                                className="rounded-md border border-slate-200 px-2 py-1 text-xs hover:bg-slate-50 dark:border-slate-700 dark:hover:bg-slate-800"
                                onClick={() => {
                                  const now = new Date();
                                  const out = {
                                    h: now.getHours(),
                                    m: now.getMinutes() - (now.getMinutes() % step),
                                  };
                                  onTimeChange(out.h, out.m);
                                  setOpen(false);
                                }}
                              >
                                Now
                              </button>
                              <button
                                type="button"
                                className="rounded-md border border-slate-200 px-2 py-1 text-xs text-rose-600 hover:bg-rose-50 dark:border-slate-700 dark:hover:bg-rose-950/30"
                                onClick={() => {
                                  rhf.onChange("");
                                  setTmpTime(null);
                                  setOpen(false);
                                }}
                              >
                                Clear
                              </button>
                            </div>
                          )}
                        </div>
                      )}
                    </div>

                    {mode === "datetime" && (
                      <div className="flex items-center justify-end gap-2 border-t border-slate-200 px-3 py-2 dark:border-slate-700">
                        <button
                          type="button"
                          className="rounded-md border border-slate-200 px-3 py-1.5 text-sm hover:bg-slate-50 dark:border-slate-700 dark:hover:bg-slate-800"
                          onClick={() => {
                            setOpen(false);
                            setPickerView("calendar");
                          }}
                        >
                          Tutup
                        </button>
                        <button
                          type="button"
                          className="rounded-md bg-sky-600 px-3 py-1.5 text-sm font-medium text-white hover:bg-sky-700 dark:bg-sky-600 dark:hover:bg-sky-500"
                          onClick={() => {
                            setOpen(false);
                            setPickerView("calendar");
                          }}
                        >
                          OK
                        </button>
                      </div>
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
            </>
          );
        }}
      />
    </div>
  );
}
