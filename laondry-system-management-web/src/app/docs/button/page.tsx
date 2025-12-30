"use client";

import clsx from "clsx";
import { useMemo, useState } from "react";

import Button from "@/components/button/Button";

function IconCheck() {
  return (
    <svg width="18" height="18" viewBox="0 0 24 24" aria-hidden="true" className="shrink-0">
      <path fill="currentColor" d="M9 16.2 4.8 12l-1.4 1.4L9 19 21 7l-1.4-1.4z" />
    </svg>
  );
}
function IconArrowRight() {
  return (
    <svg width="18" height="18" viewBox="0 0 24 24" aria-hidden="true" className="shrink-0">
      <path fill="currentColor" d="M12 4l1.41 1.41L8.83 10H20v2H8.83l4.58 4.59L12 18l-8-8z" />
    </svg>
  );
}

const VARIANTS = ["solid", "outline", "ghost", "link", "soft"] as const;
const TONES = ["primary", "secondary", "success", "warning", "danger", "neutral"] as const;
const SIZES = ["sm", "md", "lg"] as const;
const ROUNDED_SIZES = ["none", "sm", "md", "lg", "xl", "2xl", "3xl", "full"] as const;

type Variant = (typeof VARIANTS)[number];
type Tone = (typeof TONES)[number];
type Size = (typeof SIZES)[number];
type RoundedSize = (typeof ROUNDED_SIZES)[number];

const WEIGHTS = ["light", "normal", "medium", "semibold", "bold", "extrabold"] as const;
type FontWeight = (typeof WEIGHTS)[number];

