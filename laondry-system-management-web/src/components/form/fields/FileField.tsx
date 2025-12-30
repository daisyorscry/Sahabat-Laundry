"use client";

import { useEffect, useMemo, useRef, useState } from "react";
import { Control, Controller, FieldValues } from "react-hook-form";
import { FaCircleExclamation, FaFile, FaMagnifyingGlass, FaXmark } from "react-icons/fa6";

import { FileAsset, FileField } from "../types";

type Props<T extends FieldValues> = { control: Control<T>; field: FileField<T> };

const isFile = (x: unknown): x is File => typeof File !== "undefined" && x instanceof File;

function formatBytes(n?: number) {
  if (n == null) return "";
  const units = ["B", "KB", "MB", "GB"];
  let i = 0,
    v = n;
  while (v >= 1024 && i < units.length - 1) {
    v /= 1024;
    i++;
  }
  return `${v.toFixed(v < 10 && i > 0 ? 1 : 0)} ${units[i]}`;
}

function normalizeExt(s: string) {
  const t = s.trim().toLowerCase();
  if (!t) return t;
  return t.startsWith(".") ? t : `.${t}`;
}
function splitAccept(s?: string) {
  return s
    ? s
        .split(",")
        .map((x) => x.trim())
        .filter(Boolean)
    : [];
}

function buildAcceptCandidates(field: FileField<any>) {
  const set = new Set<string>();
  splitAccept(field.accept).forEach((x) => set.add(x));
  if (field.images === true) set.add("image/*");
  else if (Array.isArray(field.images)) {
    field.images.forEach((x) => {
      if (!x) return;
      if (x.includes("/")) set.add(x.toLowerCase());
      else set.add(normalizeExt(x));
    });
  }
  (field.allowedMimes ?? []).forEach((m) => m && set.add(m.toLowerCase()));
  (field.allowedExts ?? []).forEach((e) => e && set.add(normalizeExt(e)));
  return Array.from(set.values());
}

function isImageFile(f: File) {
  return f.type.startsWith("image/");
}
function matchFileAgainstAllowed(file: File, allowed: string[]) {
  if (allowed.length === 0) return true;
  const mime = file.type.toLowerCase();
  const ext = normalizeExt(file.name.split(".").pop() ?? "");
  for (const a of allowed) {
    if (!a) continue;
    if (a.includes("/")) {
      if (a.endsWith("/*")) {
        const prefix = a.slice(0, a.indexOf("/*"));
        if (mime.startsWith(prefix + "/")) return true;
      } else if (mime === a) return true;
    } else if (a.startsWith(".")) {
      if (ext === a) return true;
    }
  }
  return false;
}

async function assetToFile(asset: FileAsset): Promise<File> {
  const fileName = (() => {
    try {
      const u = new URL(asset.url, window.location.href);
      const last = u.pathname.split("/").filter(Boolean).pop() ?? asset.label;
      return decodeURIComponent(last);
    } catch {
      return asset.label;
    }
  })();
  const res = await fetch(asset.url, { credentials: "omit" });
  if (!res.ok) throw new Error(`Fetch gagal: ${res.status}`);
  const blob = await res.blob();
  const mime = asset.mime || blob.type || "application/octet-stream";
  return new File([blob], fileName, { type: mime });
}

