"use client";

import { zodResolver } from "@hookform/resolvers/zod";
import { useForm } from "react-hook-form";
import { z } from "zod";

import FormRenderer from "@/components/form/FormRenderer";
import { FieldConfig } from "@/components/form/types";
import { useRegister } from "@/features/auth/useRegister";

const schema = z.object({
  full_name: z.string().min(1, "Nama wajib diisi").max(100),
  email: z.string().email("Email tidak valid"),
  password: z.string().min(6, "Min 6 karakter"),
  phone_number: z.string().regex(/^0\d{9,14}$/, "Format 08… (10-15 digit)"),
  pin: z.string().regex(/^\d{6}$/, "PIN 6 digit"),
  alamat: z.string().min(5, "Terlalu pendek"),
  label_alamat: z.string().min(2, "Wajib diisi"),
});
type FormValues = z.infer<typeof schema>;

const fields: Array<FieldConfig<FormValues>> = [
  { type: "text", name: "full_name", label: "Nama lengkap", placeholder: "Nama lengkap" },
  { type: "email", name: "email", label: "Email", placeholder: "nama@contoh.com" },
  { type: "password", name: "password", label: "Password", placeholder: "••••••" },
  {
    type: "tel",
    name: "phone_number",
    label: "Nomor HP",
    placeholder: "08xxxxxxxxxx",
    output: "raw",
    countryCode: "62",
    minDigits: 10,
    maxDigits: 15,
    allowPlus: false,
  },
  { type: "pin", name: "pin", label: "PIN (6 digit)", length: 6, placeholder: "123456" },
  {
    type: "textarea",
    name: "alamat",
    label: "Alamat",
    rows: 4,
    placeholder: "Jalan dan detail alamat",
  },
  {
    type: "select",
    name: "label_alamat",
    label: "Label alamat",
    placeholder: "Pilih label",
    options: [
      { label: "Rumah", value: "rumah" },
      { label: "Kantor", value: "kantor" },
      { label: "Kos", value: "kos" },
      { label: "Lainnya", value: "lainnya" },
    ],
  },
];

export default function RegisterPage() {
  const form = useForm<FormValues>({
    resolver: zodResolver(schema),
    mode: "onChange",
    defaultValues: {
      full_name: "",
      email: "",
      password: "",
      phone_number: "",
      pin: "",
      alamat: "",
      label_alamat: "rumah",
    },
  });

  const { control, handleSubmit, formState, setError } = form;

  const registerMut = useRegister({ setError });

  const onSubmit = (vals: FormValues) => registerMut.mutate(vals);

  return (
    <main className="mx-auto max-w-2xl">
      <h1 className="mb-4 text-xl font-semibold">Daftar Akun</h1>

      <section className="rounded-xl">
        <FormRenderer
          control={control}
          fields={fields}
          layout={{
            mode: "grid",
            cols: { base: 1, md: 1 },
            gap: "gap-4",
            itemClassName: (f) => (f.type === "textarea" ? "md:col-span-full" : undefined),
          }}
        />

        <div className="mt-4 flex justify-end">
          <button
            type="button"
            onClick={handleSubmit(onSubmit)}
            disabled={!formState.isValid || formState.isSubmitting}
            className={[
              "inline-flex items-center justify-center rounded-lg px-4 py-2 text-sm font-medium",
              formState.isValid && !formState.isSubmitting
                ? "bg-sky-600 text-white hover:bg-sky-700"
                : "cursor-not-allowed bg-slate-200 text-slate-500",
            ].join(" ")}
          >
            {formState.isSubmitting ? "Mendaftar…" : "Daftar"}
          </button>
        </div>
      </section>
    </main>
  );
}
