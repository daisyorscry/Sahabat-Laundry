"use client";

import * as React from "react";
import { zodResolver } from "@hookform/resolvers/zod";
import { Controller, Resolver, useForm } from "react-hook-form";
import { z } from "zod";

import Button from "@/components/button/Button";
import FormRenderer from "@/components/form/FormRenderer";
import type { FieldConfig } from "@/components/form/types";
import Modal from "../../../../../components/ui/Modal";

import type {
  CreateServicePricePayload,
  ServicePrice,
  UpdateServicePricePayload,
} from "@/features/order-service/useServicePrice";
import ServiceSelect from "../../services/parts/ServiceSelect";
import OutletSelect from "../../outlets/_parts/OutletSelect";


type Props = {
  isOpen: boolean;
  onClose: () => void;
  initial?: ServicePrice;
  loading?: boolean;
  onSubmit: (payload: CreateServicePricePayload | UpdateServicePricePayload) => void;
};

const schema = z
  .object({
    service_id: z.string().min(1, "Service wajib").max(64),
    outlet_id: z.string().min(1, "Outlet wajib").max(64),
    member_tier: z.union([z.string().max(50), z.literal(""), z.null()]).optional(),
    is_express: z.boolean().optional(),
    price: z
      .union([z.string(), z.number()])
      .transform((v) => (typeof v === "number" ? String(v) : v.trim()))
      .refine((v) => /^(\d+)([.,]\d{1,2})?$/.test(v) && parseFloat(v.replace(",", ".")) >= 0, {
        message: "Format harga tidak valid (maks 2 desimal, ≥ 0)",
      }),
    effective_start: z
      .string()
      .min(1, "Tanggal mulai wajib")
      .refine((v) => /^\d{4}-\d{2}-\d{2}$/.test(v), "Format YYYY-MM-DD"),
    effective_end: z
      .union([z.string(), z.literal(""), z.null()])
      .optional()
      .refine(
        (v) => v === "" || v === null || /^\d{4}-\d{2}-\d{2}$/.test(String(v)),
        "Format YYYY-MM-DD"
      ),
  })
  .refine(
    (data) =>
      !data.effective_end ||
      data.effective_end === "" ||
      new Date(String(data.effective_end)) >= new Date(data.effective_start),
    {
      path: ["effective_end"],
      message: "Tanggal akhir harus ≥ tanggal mulai",
    }
  );

type FormValues = z.infer<typeof schema>;

// cast untuk bypass mismatch typing zod ↔ RHF (seperti contohmu)
const resolver = zodResolver(schema) as unknown as Resolver<FormValues>;

function normalizePayload(v: FormValues): CreateServicePricePayload | UpdateServicePricePayload {
  return {
    service_id: v.service_id.trim(),
    outlet_id: v.outlet_id.trim(),
    member_tier:
      v.member_tier === "" ? null : v.member_tier === undefined ? null : (v.member_tier as string | null),
    is_express: v.is_express ?? false,
    price: v.price.replace(",", "."), // kirim desimal titik ke backend
    effective_start: v.effective_start,
    effective_end: v.effective_end === "" ? null : ((v.effective_end as string | null | undefined) ?? null),
  };
}

export default function ServicePriceFormModal({
  isOpen,
  onClose,
  initial,
  loading,
  onSubmit,
}: Props) {
  // Helper to convert ISO datetime to YYYY-MM-DD
  const toDateOnly = (dateStr: string | null | undefined): string => {
    if (!dateStr) return "";
    // Extract YYYY-MM-DD from ISO string like "2025-10-01T00:00:00.000000Z"
    return dateStr.split("T")[0] || "";
  };

  const form = useForm<FormValues>({
    resolver,
    mode: "onChange",
    defaultValues: {
      service_id: initial?.service_id ?? "",
      outlet_id: initial?.outlet_id ?? "",
      member_tier: initial?.member_tier ?? "",
      is_express: initial?.is_express ?? false,
      price: String(initial?.price ?? ""),
      effective_start: toDateOnly(initial?.effective_start),
      effective_end: toDateOnly(initial?.effective_end),
    },
  });

  React.useEffect(() => {
    if (!isOpen) return;
    form.reset(
      {
        service_id: initial?.service_id ?? "",
        outlet_id: initial?.outlet_id ?? "",
        member_tier: initial?.member_tier ?? "",
        is_express: initial?.is_express ?? false,
        price: String(initial?.price ?? ""),
        effective_start: toDateOnly(initial?.effective_start),
        effective_end: toDateOnly(initial?.effective_end),
      },
      { keepDirty: false, keepTouched: false }
    );
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [isOpen, initial]);

  const handleSubmit = form.handleSubmit((vals) => onSubmit(normalizePayload(vals)));

  // field selain service/outlet tetap via FormRenderer
  const fields: Array<FieldConfig<FormValues>> = [
    {
      type: "text",
      name: "member_tier",
      label: "Member Tier",
      placeholder: "GOLD / SILVER (kosongkan untuk NULL)",
      rightIcon: null,
    },
    { type: "switch", name: "is_express", label: "Express", size: "sm" },
    {
      type: "currency",
      name: "price",
      label: "Harga",
      prefix: "Rp",
      precision: 2,
      thousandSeparator: ".",
      decimalSeparator: ",",
      placeholder: "0",
    },
    { type: "date", name: "effective_start", label: "Mulai Berlaku" },
    { type: "date", name: "effective_end", label: "Akhir Berlaku" },
  ] as Array<FieldConfig<FormValues>>;

  const svcErr = form.formState.errors.service_id?.message as string | undefined;
  const outletErr = form.formState.errors.outlet_id?.message as string | undefined;

  return (
    <Modal
      isOpen={isOpen}
      onClose={() => {
        if (!loading) onClose();
      }}
      title={initial ? "Edit Service Price" : "Tambah Service Price"}
      size="lg"
    >
      {/* Dropdown Service & Outlet */}
      <div className="grid grid-cols-1 gap-4 md:grid-cols-2">
        <div className="md:col-span-1">
          <label className="text-foreground mb-1 block text-sm font-medium">
            Service {initial && <span className="text-xs opacity-60">(tidak bisa diubah)</span>}
          </label>
          <Controller
            name="service_id"
            control={form.control}
            render={({ field }) => (
              <ServiceSelect
                value={field.value || ""}
                onChange={(val) => field.onChange(val)}
                ensureId={initial?.service_id ?? null}
                placeholder="Pilih service"
                disabled={!!initial}
              />
            )}
          />
          {svcErr && <div className="text-danger mt-1 text-xs">{svcErr}</div>}
        </div>

        <div className="md:col-span-1">
          <label className="text-foreground mb-1 block text-sm font-medium">
            Outlet {initial && <span className="text-xs opacity-60">(tidak bisa diubah)</span>}
          </label>
          <Controller
            name="outlet_id"
            control={form.control}
            render={({ field }) => (
              <OutletSelect
                value={field.value || ""}
                onChange={(val) => field.onChange(val)}
                ensureId={initial?.outlet_id ?? null}
                placeholder="Pilih outlet"
                disabled={!!initial}
              />
            )}
          />
          {outletErr && <div className="text-danger mt-1 text-xs">{outletErr}</div>}
        </div>
      </div>

      {/* Field lain */}
      <FormRenderer<FormValues>
        control={form.control}
        fields={fields}
        layout={{
          mode: "grid",
          cols: { base: 1, md: 2, lg: 2 },
          gap: "gap-4",
        }}
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