export default function FileFieldComp<T extends FieldValues>({ control, field }: Props<T>) {
  const id = String(field.name);
  const helpId = `${id}__help`;
  const errId = `${id}__error`;

  const inputRef = useRef<HTMLInputElement | null>(null);
  const acceptCandidates = useMemo(() => buildAcceptCandidates(field), [field]);

  const [q, setQ] = useState("");
  const [assets, setAssets] = useState<FileAsset[]>(field.assets ?? []);
  const [loading, setLoading] = useState(false);
  const debounceMs = field.debounceMs ?? 300;
  const isLibrary = field.source === "library";

  useEffect(() => {
    if (!isLibrary || !field.loadAssets) return;
    const ctrl = new AbortController();
    const t = setTimeout(async () => {
      setLoading(true);
      try {
        const data = await field.loadAssets!(q, ctrl.signal);
        setAssets(Array.isArray(data) ? data : []);
      } catch {}
      setLoading(false);
    }, debounceMs);
    return () => {
      ctrl.abort();
      clearTimeout(t);
    };
  }, [isLibrary, field, q, debounceMs]);

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

          const valueFiles: File[] = useMemo(() => {
            const v = rhf.value as unknown;
            if (v == null) return [];
            if (Array.isArray(v)) return v.filter(isFile);
            return isFile(v) ? [v] : [];
          }, [rhf.value]);

          const canAddMore = field.multiple
            ? field.maxFiles
              ? valueFiles.length < field.maxFiles
              : true
            : valueFiles.length === 0;

          const borderCls =
            (invalid
              ? "border-rose-500/70 focus-within:border-rose-500 focus-within:ring-2 focus-within:ring-rose-200/60 dark:focus-within:ring-rose-500/20"
              : "border-slate-300 hover:border-slate-400 focus-within:border-sky-500 focus-within:ring-2 focus-within:ring-sky-200/60 dark:border-slate-700 dark:hover:border-slate-600 dark:focus-within:border-sky-400 dark:focus-within:ring-sky-500/20") +
            " focus:ring-offset-0";

          const [selectErrors, setSelectErrors] = useState<string[]>([]);

          const validateAndAddFiles = (picked: File[]) => {
            const errs: string[] = [];
            const allowed = acceptCandidates;

            const room = field.multiple
              ? field.maxFiles
                ? Math.max(0, field.maxFiles - valueFiles.length)
                : Infinity
              : valueFiles.length === 0
                ? 1
                : 0;

            if (picked.length > room)
              errs.push(`Terpilih ${picked.length} file, dibatasi ${room} file.`);

            const accepted: File[] = [];
            for (const f of picked.slice(0, room)) {
              if (allowed.length && !matchFileAgainstAllowed(f, allowed)) {
                errs.push(`Tipe tidak diizinkan: ${f.name} (${f.type || "unknown"})`);
                continue;
              }
              if (field.minBytes && f.size < field.minBytes) {
                errs.push(
                  `Terlalu kecil: ${f.name} (${formatBytes(f.size)}) < ${formatBytes(field.minBytes)}`
                );
                continue;
              }
              if (field.maxBytes && f.size > field.maxBytes) {
                errs.push(
                  `Terlalu besar: ${f.name} (${formatBytes(f.size)}) > ${formatBytes(field.maxBytes)}`
                );
                continue;
              }
              accepted.push(f);
            }

            setSelectErrors(errs);
            if (!accepted.length) return;

            if (field.multiple) rhf.onChange([...valueFiles, ...accepted]);
            else rhf.onChange(accepted[0]);
          };

          const handleRemove = (idx: number) => {
            if (field.multiple) {
              const next = valueFiles.slice();
              next.splice(idx, 1);
              rhf.onChange(next);
            } else {
              rhf.onChange(null);
              if (inputRef.current) inputRef.current.value = "";
            }
          };

          if (isLibrary) {
            return (
              <>
                <div className="mb-1 flex flex-wrap items-center gap-2">
                  {field.searchable && (field.loadAssets || assets.length > 8) && (
                    <div className="relative">
                      <FaMagnifyingGlass className="pointer-events-none absolute top-1/2 left-2 h-3.5 w-3.5 -translate-y-1/2 text-slate-400" />
                      <input
                        value={q}
                        onChange={(e) => setQ(e.target.value)}
                        placeholder="Cari file…"
                        className="h-9 w-56 rounded-lg border border-slate-300 bg-white pr-2 pl-7 text-sm dark:border-slate-700 dark:bg-slate-900"
                      />
                    </div>
                  )}
                  <div className="text-xs text-slate-500 dark:text-slate-400">
                    {field.minBytes ? `Min ${formatBytes(field.minBytes)} · ` : ""}
                    {field.maxBytes ? `Max ${formatBytes(field.maxBytes)}` : ""}
                    {field.maxFiles ? ` · Maks ${field.maxFiles} file` : ""}
                  </div>
                </div>

                <div
                  className={`rounded-xl border bg-white/90 p-2 dark:bg-slate-900/70 ${borderCls}`}
                >
                  {loading ? (
                    <div className="px-2 py-6 text-sm text-slate-500">Memuat…</div>
                  ) : assets.length === 0 ? (
                    <div className="px-2 py-6 text-sm text-slate-500">Tidak ada file.</div>
                  ) : (
                    <div className="grid grid-cols-1 gap-2 sm:grid-cols-2">
                      {assets.map((a) => {
                        const predictedName = (() => {
                          try {
                            const u = new URL(a.url, window.location.href);
                            return decodeURIComponent(
                              u.pathname.split("/").filter(Boolean).pop() ?? a.label
                            );
                          } catch {
                            return a.label;
                          }
                        })();
                        const already = valueFiles.some((f) => f.name === predictedName);

                        return (
                          <div
                            key={String(a.id)}
                            className="flex items-center gap-3 rounded-lg border border-slate-200 p-2 dark:border-slate-700"
                          >
                            <div className="h-12 w-12 overflow-hidden rounded bg-slate-100 dark:bg-slate-800">
                              {a.thumb || (a.mime?.startsWith("image/") ?? false) ? (
                                <img
                                  src={a.thumb || a.url}
                                  alt={a.label}
                                  className="h-full w-full object-cover"
                                />
                              ) : (
                                <div className="flex h-full w-full items-center justify-center text-slate-400 dark:text-slate-500">
                                  <FaFile />
                                </div>
                              )}
                            </div>
                            <div className="min-w-0 flex-1">
                              <div className="truncate text-sm text-slate-800 dark:text-slate-200">
                                {a.label}
                              </div>
                              <div className="text-[12px] text-slate-500 dark:text-slate-400">
                                {a.mime || "unknown"} {a.size ? `· ${formatBytes(a.size)}` : ""}
                              </div>
                            </div>

                            {already ? (
                              <button
                                type="button"
                                className="ml-auto inline-flex h-7 items-center justify-center rounded-md px-2 text-xs text-slate-600 hover:bg-slate-100 dark:text-slate-300 dark:hover:bg-slate-800"
                                onClick={() => {
                                  const idx = valueFiles.findIndex((f) => f.name === predictedName);
                                  if (idx >= 0) handleRemove(idx);
                                }}
                              >
                                Hapus
                              </button>
                            ) : (
                              <button
                                type="button"
                                disabled={!canAddMore}
                                className="ml-auto inline-flex h-7 items-center justify-center rounded-md bg-sky-600 px-2 text-xs text-white hover:bg-sky-700 disabled:cursor-not-allowed disabled:opacity-50 dark:bg-sky-600 dark:hover:bg-sky-500"
                                onClick={async () => {
                                  try {
                                    const file = await assetToFile(a);
                                    validateAndAddFiles([file]);
                                  } catch (e) {
                                    setSelectErrors((prev) => [
                                      ...prev,
                                      `Gagal mengambil file: ${a.label}`,
                                    ]);
                                  }
                                }}
                              >
                                Tambah
                              </button>
                            )}
                          </div>
                        );
                      })}
                    </div>
                  )}

                  {selectErrors.length > 0 && (
                    <ul className="mt-2 list-disc space-y-1 pl-5 text-[12px] text-rose-600 dark:text-rose-400">
                      {selectErrors.map((e, i) => (
                        <li key={i}>{e}</li>
                      ))}
                    </ul>
                  )}

                  {valueFiles.length > 0 && (
                    <div className="mt-3 space-y-2">
                      {field.multiple ? (
                        <div className="grid grid-cols-1 gap-2 sm:grid-cols-2">
                          {valueFiles.map((f, i) => {
                            const isImg = isImageFile(f);
                            return (
                              <div
                                key={i}
                                className="group flex items-center gap-3 rounded-lg border border-slate-200 p-2 dark:border-slate-700"
                              >
                                <div className="h-12 w-12 overflow-hidden rounded bg-slate-100 dark:bg-slate-800">
                                  {isImg ? (
                                    <img
                                      src={URL.createObjectURL(f)}
                                      onLoad={(e) =>
                                        URL.revokeObjectURL((e.target as HTMLImageElement).src)
                                      }
                                      alt={f.name}
                                      className="h-full w-full object-cover"
                                    />
                                  ) : (
                                    <div className="flex h-full w-full items-center justify-center text-slate-400 dark:text-slate-500">
                                      <FaFile />
                                    </div>
                                  )}
                                </div>
                                <div className="min-w-0 flex-1">
                                  <div className="truncate text-sm text-slate-800 dark:text-slate-200">
                                    {f.name}
                                  </div>
                                  <div className="text-[12px] text-slate-500 dark:text-slate-400">
                                    {f.type || "unknown"} · {formatBytes(f.size)}
                                  </div>
                                </div>
                                <button
                                  type="button"
                                  className="ml-auto inline-flex h-7 w-7 items-center justify-center rounded-md text-slate-500 hover:bg-slate-100 hover:text-slate-700 dark:text-slate-400 dark:hover:bg-slate-800 dark:hover:text-slate-200"
                                  title="Hapus"
                                  onClick={() => handleRemove(i)}
                                >
                                  <FaXmark />
                                </button>
                              </div>
                            );
                          })}
                        </div>
                      ) : (
                        <div className="group flex items-center gap-3 rounded-lg border border-slate-200 p-2 dark:border-slate-700">
                          {(() => {
                            const f = valueFiles[0];
                            const isImg = isImageFile(f);
                            return (
                              <>
                                <div className="h-12 w-12 overflow-hidden rounded bg-slate-100 dark:bg-slate-800">
                                  {isImg ? (
                                    <img
                                      src={URL.createObjectURL(f)}
                                      onLoad={(e) =>
                                        URL.revokeObjectURL((e.target as HTMLImageElement).src)
                                      }
                                      alt={f.name}
                                      className="h-full w-full object-cover"
                                    />
                                  ) : (
                                    <div className="flex h-full w-full items-center justify-center text-slate-400 dark:text-slate-500">
                                      <FaFile />
                                    </div>
                                  )}
                                </div>
                                <div className="min-w-0 flex-1">
                                  <div className="truncate text-sm text-slate-800 dark:text-slate-200">
                                    {f.name}
                                  </div>
                                  <div className="text-[12px] text-slate-500 dark:text-slate-400">
                                    {f.type || "unknown"} · {formatBytes(f.size)}
                                  </div>
                                </div>
                                <button
                                  type="button"
                                  className="ml-auto inline-flex h-7 w-7 items-center justify-center rounded-md text-slate-500 hover:bg-slate-100 hover:text-slate-700 dark:text-slate-400 dark:hover:bg-slate-800 dark:hover:text-slate-200"
                                  title="Hapus"
                                  onClick={() => handleRemove(0)}
                                >
                                  <FaXmark />
                                </button>
                              </>
                            );
                          })()}
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
                    className="inline-flex items-center gap-1 text-[12px] font-medium text-rose-600 dark:text-rose-400"
                  >
                    <FaCircleExclamation /> {fieldState.error!.message}
                  </small>
                )}
              </>
            );
          }

          const handleSelect = (files: FileList | null) => {
            if (!files) return;
            const arr = Array.from(files);
            const allowed = acceptCandidates;
            const errs: string[] = [];
            const picked: File[] = [];

            const room = field.multiple
              ? field.maxFiles
                ? Math.max(0, field.maxFiles - valueFiles.length)
                : Infinity
              : valueFiles.length === 0
                ? 1
                : 0;
            if (arr.length > room) errs.push(`Terpilih ${arr.length} file, dibatasi ${room} file.`);

            for (const f of arr.slice(0, room)) {
              if (allowed.length && !matchFileAgainstAllowed(f, allowed)) {
                errs.push(`Tipe tidak diizinkan: ${f.name} (${f.type || "unknown"})`);
                continue;
              }
              if (field.minBytes && f.size < field.minBytes) {
                errs.push(
                  `Terlalu kecil: ${f.name} (${formatBytes(f.size)}) < ${formatBytes(field.minBytes)}`
                );
                continue;
              }
              if (field.maxBytes && f.size > field.maxBytes) {
                errs.push(
                  `Terlalu besar: ${f.name} (${formatBytes(f.size)}) > ${formatBytes(field.maxBytes)}`
                );
                continue;
              }
              picked.push(f);
            }
            setSelectErrors(errs);
            if (!picked.length) return;
            if (field.multiple) rhf.onChange([...valueFiles, ...picked]);
            else rhf.onChange(picked[0]);
          };

          const currentAcceptAttr = acceptCandidates.length
            ? acceptCandidates.join(",")
            : undefined;

          return (
            <>
              <div className="mb-1 text-xs text-slate-500 dark:text-slate-400">
                {field.minBytes ? `Min ${formatBytes(field.minBytes)} · ` : ""}
                {field.maxBytes ? `Max ${formatBytes(field.maxBytes)}` : ""}
                {field.maxFiles ? ` · Maks ${field.maxFiles} file` : ""}
              </div>

              <div
                className={`rounded-xl border bg-white/90 dark:bg-slate-900/70 ${borderCls} p-2`}
              >
                <input
                  ref={inputRef}
                  id={id}
                  type="file"
                  accept={currentAcceptAttr}
                  multiple={field.multiple}
                  disabled={field.disabled || !canAddMore}
                  onChange={(e) => handleSelect(e.target.files)}
                  onBlur={rhf.onBlur}
                  aria-invalid={invalid}
                  aria-describedby={invalid ? errId : field.helperText ? helpId : undefined}
                  className="block w-full text-sm file:mr-3 file:rounded-lg file:border-0 file:bg-slate-800 file:px-3 file:py-2 file:text-sm file:font-medium file:text-white hover:file:bg-slate-700 dark:file:bg-slate-200 dark:file:text-slate-900 dark:hover:file:bg-white"
                />

                {selectErrors.length > 0 && (
                  <ul className="mt-2 list-disc space-y-1 pl-5 text-[12px] text-rose-600 dark:text-rose-400">
                    {selectErrors.map((e, i) => (
                      <li key={i}>{e}</li>
                    ))}
                  </ul>
                )}

                {valueFiles.length > 0 && (
                  <div className="mt-3 space-y-2">
                    {valueFiles.map((f, i) => {
                      const isImg = isImageFile(f);
                      return (
                        <div
                          key={i}
                          className="group flex items-center gap-3 rounded-lg border border-slate-200 p-2 dark:border-slate-700"
                        >
                          <div className="h-12 w-12 overflow-hidden rounded bg-slate-100 dark:bg-slate-800">
                            {isImg ? (
                              <img
                                src={URL.createObjectURL(f)}
                                onLoad={(e) =>
                                  URL.revokeObjectURL((e.target as HTMLImageElement).src)
                                }
                                alt={f.name}
                                className="h-full w-full object-cover"
                              />
                            ) : (
                              <div className="flex h-full w-full items-center justify-center text-slate-400 dark:text-slate-500">
                                <FaFile />
                              </div>
                            )}
                          </div>
                          <div className="min-w-0 flex-1">
                            <div className="truncate text-sm text-slate-800 dark:text-slate-200">
                              {f.name}
                            </div>
                            <div className="text-[12px] text-slate-500 dark:text-slate-400">
                              {f.type || "unknown"} · {formatBytes(f.size)}
                            </div>
                          </div>
                          <button
                            type="button"
                            className="ml-auto inline-flex h-7 w-7 items-center justify-center rounded-md text-slate-500 hover:bg-slate-100 hover:text-slate-700 dark:text-slate-400 dark:hover:bg-slate-800 dark:hover:text-slate-200"
                            title="Hapus"
                            onClick={() => handleRemove(i)}
                          >
                            <FaXmark />
                          </button>
                        </div>
                      );
                    })}
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
                  className="inline-flex items-center gap-1 text-[12px] font-medium text-rose-600 dark:text-rose-400"
                >
                  <FaCircleExclamation /> {fieldState.error!.message}
                </small>
              )}
            </>
          );
        }}
      />
    </div>
  );
}
