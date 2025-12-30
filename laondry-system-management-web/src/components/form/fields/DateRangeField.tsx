"use client";

import { useEffect, useMemo, useRef, useState } from "react";
import { Control, Controller, FieldValues } from "react-hook-form";
import { FaChevronLeft, FaChevronRight, FaCircleExclamation, FaRegCalendar } from "react-icons/fa6";

import { DateRangeField } from "../types";
import { useFieldTheme } from "../useFieldTheme";
import { Portal } from "./Portal";

type Props<T extends FieldValues> = {
  control: Control<T>;
  field: DateRangeField<T>;
};

type RangeVal = { start?: string; end?: string };

function toDateOnlyString(d: Date) {
  const y = d.getFullYear();
  const m = `${d.getMonth() + 1}`.padStart(2, "0");
  const da = `${d.getDate()}`.padStart(2, "0");
  return `${y}-${m}-${da}`;
}
function toDateTimeLocalString(d: Date) {
  const y = d.getFullYear();
  const m = `${d.getMonth() + 1}`.padStart(2, "0");
  const da = `${d.getDate()}`.padStart(2, "0");
  const hh = `${d.getHours()}`.padStart(2, "0");
  const mi = `${d.getMinutes()}`.padStart(2, "0");
  return `${y}-${m}-${da}T${hh}:${mi}`;
}
function parseLocal(s: string): Date | null {
  if (!s) return null;
  const dt = s.includes("T") ? new Date(s) : new Date(`${s}T00:00`);
  return isNaN(dt.getTime()) ? null : dt;
}

function startOfMonth(d: Date) {
  return new Date(d.getFullYear(), d.getMonth(), 1);
}
function addMonths(d: Date, n: number) {
  return new Date(d.getFullYear(), d.getMonth() + n, 1);
}

function monthMatrix(view: Date) {
  // 6 rows x 7 cols
  const first = startOfMonth(view);
  const firstDow = (first.getDay() + 6) % 7;
  const start = new Date(first);
  start.setDate(first.getDate() - firstDow);
  const cells: Date[] = [];
  for (let i = 0; i < 42; i++) {
    const c = new Date(start);
    c.setDate(start.getDate() + i);
    cells.push(c);
  }
  return cells;
}

function inRange(d: Date, a?: Date | null, b?: Date | null) {
  if (!a || !b) return false;
  const x = new Date(d.getFullYear(), d.getMonth(), d.getDate()).getTime();
  const s = new Date(a.getFullYear(), a.getMonth(), a.getDate()).getTime();
  const e = new Date(b.getFullYear(), b.getMonth(), b.getDate()).getTime();
  return x >= Math.min(s, e) && x <= Math.max(s, e);
}
function sameDay(a?: Date | null, b?: Date | null) {
  if (!a || !b) return false;
  return (
    a.getFullYear() === b.getFullYear() &&
    a.getMonth() === b.getMonth() &&
    a.getDate() === b.getDate()
  );
}

