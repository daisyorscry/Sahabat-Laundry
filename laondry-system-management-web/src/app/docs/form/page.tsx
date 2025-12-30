/* eslint-disable @typescript-eslint/no-explicit-any */
"use client";

// <- minLength dihapus
import { zodResolver } from "@hookform/resolvers/zod";
import { useForm } from "react-hook-form";
import { FaHashtag, FaRulerCombined } from "react-icons/fa6";
import { z } from "zod";

import FormRenderer from "@/components/form/FormRenderer";
import { FieldConfig, SelectOption } from "@/components/form/types";

const ItemSchema = z.object({
  name: z.string().min(1, "Nama wajib").max(100, "Max 100 karakter"),
  qty: z.number().int().min(6, "Min 6").max(120, "Max 120"),
  price: z.number().int().min(0, "Tidak boleh negatif"),
  notes: z.union([z.string().max(140, "Max 140 karakter"), z.literal("")]).optional(),
});

const schema = z.object({
  full_name: z.string().min(1, "Wajib diisi").max(100),
  email: z.union([z.string().email("Email tidak valid"), z.literal("")]),
  password: z.string().min(6, "Min 6 karakter"),

  phone: z.union([z.string(), z.literal("")]).refine((v) => v === "" || /^0\d{9,14}$/.test(v), {
    message: "Format 08… (10-15 digit)",
  }),

  age: z
    .number()
    .int()
    .nonnegative()
    .min(1, "Masukkan umur yang relevan")
    .max(120, "Masukkan umur yang relevan")
    .optional(),

  height: z.number().optional(),
  salary: z.number().optional(),

  otp: z.union([z.string().regex(/^\d{6}$/, "6 digit"), z.literal("")]),
  gender: z.union([z.literal("M"), z.literal("F")]).optional(),
  gender_v2: z.union([z.literal("M"), z.literal("F")]).optional(),
  is_active: z.boolean().optional(),
  birthdate: z.union([z.string(), z.literal("")]).optional(),
  period: z.object({
    start: z.string().min(1, "Tanggal mulai wajib"),
    end: z.string().min(1, "Tanggal selesai wajib"),
  }),

  docs: z.array(z.instanceof(File)).max(10, "Maks 10 file").optional(),
  templates: z.array(z.instanceof(File)).max(10, "Maks 10 file").optional(),

  avatar: z.instanceof(File).nullable().optional(),
  attachments: z.array(z.instanceof(File)).optional(),

  tags: z.array(z.string()).optional(),
  customer_ids: z.array(z.union([z.string(), z.number()])),
  bio: z.union([z.string(), z.literal("")]).optional(),
  customer_id: z.union([z.string(), z.number()]).optional(),
  feature_flags: z.array(z.boolean()),
  periods: z.array(z.object({ start: z.string().min(1), end: z.string().min(1) })),
  items: z
    .array(ItemSchema)
    .min(1, "Minimal 1 item")
    .refine((arr) => arr.reduce((sum, x) => sum + (x.price || 0) * (x.qty || 0), 0) > 0, {
      message: "Total harus lebih dari 0",
      path: [],
    })
    .refine(
      (arr) => {
        const seen = new Set<string>();
        for (const it of arr) {
          const k = (it.name || "").trim().toLowerCase();
          if (!k) continue;
          if (seen.has(k)) return false;
          seen.add(k);
        }
        return true;
      },
      {
        message: "Nama item tidak boleh duplikat",
        path: [],
      }
    ),
});
type FormValues = z.infer<typeof schema>;

async function loadLibrary(q: string, signal?: AbortSignal) {
  const res = await fetch(`${q}`, { signal });
  const json = await res.json();
  return (json.data ?? []).map((x: any) => ({
    id: x.id,
    label: x.name,
    url: x.url,
    mime: x.mime,
    size: x.size,
    thumb: x.thumb,
  }));
}
async function loadCustomers(q: string, signal?: AbortSignal): Promise<SelectOption[]> {
  const url = `/api/customers?q=${encodeURIComponent(q)}`;
  const res = await fetch(url, { signal });
  if (!res.ok) return [];
  const json = await res.json();
  return (json?.data ?? []).map((x: any) => ({ value: x.id, label: String(x.name ?? x.id) }));
}

