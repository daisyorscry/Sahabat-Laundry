/* eslint-disable @typescript-eslint/no-explicit-any */
"use client";

import * as React from "react";
import { useForm } from "react-hook-form";
import { z } from "zod";
import { zodResolver } from "@hookform/resolvers/zod";

import Modal from "@/components/ui/Modal";
import Button from "@/components/button/Button";
import FormRenderer from "@/components/form/FormRenderer";
import type { FieldConfig } from "@/components/form/types";

import type {
  Addon,
  CreateAddonPayload,
  UpdateAddonPayload,
} from "@/features/order-service/useAddons";

// Helpers
const toZeroIfEmpty = (v: unknown) => (v === "" || v == null ? 0 : v);

// ----- Form types (final output) -----
type FormValues = {
  code: string;
  name: string;
  description?: string | null;
  price: number;            // currency → number to payload
  is_active?: boolean;
};

// ----- Zod schema (typed to final output) -----
const schema: z.ZodType<FormValues> = z.object({
  code: z.string().min(1, "Kode wajib").max(50, "Maks 50 karakter"),
  name: z.string().min(1, "Nama wajib").max(150, "Maks 150 karakter"),
  description: z.preprocess(
    (v) => (v === "" ? null : v),
    z.string().max(1000, "Maks 1000 karakter").nullable().optional()
  ),
  price: z.preprocess(toZeroIfEmpty, z.coerce.number().min(0, ">= 0")),
  is_active: z.boolean().optional(),
});

const resolver = zodResolver(schema);

// Normalize to API payload
function normalizePayload(v: FormValues): CreateAddonPayload | UpdateAddonPayload {
  return {
    code: v.code.trim(),
    name: v.name.trim(),
    description: v.description ?? null,
    price: v.price, // number (API decimal OK)
    is_active: v.is_active ?? true,
  };
}

type Props = {
  isOpen: boolean;
  onClose: () => void;
  initial?: Addon;
  loading?: boolean;
  onSubmit: (payload: CreateAddonPayload | UpdateAddonPayload) => void;
};

export default function AddonFormModal({ isOpen, onClose, initial, loading, onSubmit }: Props) {
  const form = useForm<FormValues, any, FormValues>({
    resolver,
    mode: "onChange",
    defaultValues: {
      code: initial?.code ?? "",
      name: initial?.name ?? "",
      description: initial?.description ?? null,
      price: Number(initial?.price ?? 0),
      is_active: initial?.is_active ?? true,
    },
  });

  React.useEffect(() => {
    if (!isOpen) return;
    form.reset(
      {
        code: initial?.code ?? "",
        name: initial?.name ?? "",
        description: initial?.description ?? null,
        price: Number(initial?.price ?? 0),
        is_active: initial?.is_active ?? true,
      },
      { keepDirty: false, keepTouched: false }
    );
  }, [isOpen, initial, form]);

  const handleSubmit = form.handleSubmit((vals) => onSubmit(normalizePayload(vals)));

  // ----- Fields definition (FormRenderer) -----
  const fields: Array<FieldConfig<FormValues>> = [
    { type: "text", name: "code", label: "Kode", placeholder: "ADD001" },
    { type: "text", name: "name", label: "Nama Addon", placeholder: "Hanger Tambahan" },
    {
      type: "currency",
      name: "price",
      label: "Harga",
      prefix: "Rp",
      precision: 0,                 // use 2 if you need cents
      thousandSeparator: ".",
      decimalSeparator: ",",
      placeholder: "0",
    },
    { type: "switch", name: "is_active", label: "Aktif", size: "sm" },
    { type: "textarea", name: "description", label: "Deskripsi", placeholder: "Opsional…" },
  ];

  return (
    <Modal
      isOpen={isOpen}
      onClose={() => {
        if (!loading) onClose();
      }}
      title={initial ? "Edit Addon" : "Tambah Addon"}
      size="lg"
    >
      <FormRenderer<FormValues>
        control={form.control}
        fields={fields}
        layout={{
          mode: "grid",
          cols: { base: 1, md: 2, lg: 2 },
          gap: "gap-4",
          itemClassName: (f) =>
            f.type === "textarea" ? "md:col-span-full lg:col-span-full" : undefined,
        }}
      />

      <div className="mt-6 flex items-center justify-end gap-2">
        <Button
          variant="outline"
          tone="neutral"
          onClick={onClose}
          size="sm"
          disabled={!!loading}
        >
          Batal
        </Button>
        <Button
          variant="solid"
          tone="primary"
          size="sm"
          onClick={handleSubmit}
          disabled={!!loading || !form.formState.isValid}
          loading={loading}
          loadingText={initial ? "Menyimpan..." : "Menambah..."}
        >
          {initial ? "Simpan Perubahan" : "Tambah"}
        </Button>
      </div>
    </Modal>
  );
}