export default function ButtonDocsPage() {
  // Playground states
  const [label, setLabel] = useState<string>("Button");
  const [variant, setVariant] = useState<Variant>("solid");
  const [tone, setTone] = useState<Tone>("primary");
  const [size, setSize] = useState<Size>("md");
  const [block, setBlock] = useState<boolean>(false);

  // Rounded controls
  const [rounded, setRounded] = useState<string>(""); // legacy override class
  const [roundedSize, setRoundedSize] = useState<RoundedSize | "">(""); // new enum (kosong = default dari size)

  const [leftIcon, setLeftIcon] = useState<boolean>(false);
  const [rightIcon, setRightIcon] = useState<boolean>(false);
  const [loading, setLoading] = useState<boolean>(false);
  const [loadingText, setLoadingText] = useState<string>("");

  const [href, setHref] = useState<string>("");
  const [asEl, setAsEl] = useState<"button" | "a" | "">("");

  const [debounceMs, setDebounceMs] = useState<number>(300);
  const [disabled, setDisabled] = useState<boolean>(false);
  const [className, setClassName] = useState<string>("");

  // font controls
  const [fontWeight, setFontWeight] = useState<FontWeight>("medium");
  const [italic, setItalic] = useState(false);
  const [underline, setUnderline] = useState(false);
  const [strike, setStrike] = useState(false);
  const [uppercase, setUppercase] = useState(false);

  const preview = useMemo(() => {
    const common = {
      variant,
      tone,
      size,
      block,
      // Prioritas radius di komponen: rounded (string) > roundedSize (enum) > default by size
      rounded: rounded || undefined,
      roundedSize: (roundedSize || undefined) as any,
      loading,
      loadingText: loadingText || undefined,
      debounceMs,
      disabled,
      className: className || undefined,
      href: href || undefined,
      as: (asEl || undefined) as any,
      leftIcon: leftIcon ? <IconCheck /> : undefined,
      rightIcon: rightIcon ? <IconArrowRight /> : undefined,
      fontWeight,
      italic,
      underline,
      strike,
      uppercase,
      onClick: () => console.log("clicked"),
    } as const;

    return (
      <div className={clsx(block ? "" : "w-[360px]")}>
        <div className="flex flex-wrap items-center gap-3">
          <Button {...common}>{label}</Button>

          {/* contoh gaya pill */}
          <Button
            variant="soft"
            tone="primary"
            roundedSize="full"
            className="px-4"
            fontWeight={fontWeight}
            italic={italic}
            underline={underline}
            strike={strike}
            uppercase={uppercase}
          >
            Appointment
          </Button>
        </div>
      </div>
    );
  }, [
    variant,
    tone,
    size,
    block,
    rounded,
    roundedSize,
    loading,
    loadingText,
    debounceMs,
    disabled,
    className,
    href,
    asEl,
    leftIcon,
    rightIcon,
    label,
    fontWeight,
    italic,
    underline,
    strike,
    uppercase,
  ]);

  const card =
    "rounded-2xl border border-slate-200 bg-white dark:border-slate-700 dark:bg-slate-900";
  const labelCls = "block text-xs font-medium mb-1 text-slate-700 dark:text-slate-300";
  const inputCls =
    "w-full h-9 px-3 rounded-lg border bg-white text-slate-900 " +
    "border-slate-300 placeholder:text-slate-400 " +
    "dark:bg-slate-900 dark:text-slate-100 dark:border-slate-600 dark:placeholder:text-slate-500";

  return (
    <div className="space-y-8 p-6">
      <header className="space-y-1">
        <h1 className="text-2xl font-semibold tracking-tight text-slate-900 dark:text-slate-100">
          Button – Dokumentasi
        </h1>
        <p className="text-sm text-slate-600 dark:text-slate-400">
          Komponen tombol reusable untuk Next.js + Tailwind. Coba semua props di playground di
          bawah.
        </p>
      </header>


      {/* Playground */}
      <section className="grid grid-cols-1 gap-6 md:grid-cols-3 lg:grid-cols-3">
        <div className="space-y-4 md:col-span-2">
          <div className={clsx(card, "p-4")}>
            <h2 className="mb-3 font-semibold text-slate-900 dark:text-slate-100">Preview</h2>
            <div className="flex min-h-[88px] items-center">{preview}</div>
          </div>

          {/* Showcase: semua variant × tone */}
          <div className={clsx(card, "p-4")}>
            <h3 className="mb-3 font-semibold text-slate-900 dark:text-slate-100">
              Semua Variant × Tone (size: md)
            </h3>
            <div className="space-y-3">
              {VARIANTS.map((v) => (
                <div key={v} className="space-y-2">
                  <div className="text-xs tracking-wide text-slate-500 uppercase dark:text-slate-400">
                    {v}
                  </div>
                  <div className="grid grid-cols-2 gap-2 md:grid-cols-3 lg:grid-cols-6">
                    {TONES.map((t) => (
                      <Button key={`${v}-${t}`} variant={v} tone={t}>
                        {t}
                      </Button>
                    ))}
                  </div>
                </div>
              ))}
            </div>
          </div>

          {/* Showcase: size */}
          <div className={clsx(card, "p-4")}>
            <h3 className="mb-3 font-semibold text-slate-900 dark:text-slate-100">Ukuran</h3>
            <div className="flex flex-wrap gap-2">
              {SIZES.map((s) => (
                <Button key={s} size={s}>
                  {s}
                </Button>
              ))}
            </div>
          </div>

          {/* Showcase: roundedSize */}
          <div className={clsx(card, "p-4")}>
            <h3 className="mb-3 font-semibold text-slate-900 dark:text-slate-100">Rounded Size</h3>
            <div className="flex flex-wrap gap-2">
              {ROUNDED_SIZES.map((rs) => (
                <Button key={rs} roundedSize={rs as RoundedSize}>
                  {rs}
                </Button>
              ))}
              {/* contoh override class lama tetap berlaku */}
              <Button rounded="rounded-[14px]">rounded-[14px]</Button>
            </div>
          </div>
        </div>

        {/* Controls */}
        <aside className="space-y-4">
          <div className={clsx(card, "p-4")}>
            <h2 className="mb-3 font-semibold text-slate-900 dark:text-slate-100">Controls</h2>

            <div className="grid grid-cols-1 gap-3">
              <div>
                <label className={labelCls}>Label (children)</label>
                <input
                  value={label}
                  onChange={(e) => setLabel(e.target.value)}
                  className={inputCls}
                />
              </div>

              <div className="grid grid-cols-2 gap-3">
                <div>
                  <label className={labelCls}>Variant</label>
                  <select
                    value={variant}
                    onChange={(e) => setVariant(e.target.value as Variant)}
                    className={inputCls}
                  >
                    {VARIANTS.map((v) => (
                      <option key={v} value={v}>
                        {v}
                      </option>
                    ))}
                  </select>
                </div>
                <div>
                  <label className={labelCls}>Tone</label>
                  <select
                    value={tone}
                    onChange={(e) => setTone(e.target.value as Tone)}
                    className={inputCls}
                  >
                    {TONES.map((t) => (
                      <option key={t} value={t}>
                        {t}
                      </option>
                    ))}
                  </select>
                </div>
              </div>

              <div>
                <label className={labelCls}>Size</label>
                <div className="flex gap-2">
                  {SIZES.map((s) => (
                    <button
                      key={s}
                      className={clsx(
                        "h-8 rounded-md border px-3 text-xs transition",
                        size === s
                          ? "border-slate-900 bg-slate-900 text-white dark:border-slate-100 dark:bg-slate-100 dark:text-slate-900"
                          : "border-slate-300 bg-white text-slate-800 hover:bg-slate-50 dark:border-slate-600 dark:bg-slate-900 dark:text-slate-100 dark:hover:bg-slate-800"
                      )}
                      onClick={() => setSize(s)}
                      type="button"
                    >
                      {s}
                    </button>
                  ))}
                </div>
              </div>

              {/* Rounded controls */}
              <div className="grid grid-cols-1 gap-3">
                <div>
                  <label className={labelCls}>roundedSize</label>
                  <select
                    value={roundedSize}
                    onChange={(e) => setRoundedSize((e.target.value || "") as any)}
                    className={inputCls}
                  >
                    <option value="">(default by size)</option>
                    {ROUNDED_SIZES.map((rs) => (
                      <option key={rs} value={rs}>
                        {rs}
                      </option>
                    ))}
                  </select>
                </div>

                <div>
                  <label className={labelCls}>rounded (override class)</label>
                  <input
                    value={rounded}
                    onChange={(e) => setRounded(e.target.value)}
                    placeholder='contoh: "rounded-2xl" atau "rounded-[14px]"'
                    className={inputCls}
                  />
                  <p className="mt-1 text-[12px] text-slate-500 dark:text-slate-400">
                    Prioritas radius: <code>rounded</code> (class) &gt; <code>roundedSize</code>{" "}
                    (enum) &gt; default dari <code>size</code>.
                  </p>
                </div>
              </div>

              {/* Font controls */}
              <div className="grid grid-cols-1 gap-3">
                <div>
                  <label className={labelCls}>fontWeight</label>
                  <select
                    value={fontWeight}
                    onChange={(e) => setFontWeight(e.target.value as FontWeight)}
                    className={inputCls}
                  >
                    {WEIGHTS.map((w) => (
                      <option key={w} value={w}>
                        {w}
                      </option>
                    ))}
                  </select>
                </div>

                <div className="grid grid-cols-2 gap-3">
                  <label className="inline-flex items-center gap-2 text-slate-800 dark:text-slate-200">
                    <input
                      type="checkbox"
                      checked={italic}
                      onChange={(e) => setItalic(e.target.checked)}
                    />
                    <span className="text-sm">italic</span>
                  </label>
                  <label className="inline-flex items-center gap-2 text-slate-800 dark:text-slate-200">
                    <input
                      type="checkbox"
                      checked={underline}
                      onChange={(e) => setUnderline(e.target.checked)}
                    />
                    <span className="text-sm">underline</span>
                  </label>
                  <label className="inline-flex items-center gap-2 text-slate-800 dark:text-slate-200">
                    <input
                      type="checkbox"
                      checked={strike}
                      onChange={(e) => setStrike(e.target.checked)}
                    />
                    <span className="text-sm">line-through</span>
                  </label>
                  <label className="inline-flex items-center gap-2 text-slate-800 dark:text-slate-200">
                    <input
                      type="checkbox"
                      checked={uppercase}
                      onChange={(e) => setUppercase(e.target.checked)}
                    />
                    <span className="text-sm">uppercase</span>
                  </label>
                </div>
              </div>

              <div className="grid grid-cols-2 gap-3">
                <label className="inline-flex items-center gap-2 text-slate-800 dark:text-slate-200">
                  <input
                    type="checkbox"
                    checked={block}
                    onChange={(e) => setBlock(e.target.checked)}
                  />
                  <span className="text-sm">block (full width)</span>
                </label>
                <label className="inline-flex items-center gap-2 text-slate-800 dark:text-slate-200">
                  <input
                    type="checkbox"
                    checked={disabled}
                    onChange={(e) => setDisabled(e.target.checked)}
                  />
                  <span className="text-sm">disabled</span>
                </label>
              </div>

              <div className="grid grid-cols-2 gap-3">
                <label className="inline-flex items-center gap-2 text-slate-800 dark:text-slate-200">
                  <input
                    type="checkbox"
                    checked={leftIcon}
                    onChange={(e) => setLeftIcon(e.target.checked)}
                  />
                  <span className="text-sm">leftIcon</span>
                </label>
                <label className="inline-flex items-center gap-2 text-slate-800 dark:text-slate-200">
                  <input
                    type="checkbox"
                    checked={rightIcon}
                    onChange={(e) => setRightIcon(e.target.checked)}
                  />
                  <span className="text-sm">rightIcon</span>
                </label>
              </div>

              <div className="grid grid-cols-2 gap-3">
                <label className="inline-flex items-center gap-2 text-slate-800 dark:text-slate-200">
                  <input
                    type="checkbox"
                    checked={loading}
                    onChange={(e) => setLoading(e.target.checked)}
                  />
                  <span className="text-sm">loading</span>
                </label>
                <div>
                  <label className={labelCls}>loadingText</label>
                  <input
                    value={loadingText}
                    onChange={(e) => setLoadingText(e.target.value)}
                    placeholder="Menyimpan..."
                    className={inputCls}
                  />
                </div>
              </div>

              <div className="grid grid-cols-2 gap-3">
                <div>
                  <label className={labelCls}>href</label>
                  <input
                    value={href}
                    onChange={(e) => setHref(e.target.value)}
                    placeholder="/settings"
                    className={inputCls}
                  />
                </div>
                <div>
                  <label className={labelCls}>as</label>
                  <select
                    value={asEl}
                    onChange={(e) => setAsEl(e.target.value as any)}
                    className={inputCls}
                  >
                    <option value="">(auto)</option>
                    <option value="button">button</option>
                    <option value="a">a</option>
                  </select>
                </div>
              </div>

              <div>
                <label className={labelCls}>debounceMs</label>
                <input
                  type="number"
                  min={0}
                  step={50}
                  value={debounceMs}
                  onChange={(e) => setDebounceMs(Number(e.target.value))}
                  className={inputCls}
                />
              </div>

              <div>
                <label className={labelCls}>className (opsional)</label>
                <input
                  value={className}
                  onChange={(e) => setClassName(e.target.value)}
                  placeholder="px-6 uppercase tracking-tight"
                  className={inputCls}
                />
              </div>
            </div>
          </div>

          {/* Props table ringkas */}
          <div className={clsx(card, "p-4")}>
            <h3 className="mb-3 font-semibold text-slate-900 dark:text-slate-100">Props</h3>
            <div className="overflow-x-auto">
              <table className="w-full text-sm">
                <thead>
                  <tr className="border-b border-slate-200 text-left dark:border-slate-700">
                    <th className="py-2 pr-3 text-slate-700 dark:text-slate-300">Nama</th>
                    <th className="py-2 pr-3 text-slate-700 dark:text-slate-300">Tipe</th>
                    <th className="py-2 pr-3 text-slate-700 dark:text-slate-300">Default</th>
                    <th className="py-2 text-slate-700 dark:text-slate-300">Keterangan</th>
                  </tr>
                </thead>
                <tbody className="border-slate-200 dark:border-slate-700 [&_tr]:border-b">
                  <tr>
                    <td className="py-2 pr-3">variant</td>
                    <td className="py-2 pr-3">"solid" | "outline" | "ghost" | "link" | "soft"</td>
                    <td className="py-2 pr-3">"solid"</td>
                    <td className="py-2">Gaya tombol</td>
                  </tr>
                  <tr>
                    <td className="py-2 pr-3">tone</td>
                    <td className="py-2 pr-3">
                      "primary" | "secondary" | "success" | "warning" | "danger" | "neutral"
                    </td>
                    <td className="py-2 pr-3">"primary"</td>
                    <td className="py-2">Palet warna</td>
                  </tr>
                  <tr>
                    <td className="py-2 pr-3">size</td>
                    <td className="py-2 pr-3">"sm" | "md" | "lg"</td>
                    <td className="py-2 pr-3">"md"</td>
                    <td className="py-2">Ukuran</td>
                  </tr>
                  <tr>
                    <td className="py-2 pr-3">fontWeight</td>
                    <td className="py-2 pr-3">
                      "light" | "normal" | "medium" | "semibold" | "bold" | "extrabold"
                    </td>
                    <td className="py-2 pr-3">"medium"</td>
                    <td className="py-2">Bobot font</td>
                  </tr>
                  <tr>
                    <td className="py-2 pr-3">italic / underline / strike / uppercase</td>
                    <td className="py-2 pr-3">boolean</td>
                    <td className="py-2 pr-3">false</td>
                    <td className="py-2">Kontrol tipografi</td>
                  </tr>
                  <tr>
                    <td className="py-2 pr-3">block</td>
                    <td className="py-2 pr-3">boolean</td>
                    <td className="py-2 pr-3">false</td>
                    <td className="py-2">Lebar penuh</td>
                  </tr>

                  {/* Baru */}
                  <tr>
                    <td className="py-2 pr-3">roundedSize</td>
                    <td className="py-2 pr-3">
                      "none" | "sm" | "md" | "lg" | "xl" | "2xl" | "3xl" | "full"
                    </td>
                    <td className="py-2 pr-3">— (ikut size)</td>
                    <td className="py-2">Ukuran radius via enum (lebih konsisten)</td>
                  </tr>

                  <tr>
                    <td className="py-2 pr-3">rounded</td>
                    <td className="py-2 pr-3">string (class)</td>
                    <td className="py-2 pr-3">—</td>
                    <td className="py-2">Override radius Tailwind custom (mis. rounded-[14px])</td>
                  </tr>

                  <tr>
                    <td className="py-2 pr-3">leftIcon / rightIcon</td>
                    <td className="py-2 pr-3">ReactNode</td>
                    <td className="py-2 pr-3">—</td>
                    <td className="py-2">Ikon kiri/kanan</td>
                  </tr>
                  <tr>
                    <td className="py-2 pr-3">loading</td>
                    <td className="py-2 pr-3">boolean</td>
                    <td className="py-2 pr-3">false</td>
                    <td className="py-2">Spinner + disable klik</td>
                  </tr>
                  <tr>
                    <td className="py-2 pr-3">loadingText</td>
                    <td className="py-2 pr-3">string</td>
                    <td className="py-2 pr-3">—</td>
                    <td className="py-2">Teks saat loading</td>
                  </tr>
                  <tr>
                    <td className="py-2 pr-3">href</td>
                    <td className="py-2 pr-3">string</td>
                    <td className="py-2 pr-3">—</td>
                    <td className="py-2">Navigasi (render Link)</td>
                  </tr>
                  <tr>
                    <td className="py-2 pr-3">as</td>
                    <td className="py-2 pr-3">"button" | "a"</td>
                    <td className="py-2 pr-3">auto</td>
                    <td className="py-2">Paksa elemen</td>
                  </tr>
                  <tr>
                    <td className="py-2 pr-3">debounceMs</td>
                    <td className="py-2 pr-3">number</td>
                    <td className="py-2 pr-3">300</td>
                    <td className="py-2">Cegah double-click</td>
                  </tr>
                  <tr>
                    <td className="py-2 pr-3">disabled</td>
                    <td className="py-2 pr-3">boolean</td>
                    <td className="py-2 pr-3">false</td>
                    <td className="py-2">Nonaktifkan tombol</td>
                  </tr>
                  <tr>
                    <td className="py-2 pr-3">className</td>
                    <td className="py-2 pr-3">string</td>
                    <td className="py-2 pr-3">—</td>
                    <td className="py-2">Tambahan kelas Tailwind</td>
                  </tr>
                  <tr>
                    <td className="py-2 pr-3">onClick</td>
                    <td className="py-2 pr-3">() ⇒ void</td>
                    <td className="py-2 pr-3">—</td>
                    <td className="py-2">Handler klik (di-debounce)</td>
                  </tr>
                </tbody>
              </table>
            </div>
          </div>
        </aside>
      </section>

      {/* Best practices singkat */}
      <section className={clsx(card, "p-4")}>
        <h3 className="mb-2 font-semibold text-slate-900 dark:text-slate-100">Best Practices</h3>
        <ul className="ml-5 list-disc space-y-1 text-sm text-slate-700 dark:text-slate-300">
          <li>
            Gunakan <code>variant="soft"</code> untuk badge/pill yang subtle; set{" "}
            <code>roundedSize="full"</code> untuk shape kapsul.
          </li>
          <li>
            <code>variant="link"</code> untuk navigasi; action submit tetap pakai{" "}
            <code>{`<button type="submit" />`}</code>.
          </li>
          <li>
            Atur brand color via token Tailwind (mis. <code>--ring-primary</code>) agar semua{" "}
            <code>tone="primary"</code> konsisten.
          </li>
          <li>
            Prioritas radius: <code>rounded</code> &gt; <code>roundedSize</code> &gt; default dari{" "}
            <code>size</code>.
          </li>
        </ul>
      </section>
    </div>
  );
}