const fields: Array<FieldConfig<FormValues>> = [
  { type: "text", name: "full_name", label: "Full name", placeholder: "Nama lengkap" },
  { type: "email", name: "email", label: "Email", placeholder: "nama@contoh.com" },
  { type: "password", name: "password", label: "Password", placeholder: "••••••" },

  {
    type: "tel",
    name: "phone",
    label: "Phone",
    placeholder: "08xxxxxxxxxx",
    output: "raw",
    countryCode: "62",
    minDigits: 10,
    maxDigits: 15,
    allowPlus: true,
  },

  {
    type: "number",
    name: "age",
    label: "Age",
    min: 0,
    max: 120,
    step: 1,
    placeholder: "0",
    iconRight: <FaHashtag className="h-4 w-4" />,
  },

  {
    type: "decimal",
    name: "height",
    label: "Height (m)",
    placeholder: "1,75",
    decimalSeparator: ",",
    thousandSeparator: ".",
    precision: 2,
    iconRight: <FaRulerCombined className="h-4 w-4" />,
    helperText: "Gunakan koma untuk desimal",
  },
  {
    type: "currency",
    name: "salary",
    label: "Salary",
    prefix: "Rp",
    precision: 0,
    decimalSeparator: ",",
    iconRight: <FaRulerCombined className="h-4 w-4" />,
    thousandSeparator: ".",
  },

  { type: "pin", name: "otp", label: "PIN / OTP", length: 6, placeholder: "123456" },

  {
    type: "radio",
    name: "gender",
    label: "Gender",
    inline: true,
    dense: true,
    framed: false,
    options: [
      { label: "Laki-laki", value: "M" },
      { label: "Perempuan", value: "F", disabled: false },
    ],
  },
  {
    type: "select",
    name: "gender_v2",
    label: "Gender",
    placeholder: "Pilih gender",
    options: [
      { label: "Laki-laki", value: "M" },
      { label: "Perempuan", value: "F", disabled: false },
    ],
  },

  { type: "switch", name: "is_active", label: "Aktif", size: "sm" },
  {
    type: "async-select",
    name: "customer_id",
    label: "Pelanggan",
    placeholder: "Cari nama/HP pelanggan…",
    helperText: "Ketik minimal 2 karakter",
    minChars: 2,
    debounceMs: 300,
    emptyText: "Tidak ada pelanggan",
    loadOptions: loadCustomers,
  },
  {
    type: "date-range",
    name: "period",
    label: "Periode",
    mode: "datetime",
    timeStepMinutes: 15,
    min: "2020-01-01",
    max: "2030-12-31",
    placeholder: "Pilih rentang tanggal",
  },
  { type: "date", name: "birthdate", min: "1900-01-01", max: "2025-12-31" },

  {
    type: "array",
    name: "periods",
    label: "Periode",
    addText: "Tambah Periode",
    of: { type: "date-range" },
  },
  {
    type: "array",
    name: "feature_flags",
    label: "Fitur",
    addText: "Tambah Flag",
    of: { type: "switch", label: "Aktif?" },
  },
  // {
  //   type: "file",
  //   name: "avatar",
  //   label: "Avatar",
  //   source: "library",
  //   multiple: false,
  //   images: true,
  //   maxBytes: 2 * 1024 * 1024,
  //   assets: [
  //     { id: 1, label: "Avatar A", url: "https://static.wikia.nocookie.net/patric/images/c/ca/200px-Patrick_Star_svg.png", mime: "image/png", size: 123456, thumb: "/static/avatars/a-thumb.png" },
  //     { id: 2, label: "Avatar B", url: "https://cdn.shopify.com/s/files/1/0573/7569/files/best_day_ever_079_1000x.jpg", mime: "image/jpeg", size: 234567, thumb: "/static/avatars/b-thumb.jpg" },
  //   ],
  // },

  {
    type: "textarea",
    name: "bio",
    label: "Bio",
    placeholder: "Ceritakan tentang dirimu",
    rows: 10,
  },
  {
    type: "array",
    name: "tags",
    label: "Tags",
    minItems: 1,
    addText: "Tambah Tag",
    of: { type: "text", placeholder: "Ketik tag" },
  },
  {
    type: "array",
    name: "customer_ids",
    label: "Pelanggan",
    addText: "Tambah",
    of: {
      type: "async-select",
      placeholder: "Cari pelanggan…",
    },
  },
  // {
  //   type: "array",
  //   name: "docs",
  //   label: "Dokumen",
  //   addText: "Tambah Dokumen",
  //   of: {
  //     type: "file",
  //   },
  // },

  {
    type: "array-object",
    name: "items",
    label: "Daftar Item",
    sortable: true,
    minItems: 1,
    addText: "Tambah Item",
    itemLabel: (i, v) => v.items?.[i]?.name || `Item #${i + 1}`,
    itemFields: [
      { type: "text", name: "name", label: "Nama" },
      { type: "number", name: "qty", label: "Qty", step: 1, min: 6, max: 120 },
      {
        type: "currency",
        name: "price",
        label: "Harga",
        prefix: "Rp",
        precision: 0,
        thousandSeparator: ".",
      },
      { type: "text", name: "notes", label: "Catatan", placeholder: "Opsional" },
    ],
  },
  {
    type: "file",
    name: "templates",
    label: "Template Dokumen",
    source: "library",
    multiple: true,
    searchable: true,
    debounceMs: 400,
    maxFiles: 5,
    allowedMimes: ["application/pdf"],
    loadAssets: loadLibrary,
  },
  {
    type: "file",
    name: "avatar",
    label: "Avatar",
    multiple: false,
    images: true,
    minBytes: 5 * 1024,
    maxBytes: 2 * 1024 * 1024,
  },
  {
    type: "file",
    name: "docs",
    label: "Dokumen",
    multiple: true,
    maxFiles: 10,
    allowedExts: [".pdf", ".docx", ".xlsx", ".csv"],
    minBytes: 10 * 1024,
    maxBytes: 15 * 1024 * 1024,
    showPreview: false, // non-image tak perlu preview
  },
  {
    type: "file",
    name: "attachments",
    label: "Lampiran",
    multiple: true,
    images: ["png", "jpeg", "image/webp"],
    allowedMimes: ["application/pdf"], // tambah PDF
    maxFiles: 5,
  },
];

