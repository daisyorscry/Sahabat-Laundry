/* eslint-disable @typescript-eslint/no-explicit-any */
"use client";

import * as React from "react";
import { zodResolver } from "@hookform/resolvers/zod";
import { Controller, Resolver, useForm } from "react-hook-form";
import { z } from "zod";

import Button from "@/components/button/Button";
import FormRenderer from "@/components/form/FormRenderer";
import type { FieldConfig } from "@/components/form/types";
import Modal from "@/components/ui/Modal";
import type {
  CreateServicePayload,
  Service,
  UpdateServicePayload,
} from "@/features/order-service/useService";

import CategorySelect from "../../service-categories/_parts/CategorySelect";

type Props = {
  isOpen: boolean;
  onClose: () => void;
  initial?: Service;
  loading?: boolean;
  onSubmit: (payload: CreateServicePayload | UpdateServicePayload) => void;
};

const numericLike = z
  .union([z.string(), z.number()])
  .transform((v) => (typeof v === "number" ? String(v) : v.trim()))
  .refine((v) => v === "" || /^-?\d+([.,]\d+)?$/.test(v), { message: "Format angka tidak valid" });

const schema = z.object({
  code: z.string().min(1, "Kode wajib").max(50),
  name: z.string().min(1, "Nama wajib").max(150),
  category_id: z.string().uuid("Format UUID tidak valid"),
  description: z.union([z.string().max(1000), z.literal(""), z.null()]).optional(),
  pricing_model: z.enum(["weight", "piece"]),
  base_price: numericLike.optional(),
  min_qty: numericLike.optional(),
  est_duration_hours: z.preprocess(
    (v) => (v === "" || v === undefined || v === null ? 24 : v),
    z.coerce.number().int().min(1, "Minimal 1 jam")
  ),
  is_express_available: z.boolean().optional(),
  is_active: z.boolean().optional(),
});

type FormValues = z.infer<typeof schema>;

function normalizePayload(v: FormValues): CreateServicePayload | UpdateServicePayload {
  const toDec = (x?: string) => {
    if (!x) return 0;
    const clean = x.replaceAll(".", "").replaceAll(" ", "").replace(",", ".");
    return clean === "" || Number.isNaN(Number(clean)) ? 0 : clean;
  };

  return {
    code: v.code.trim(),
    name: v.name.trim(),
    category_id: v.category_id,
    description: v.description ? v.description : null,
    pricing_model: v.pricing_model,
    base_price: toDec(v.base_price as string),
    min_qty: toDec(v.min_qty as string),
    est_duration_hours: v.est_duration_hours ?? 24,
    is_express_available: v.is_express_available ?? false,
    is_active: v.is_active ?? true,
  };
}

// cast untuk bypass mismatch typing zod ↔ RHF
const resolver = zodResolver(schema) as unknown as Resolver<FormValues>;

export default function ServiceFormModal({ isOpen, onClose, initial, loading, onSubmit }: Props) {
  const form = useForm<FormValues, any, FormValues>({
    resolver,
    mode: "onChange",
    defaultValues: {
      code: initial?.code ?? "",
      name: initial?.name ?? "",
      category_id: initial?.category_id ?? "",
      description: initial?.description ?? "",
      pricing_model: initial?.pricing_model ?? "weight",
      base_price: String(initial?.base_price ?? ""),
      min_qty: String(initial?.min_qty ?? ""),
      est_duration_hours: initial?.est_duration_hours ?? 24,
      is_express_available: initial?.is_express_available ?? false,
      is_active: initial?.is_active ?? true,
    },
  });

  React.useEffect(() => {
    if (!isOpen) return;
    form.reset(
      {
        code: initial?.code ?? "",
        name: initial?.name ?? "",
        category_id: initial?.category_id ?? "",
        description: initial?.description ?? "",
        pricing_model: initial?.pricing_model ?? "weight",
        base_price: String(initial?.base_price ?? ""),
        min_qty: String(initial?.min_qty ?? ""),
        est_duration_hours: initial?.est_duration_hours ?? 24,
        is_express_available: initial?.is_express_available ?? false,
        is_active: initial?.is_active ?? true,
      },
      { keepDirty: false, keepTouched: false }
    );
  }, [isOpen, initial, form]);

  const handleSubmit = form.handleSubmit((vals) => onSubmit(normalizePayload(vals)));

  const fields: Array<FieldConfig<FormValues>> = [
    { type: "text", name: "code", label: "Kode", placeholder: "SRV001" },
    { type: "text", name: "name", label: "Nama Service", placeholder: "Cuci Kering" },
    {
      type: "radio",
      name: "pricing_model",
      label: "Pricing Model",
      options: [
        { label: "Per Kg", value: "weight" },
        { label: "Per Pcs", value: "piece" },
      ],
      inline: true,
    },
    {
      type: "currency",
      name: "base_price",
      label: "Base Price",
      prefix: "Rp",
      precision: 0,
      thousandSeparator: ".",
      decimalSeparator: ",",
      placeholder: "0",
    },
    {
      type: "number",
      name: "min_qty",
      label: "Minimal Qty",
      placeholder: "0",
      min: 0,
      step: "0.01",
    },
    {
      type: "number",
      name: "est_duration_hours",
      label: "Durasi Estimasi (jam)",
      placeholder: "24",
      min: 1,
      step: 1,
    },
    { type: "switch", name: "is_express_available", label: "Express Tersedia", size: "sm" },
    { type: "switch", name: "is_active", label: "Aktif", size: "sm" },
    { type: "textarea", name: "description", label: "Deskripsi", placeholder: "Opsional..." },
  ].filter(Boolean) as Array<FieldConfig<FormValues>>;

  const categoryError = form.formState.errors.category_id?.message as string | undefined;

  return (
    <Modal
      isOpen={isOpen}
      onClose={() => {
        if (!loading) onClose();
      }}
      title={initial ? "Edit Service" : "Tambah Service"}
      size="xl"
    >
      {/* Category menggunakan dropdown fetch/search/scroll */}
      <div className="grid grid-cols-1 gap-4 md:grid-cols-2">
        <div className="md:col-span-1">
          <label className="text-foreground mb-1 block text-sm font-medium">Kategori</label>
          <Controller
            name="category_id"
            control={form.control}
            render={({ field }) => (
              <CategorySelect
                value={field.value || ""}
                onChange={(val: any) => field.onChange(val)}
                ensureId={initial?.category_id ?? null}
                placeholder="Pilih kategori"
              />
            )}
          />
          {categoryError && <div className="text-danger mt-1 text-xs">{categoryError}</div>}
        </div>
      </div>

      {/* Field lain pakai FormRenderer */}
      <FormRenderer<FormValues>
        control={form.control}
        fields={fields}
        layout={{ mode: "grid", cols: { base: 1, md: 2, lg: 2 }, gap: "gap-4" }}
      />

      <div className="mt-6 flex items-center justify-end gap-2">
        <Button variant="outline" tone="neutral" onClick={onClose} size="sm" disabled={!!loading}>
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