export default function DateRangeFieldComp<T extends FieldValues>({ control, field }: Props<T>) {
  const th = useFieldTheme(field.ui);

  const id = String(field.name);
  const helpId = `${id}__help`;
  const errId = `${id}__error`;

  const mode = field.mode ?? "date";
  const step = field.timeStepMinutes ?? 15;

  const btnRef = useRef<HTMLButtonElement | null>(null);
  const popRef = useRef<HTMLDivElement | null>(null);
  const [open, setOpen] = useState(false);

  useEffect(() => {
    function onDocDown(e: MouseEvent) {
      if (!popRef.current) return;
      if (popRef.current.contains(e.target as Node)) return;
      if (btnRef.current && btnRef.current.contains(e.target as Node)) return;
      setOpen(false);
    }
    if (open) document.addEventListener("mousedown", onDocDown);
    return () => document.removeEventListener("mousedown", onDocDown);
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
            "w-full h-10 rounded-xl border bg-white/90 text-sm text-slate-900 " +
            "transition focus:outline-none " +
            "placeholder:text-slate-400 dark:bg-slate-900/70 dark:text-slate-100 dark:placeholder:text-slate-500";
          const surf =
            (invalid
              ? "border-rose-500/70 focus:border-rose-500 focus:ring-2 focus:ring-rose-200/60 dark:focus:ring-rose-500/20"
              : "border-slate-300 hover:border-slate-400 focus:border-sky-500 focus:ring-2 focus:ring-sky-200/60 " +
                "dark:border-slate-700 dark:hover:border-slate-600 dark:focus:border-sky-400 dark:focus:ring-sky-500/20") +
            " focus:ring-offset-0";
          const triggerCls = `${base} ${surf} pl-3 pr-10 text-left`;

          const val: RangeVal = (rhf.value ?? {}) as RangeVal;
          const startD = parseLocal(val.start ?? "");
          const endD = parseLocal(val.end ?? "");

          const label = useMemo(() => {
            const fmt =
              field.displayFormat ??
              ((d: Date) =>
                d.toLocaleDateString(undefined, {
                  year: "numeric",
                  month: "short",
                  day: "2-digit",
                  ...(mode === "datetime" ? { hour: "2-digit", minute: "2-digit" } : {}),
                }));
            if (startD && endD) return `${fmt(startD)} — ${fmt(endD)}`;
            if (startD) return `${fmt(startD)} — …`;
            return field.placeholder ?? "Pilih rentang tanggal";
          }, [val, field.placeholder, mode]);

          const [view, setView] = useState<Date>(() => startD ?? new Date());
          useEffect(() => {
            if (startD) setView(new Date(startD));
          }, [val.start]);

          const cells = useMemo(() => monthMatrix(view), [view]);
          const minD = parseLocal(field.min ?? "");
          const maxD = parseLocal(field.max ?? "");
          const isDisabledDay = (d: Date) => {
            if (minD && d < new Date(minD.getFullYear(), minD.getMonth(), minD.getDate()))
              return true;
            if (maxD && d > new Date(maxD.getFullYear(), maxD.getMonth(), maxD.getDate()))
              return true;
            return false;
          };

          const onPickDay = (d: Date) => {
            if (isDisabledDay(d)) return;
            if (!startD || (startD && endD)) {
              rhf.onChange({
                start:
                  mode === "datetime" ? toDateTimeLocalString(new Date(d)) : toDateOnlyString(d),
                end: undefined,
              });
            } else {
              const baseStart = new Date(startD);
              const endBase = new Date(d);
              if (mode === "datetime") {
                rhf.onChange({
                  start: toDateTimeLocalString(baseStart),
                  end: toDateTimeLocalString(endBase),
                });
              } else {
                rhf.onChange({
                  start: toDateOnlyString(baseStart),
                  end: toDateOnlyString(endBase),
                });
              }
            }
          };

          // time controls (hanya mode datetime)
          const hours = Array.from({ length: 24 }, (_, i) => i);
          const minutes = Array.from({ length: Math.floor(60 / step) }, (_, i) => i * step);

          const setTime = (which: "start" | "end", h: number, m: number) => {
            const cur = which === "start" ? startD : endD;
            if (!cur) return;
            const d = new Date(cur);
            d.setHours(h, m, 0, 0);
            const next: RangeVal = { start: val.start, end: val.end };
            next[which] = toDateTimeLocalString(d);
            rhf.onChange(next);
          };

          return (
            <>
              <div className="relative">
                <button
                  type="button"
                  id={id}
                  ref={btnRef}
                  className={triggerCls}
                  onClick={() => setOpen((o) => !o)}
                  aria-haspopup="dialog"
                  aria-expanded={open}
                  aria-invalid={invalid}
                  aria-describedby={invalid ? errId : field.helperText ? helpId : undefined}
                >
                  <span className={startD ? "" : "text-slate-400 dark:text-slate-500"}>
                    {label}
                  </span>
                  {invalid ? (
                    <FaCircleExclamation
                      className="pointer-events-none absolute top-1/2 right-3 h-5 w-5 -translate-y-1/2 text-rose-500"
                      aria-hidden
                    />
                  ) : (
                    <FaRegCalendar
                      className="pointer-events-none absolute top-1/2 right-3 h-4 w-4 -translate-y-1/2 text-slate-400 dark:text-slate-500"
                      aria-hidden
                    />
                  )}
                </button>

                {open &&
                  (field.portal ? (
                    <Portal>
                      <div className="fixed inset-0 z-40" onClick={() => setOpen(false)} />
                      <div
                        className={[
                          "fixed z-50 w-[340px] p-3",
                          th.popover,
                          field.placement === "top" && "top-6 left-1/2 -translate-x-1/2",
                          field.placement === "bottom" && "bottom-6 left-1/2 -translate-x-1/2",
                          field.placement === "left" && "top-1/2 left-6 -translate-y-1/2",
                          field.placement === "right" && "top-1/2 right-6 -translate-y-1/2",
                          (!field.placement || field.placement === "center") &&
                            "top-[20%] left-1/2 -translate-x-1/2",
                        ].join(" ")}
                        role="dialog"
                        aria-modal="true"
                      >
                        <div
                          ref={popRef}
                          role="dialog"
                          aria-modal="true"
                          className="absolute z-30 mt-1 w-[320px] rounded-xl border border-slate-200 bg-white p-3 shadow-lg ring-1 ring-black/5 dark:border-slate-700 dark:bg-slate-900"
                        >
                          <div className="mb-2 flex items-center justify-between">
                            <button
                              type="button"
                              className="rounded p-1 hover:bg-slate-100 dark:hover:bg-slate-800"
                              onClick={() => setView((v) => addMonths(v, -1))}
                              aria-label="Bulan sebelumnya"
                            >
                              <FaChevronLeft />
                            </button>
                            <div className="text-sm font-medium">
                              {view.toLocaleDateString(undefined, {
                                month: "long",
                                year: "numeric",
                              })}
                            </div>
                            <button
                              type="button"
                              className="rounded p-1 hover:bg-slate-100 dark:hover:bg-slate-800"
                              onClick={() => setView((v) => addMonths(v, +1))}
                              aria-label="Bulan berikutnya"
                            >
                              <FaChevronRight />
                            </button>
                          </div>

                          <div className="mb-1 grid grid-cols-7 text-xs text-slate-500">
                            {["Sen", "Sel", "Rab", "Kam", "Jum", "Sab", "Min"].map((d) => (
                              <div key={d} className="py-1 text-center">
                                {d}
                              </div>
                            ))}
                          </div>
                          <div className="grid grid-cols-7 gap-1">
                            {cells.map((d, i) => {
                              const outMonth = d.getMonth() !== view.getMonth();
                              const disabled = isDisabledDay(d);
                              const isStart = sameDay(d, startD);
                              const isEnd = sameDay(d, endD);
                              const isBetween = inRange(d, startD, endD) && !isStart && !isEnd;

                              const cls =
                                "h-8 rounded-md text-sm flex items-center justify-center transition " +
                                (disabled
                                  ? "opacity-40 cursor-not-allowed"
                                  : "cursor-pointer hover:bg-slate-100 dark:hover:bg-slate-800 ") +
                                (outMonth ? "text-slate-400 " : "") +
                                (isStart || isEnd
                                  ? "bg-sky-500 text-white "
                                  : isBetween
                                    ? "bg-sky-100 text-sky-900 dark:bg-sky-400/20 "
                                    : "");

                              return (
                                <button
                                  key={i}
                                  type="button"
                                  className={cls}
                                  onClick={() => onPickDay(d)}
                                  disabled={disabled}
                                >
                                  {d.getDate()}
                                </button>
                              );
                            })}
                          </div>

                          {mode === "datetime" && (
                            <div className="mt-3 grid grid-cols-2 gap-3">
                              <div>
                                <div className="mb-1 text-xs font-medium">Mulai</div>
                                <div className="flex gap-2">
                                  <select
                                    className="rounded-lg border border-slate-300 bg-white px-2 py-1 text-sm dark:border-slate-700 dark:bg-slate-900"
                                    value={startD ? startD.getHours() : 0}
                                    onChange={(e) =>
                                      setTime(
                                        "start",
                                        Number(e.target.value),
                                        startD ? startD.getMinutes() : 0
                                      )
                                    }
                                    disabled={!startD}
                                  >
                                    {hours.map((h) => (
                                      <option key={h} value={h}>
                                        {`${h}`.padStart(2, "0")}
                                      </option>
                                    ))}
                                  </select>
                                  <select
                                    className="rounded-lg border border-slate-300 bg-white px-2 py-1 text-sm dark:border-slate-700 dark:bg-slate-900"
                                    value={
                                      startD ? Math.floor(startD.getMinutes() / step) * step : 0
                                    }
                                    onChange={(e) =>
                                      setTime(
                                        "start",
                                        startD ? startD.getHours() : 0,
                                        Number(e.target.value)
                                      )
                                    }
                                    disabled={!startD}
                                  >
                                    {minutes.map((m) => (
                                      <option key={m} value={m}>
                                        {`${m}`.padStart(2, "0")}
                                      </option>
                                    ))}
                                  </select>
                                </div>
                              </div>
                              <div>
                                <div className="mb-1 text-xs font-medium">Selesai</div>
                                <div className="flex gap-2">
                                  <select
                                    className="rounded-lg border border-slate-300 bg-white px-2 py-1 text-sm dark:border-slate-700 dark:bg-slate-900"
                                    value={endD ? endD.getHours() : 0}
                                    onChange={(e) =>
                                      setTime(
                                        "end",
                                        Number(e.target.value),
                                        endD ? endD.getMinutes() : 0
                                      )
                                    }
                                    disabled={!endD}
                                  >
                                    {hours.map((h) => (
                                      <option key={h} value={h}>
                                        {`${h}`.padStart(2, "0")}
                                      </option>
                                    ))}
                                  </select>
                                  <select
                                    className="rounded-lg border border-slate-300 bg-white px-2 py-1 text-sm dark:border-slate-700 dark:bg-slate-900"
                                    value={endD ? Math.floor(endD.getMinutes() / step) * step : 0}
                                    onChange={(e) =>
                                      setTime(
                                        "end",
                                        endD ? endD.getHours() : 0,
                                        Number(e.target.value)
                                      )
                                    }
                                    disabled={!endD}
                                  >
                                    {minutes.map((m) => (
                                      <option key={m} value={m}>
                                        {`${m}`.padStart(2, "0")}
                                      </option>
                                    ))}
                                  </select>
                                </div>
                              </div>
                            </div>
                          )}

                          <div className="mt-3 flex justify-end gap-2">
                            <button
                              type="button"
                              className="rounded-lg border border-slate-300 px-3 py-1.5 text-sm hover:bg-slate-50 dark:border-slate-700 dark:hover:bg-slate-800"
                              onClick={() => {
                                rhf.onChange({});
                                setOpen(false);
                              }}
                            >
                              Reset
                            </button>
                            <button
                              type="button"
                              className="rounded-lg bg-sky-600 px-3 py-1.5 text-sm text-white hover:bg-sky-500"
                              onClick={() => setOpen(false)}
                            >
                              Selesai
                            </button>
                          </div>
                        </div>
                      </div>
                    </Portal>
                  ) : (
                    <div className={`absolute z-30 mt-1 w-[320px] p-3 ${th.popover}`}>
                      <div
                        ref={popRef}
                        role="dialog"
                        aria-modal="true"
                        className="absolute z-30 mt-1 w-[320px] rounded-xl border border-slate-200 bg-white p-3 shadow-lg ring-1 ring-black/5 dark:border-slate-700 dark:bg-slate-900"
                      >
                        {/* Header bulan */}
                        <div className="mb-2 flex items-center justify-between">
                          <button
                            type="button"
                            className="rounded p-1 hover:bg-slate-100 dark:hover:bg-slate-800"
                            onClick={() => setView((v) => addMonths(v, -1))}
                            aria-label="Bulan sebelumnya"
                          >
                            <FaChevronLeft />
                          </button>
                          <div className="text-sm font-medium">
                            {view.toLocaleDateString(undefined, { month: "long", year: "numeric" })}
                          </div>
                          <button
                            type="button"
                            className="rounded p-1 hover:bg-slate-100 dark:hover:bg-slate-800"
                            onClick={() => setView((v) => addMonths(v, +1))}
                            aria-label="Bulan berikutnya"
                          >
                            <FaChevronRight />
                          </button>
                        </div>

                        <div className="mb-1 grid grid-cols-7 text-xs text-slate-500">
                          {["Sen", "Sel", "Rab", "Kam", "Jum", "Sab", "Min"].map((d) => (
                            <div key={d} className="py-1 text-center">
                              {d}
                            </div>
                          ))}
                        </div>
                        <div className="grid grid-cols-7 gap-1">
                          {cells.map((d, i) => {
                            const outMonth = d.getMonth() !== view.getMonth();
                            const disabled = isDisabledDay(d);
                            const isStart = sameDay(d, startD);
                            const isEnd = sameDay(d, endD);
                            const isBetween = inRange(d, startD, endD) && !isStart && !isEnd;

                            const cls =
                              "h-8 rounded-md text-sm flex items-center justify-center transition " +
                              (disabled
                                ? "opacity-40 cursor-not-allowed"
                                : "cursor-pointer hover:bg-slate-100 dark:hover:bg-slate-800 ") +
                              (outMonth ? "text-slate-400 " : "") +
                              (isStart || isEnd
                                ? "bg-sky-500 text-white "
                                : isBetween
                                  ? "bg-sky-100 text-sky-900 dark:bg-sky-400/20 "
                                  : "");

                            return (
                              <button
                                key={i}
                                type="button"
                                className={cls}
                                onClick={() => onPickDay(d)}
                                disabled={disabled}
                              >
                                {d.getDate()}
                              </button>
                            );
                          })}
                        </div>

                        {mode === "datetime" && (
                          <div className="mt-3 grid grid-cols-2 gap-3">
                            <div>
                              <div className="mb-1 text-xs font-medium">Mulai</div>
                              <div className="flex gap-2">
                                <select
                                  className="rounded-lg border border-slate-300 bg-white px-2 py-1 text-sm dark:border-slate-700 dark:bg-slate-900"
                                  value={startD ? startD.getHours() : 0}
                                  onChange={(e) =>
                                    setTime(
                                      "start",
                                      Number(e.target.value),
                                      startD ? startD.getMinutes() : 0
                                    )
                                  }
                                  disabled={!startD}
                                >
                                  {hours.map((h) => (
                                    <option key={h} value={h}>
                                      {`${h}`.padStart(2, "0")}
                                    </option>
                                  ))}
                                </select>
                                <select
                                  className="rounded-lg border border-slate-300 bg-white px-2 py-1 text-sm dark:border-slate-700 dark:bg-slate-900"
                                  value={startD ? Math.floor(startD.getMinutes() / step) * step : 0}
                                  onChange={(e) =>
                                    setTime(
                                      "start",
                                      startD ? startD.getHours() : 0,
                                      Number(e.target.value)
                                    )
                                  }
                                  disabled={!startD}
                                >
                                  {minutes.map((m) => (
                                    <option key={m} value={m}>
                                      {`${m}`.padStart(2, "0")}
                                    </option>
                                  ))}
                                </select>
                              </div>
                            </div>
                            <div>
                              <div className="mb-1 text-xs font-medium">Selesai</div>
                              <div className="flex gap-2">
                                <select
                                  className="rounded-lg border border-slate-300 bg-white px-2 py-1 text-sm dark:border-slate-700 dark:bg-slate-900"
                                  value={endD ? endD.getHours() : 0}
                                  onChange={(e) =>
                                    setTime(
                                      "end",
                                      Number(e.target.value),
                                      endD ? endD.getMinutes() : 0
                                    )
                                  }
                                  disabled={!endD}
                                >
                                  {hours.map((h) => (
                                    <option key={h} value={h}>
                                      {`${h}`.padStart(2, "0")}
                                    </option>
                                  ))}
                                </select>
                                <select
                                  className="rounded-lg border border-slate-300 bg-white px-2 py-1 text-sm dark:border-slate-700 dark:bg-slate-900"
                                  value={endD ? Math.floor(endD.getMinutes() / step) * step : 0}
                                  onChange={(e) =>
                                    setTime(
                                      "end",
                                      endD ? endD.getHours() : 0,
                                      Number(e.target.value)
                                    )
                                  }
                                  disabled={!endD}
                                >
                                  {minutes.map((m) => (
                                    <option key={m} value={m}>
                                      {`${m}`.padStart(2, "0")}
                                    </option>
                                  ))}
                                </select>
                              </div>
                            </div>
                          </div>
                        )}

                        <div className="mt-3 flex justify-end gap-2">
                          <button
                            type="button"
                            className="rounded-lg border border-slate-300 px-3 py-1.5 text-sm hover:bg-slate-50 dark:border-slate-700 dark:hover:bg-slate-800"
                            onClick={() => {
                              rhf.onChange({});
                              setOpen(false);
                            }}
                          >
                            Reset
                          </button>
                          <button
                            type="button"
                            className="rounded-lg bg-sky-600 px-3 py-1.5 text-sm text-white hover:bg-sky-500"
                            onClick={() => setOpen(false)}
                          >
                            Selesai
                          </button>
                        </div>
                      </div>
                    </div>
                  ))}
              </div>

              {/* helper / error */}
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