export default function FormDemoPage() {
  const form = useForm<FormValues>({
    resolver: zodResolver(schema),
    mode: "onChange",
    defaultValues: {
      full_name: "",
      email: "",
      password: "",
      phone: "",
      age: undefined,
      height: undefined,
      salary: undefined,
      otp: "",
      gender: undefined,
      is_active: false,
      birthdate: "",
      avatar: null,
      attachments: [],
      tags: [],
      bio: "",
      customer_id: undefined,
      items: [{ name: "", qty: 1, price: 0, notes: "" }],
    },
  });

  const { control, handleSubmit, formState, watch } = form;
  const payload = watch();

  // JSON (tanpa file)
  const submitJson = async (vals: FormValues) => {
    const res = await fetch("/api/users", {
      method: "POST",
      headers: { "Content-Type": "application/json" },
      body: JSON.stringify(vals),
    });
    if (!res.ok) {
      const e = await res.json().catch(() => ({}));
      alert(`Gagal: ${res.status} ${e?.message ?? ""}`);
      return;
    }
    alert("OK");
  };

  // multipart (dengan file)
  const submitMultipart = async (vals: FormValues) => {
    const fd = new FormData();

    (Object.keys(vals) as Array<keyof FormValues>).forEach((k) => {
      if (k === "avatar" || k === "attachments") return;
      const v = vals[k];
      if (v === undefined || v === null) {
        fd.append(String(k), "");
      } else if (typeof v === "number" || typeof v === "boolean") {
        fd.append(String(k), String(v));
      } else if (Array.isArray(v)) {
        fd.append(String(k), JSON.stringify(v));
      } else if (typeof v === "object") {
        // objek (mis. period, items) -> stringify
        fd.append(String(k), JSON.stringify(v));
      } else {
        fd.append(String(k), v as any);
      }
    });

    // File fields
    if (vals.avatar instanceof File) {
      fd.append("avatar", vals.avatar);
    }
    if (Array.isArray(vals.attachments)) {
      vals.attachments.forEach((f) => {
        if (f instanceof File) fd.append("attachments", f);
      });
    }

    const res = await fetch("/api/users-upload", { method: "POST", body: fd });
    if (!res.ok) {
      const e = await res.json().catch(() => ({}));
      alert(`Upload gagal: ${res.status} ${e?.message ?? ""}`);
      return;
    }
    alert("Upload OK");
  };

  return (
    <main className="mx-auto max-w-7xl p-6">
      {/* Header */}
      <div className="mb-6 flex flex-col gap-2 sm:flex-row sm:items-end sm:justify-between">
        <div>
          <h2 className="text-xl font-semibold tracking-tight text-slate-900 dark:text-slate-100">
            Form Controls Demo (Next.js)
          </h2>
          <p className="text-sm text-slate-500 dark:text-slate-400">
            Definisikan field → render otomatis, validasi Zod aktif, submit JSON / multipart.
          </p>
        </div>

        <div className="flex gap-2">
          <span
            className={[
              "inline-flex items-center rounded-full px-3 py-1 text-xs font-medium",
              formState.isValid
                ? "bg-emerald-50 text-emerald-700 ring-1 ring-emerald-200 ring-inset dark:bg-emerald-900/20 dark:text-emerald-300 dark:ring-emerald-800/60"
                : "bg-amber-50 text-amber-700 ring-1 ring-amber-200 ring-inset dark:bg-amber-900/20 dark:text-amber-300 dark:ring-amber-800/60",
            ].join(" ")}
          >
            {formState.isValid ? "Valid" : "Belum valid"}
          </span>
          {formState.isDirty && (
            <span className="inline-flex items-center rounded-full bg-sky-50 px-3 py-1 text-xs font-medium text-sky-700 ring-1 ring-sky-200 ring-inset dark:bg-sky-900/20 dark:text-sky-300 dark:ring-sky-800/60">
              Edited
            </span>
          )}
        </div>
      </div>

      <section className="rounded-xl border border-slate-200 bg-white p-4 ring-1 ring-slate-100/50 dark:border-slate-700 dark:bg-slate-900 dark:ring-0">
        <FormRenderer
          control={control}
          fields={fields}
          layout={{
            mode: "grid",
            cols: { base: 1, md: 2, lg: 3 },
            gap: "gap-4",
            itemClassName: (f) =>
              f.type === "textarea" ||
              f.type === "file" ||
              f.type == "date" ||
              f.type === "array" ||
              f.type === "array-object" ||
              f.type === "date-range"
                ? "md:col-span-full lg:col-span-full"
                : undefined,
          }}
        />

        <div className="mt-4 flex flex-col-reverse gap-3 sm:flex-row sm:items-center sm:justify-between">
          <div className="text-xs text-slate-500 dark:text-slate-400">
            {formState.errors?.root?.message ?? ""}
          </div>
          <div className="flex gap-2">
            <button
              type="button"
              onClick={handleSubmit(submitJson)}
              disabled={!formState.isValid}
              className={[
                "inline-flex items-center justify-center rounded-lg px-4 py-2 text-sm font-medium",
                formState.isValid
                  ? "bg-slate-900 text-white hover:bg-slate-800 dark:bg-slate-100 dark:text-slate-900 dark:hover:bg-white"
                  : "cursor-not-allowed bg-slate-200 text-slate-500 dark:bg-slate-800 dark:text-slate-500",
              ].join(" ")}
            >
              Submit JSON
            </button>
            <button
              type="button"
              onClick={handleSubmit(submitMultipart)}
              disabled={!formState.isValid}
              className={[
                "inline-flex items-center justify-center rounded-lg px-4 py-2 text-sm font-medium",
                formState.isValid
                  ? "bg-sky-600 text-white hover:bg-sky-700 dark:bg-sky-600 dark:hover:bg-sky-500"
                  : "cursor-not-allowed bg-slate-200 text-slate-500 dark:bg-slate-800 dark:text-slate-500",
              ].join(" ")}
            >
              Submit Multipart + File
            </button>
          </div>
        </div>
      </section>

      <section className="mt-6 grid grid-cols-1 gap-4 lg:grid-cols-3">
        {/* Payload */}
        <div className="overflow-hidden rounded-xl border border-slate-200 bg-white shadow-sm ring-1 ring-slate-100/60 lg:col-span-1 dark:border-slate-700 dark:bg-slate-900 dark:ring-0">
          <div className="flex items-center justify-between border-b border-slate-200/70 bg-slate-50/60 px-3 py-2 text-xs font-medium text-slate-700 dark:border-slate-700/70 dark:bg-slate-800/40 dark:text-slate-200">
            <span>Payload (watch)</span>
            <button
              type="button"
              onClick={() => navigator.clipboard.writeText(JSON.stringify(payload, null, 2))}
              className="rounded-md border border-slate-200 px-2 py-1 text-slate-700 hover:bg-slate-100 dark:border-slate-600 dark:text-slate-200 dark:hover:bg-slate-800"
              aria-label="Copy payload JSON"
            >
              Copy
            </button>
          </div>
          <pre className="max-h-[460px] overflow-auto bg-[#0b1020] p-3 font-mono text-[12px] leading-5 text-[#cde3ff]">
            {JSON.stringify(payload, null, 2)}
          </pre>
        </div>

        {/* Fields definition */}
        <div className="overflow-hidden rounded-xl border border-slate-200 bg-white shadow-sm ring-1 ring-slate-100/60 lg:col-span-1 dark:border-slate-700 dark:bg-slate-900 dark:ring-0">
          <div className="flex items-center justify-between border-b border-slate-200/70 bg-slate-50/60 px-3 py-2 text-xs font-medium text-slate-700 dark:border-slate-700/70 dark:bg-slate-800/40 dark:text-slate-200">
            <span>Fields Definition</span>
            <button
              type="button"
              onClick={() => navigator.clipboard.writeText(JSON.stringify(fields, null, 2))}
              className="rounded-md border border-slate-200 px-2 py-1 text-slate-700 hover:bg-slate-100 dark:border-slate-600 dark:text-slate-200 dark:hover:bg-slate-800"
              aria-label="Copy fields JSON"
            >
              Copy
            </button>
          </div>
          <pre className="max-h-[460px] overflow-auto bg-[#0b1020] p-3 font-mono text-[12px] leading-5 text-[#cde3ff]">
            {JSON.stringify(fields, null, 2)}
          </pre>
        </div>

        {/* How it works */}
        <div className="overflow-hidden rounded-xl border border-slate-200 bg-white shadow-sm ring-1 ring-slate-100/60 lg:col-span-1 dark:border-slate-700 dark:bg-slate-900 dark:ring-0">
          <div className="border-b border-slate-200/70 bg-slate-50/60 px-3 py-2 text-xs font-medium text-slate-700 dark:border-slate-700/70 dark:bg-slate-800/40 dark:text-slate-200">
            How it works
          </div>
          <div className="space-y-3 p-4 text-sm text-slate-700 dark:text-slate-300">
            <ol className="list-decimal space-y-2 pl-5">
              <li>
                <span className="font-medium">Define fields</span> — kamu hanya mendeskripsikan
                komponen di
                <code className="mx-1 rounded bg-slate-100 px-1.5 py-0.5 text-[12px] dark:bg-slate-800">
                  fields[]
                </code>
                .
              </li>
              <li>
                <span className="font-medium">FormRenderer</span> — membaca tiap item, ambil
                renderer dari registry berdasarkan
                <code className="mx-1 rounded bg-slate-100 px-1.5 py-0.5 text-[12px] dark:bg-slate-800">
                  type
                </code>
                , dan auto-prefix path untuk nested (mis.{" "}
                <code className="rounded bg-slate-100 px-1.5 py-0.5 text-[12px] dark:bg-slate-800">
                  items.0.name
                </code>
                ).
              </li>
              <li>
                <span className="font-medium">React Hook Form</span> — semua komponen menerima
                <code className="mx-1 rounded bg-slate-100 px-1.5 py-0.5 text-[12px] dark:bg-slate-800">
                  control
                </code>
                , bind nilai, dan tampilkan error dari Zod resolver.
              </li>
              <li>
                <span className="font-medium">Zod</span> — validasi per-field & agregat (contoh:
                minimal item, total & nama unik).
              </li>
              <li>
                <span className="font-medium">Async Select</span> — loader dengan debounce + abort;
                menyimpan
                <code className="mx-1 rounded bg-slate-100 px-1.5 py-0.5 text-[12px] dark:bg-slate-800">
                  option.value
                </code>
                .
              </li>
              <li>
                <span className="font-medium">Array Object</span> — dikelola
                <code className="mx-1 rounded bg-slate-100 px-1.5 py-0.5 text-[12px] dark:bg-slate-800">
                  useFieldArray
                </code>
                , ada tombol tambah/sort/hapus, dan highlight error per item.
              </li>
            </ol>

            <div className="rounded-lg border border-slate-200 bg-slate-50 p-3 text-[12px] leading-relaxed dark:border-slate-700 dark:bg-slate-800/50">
              <div className="font-semibold">Dark/Light Mode</div>
              <p className="mt-1">
                Seluruh panel pakai util Tailwind{" "}
                <code className="rounded bg-slate-100 px-1 py-0.5 dark:bg-slate-800">dark:</code>.
                Pastikan root HTML punya toggler tema (mis.
                <code className="mx-1 rounded bg-slate-100 px-1 py-0.5 dark:bg-slate-800">
                  next-themes
                </code>
                ) yang menambahkan class
                <code className="mx-1 rounded bg-slate-100 px-1 py-0.5 dark:bg-slate-800">
                  dark
                </code>{" "}
                ke{" "}
                <code className="rounded bg-slate-100 px-1 py-0.5 dark:bg-slate-800">
                  &lt;html&gt;
                </code>
                .
              </p>
            </div>
          </div>
        </div>
      </section>
    </main>
  );
}
