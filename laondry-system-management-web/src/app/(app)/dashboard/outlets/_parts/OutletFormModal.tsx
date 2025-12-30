"use client";

import { zodResolver } from "@hookform/resolvers/zod";
import * as React from "react";
import { useForm } from "react-hook-form";
import { z } from "zod";

import Button from "@/components/button/Button";
import FormRenderer from "@/components/form/FormRenderer";
import type { FieldConfig } from "@/components/form/types";
import type {
  CreateOutletPayload,
  Outlet,
  UpdateOutletPayload,
} from "@/features/outlets/useOutlets";

import Modal from "../../../../../components/ui/Modal";

type Props = {
  isOpen: boolean;
  onClose: () => void;
  initial?: Outlet;
  loading?: boolean;
  onSubmit: (payload: CreateOutletPayload | UpdateOutletPayload) => void;
};

const schema = z.object({
  code: z.string().min(1, "Kode wajib").max(50, "Maks 50 karakter"),
  name: z.string().min(1, "Nama wajib").max(150, "Maks 150 karakter"),
  phone: z.union([z.string().max(50), z.literal("")]).optional(),
  email: z.union([z.string().email("Email tidak valid").max(150), z.literal("")]).optional(),
  address_line: z.union([z.string().max(255), z.literal("")]).optional(),
  city: z.union([z.string().max(100), z.literal("")]).optional(),
  province: z.union([z.string().max(100), z.literal("")]).optional(),
  postal_code: z.union([z.string().max(20), z.literal("")]).optional(),
  is_active: z.boolean().optional(),
});
type FormValues = z.infer<typeof schema>;

function normalizeToNullableStrings(v: FormValues): CreateOutletPayload | UpdateOutletPayload {
  return {
    code: v.code.trim(),
    name: v.name.trim(),
    phone: v.phone ? v.phone : null,
    email: v.email ? v.email : null,
    address_line: v.address_line ? v.address_line : null,
    city: v.city ? v.city : null,
    province: v.province ? v.province : null,
    postal_code: v.postal_code ? v.postal_code : null,
    is_active: v.is_active ?? true,
  };
}

const fields: Array<FieldConfig<FormValues>> = [
  {
    type: "text",
    name: "code",
    label: "Kode",
    placeholder: "OUT001",
    rightIcon: null,
    leftIcon: null,
  },
  {
    type: "text",
    name: "name",
    label: "Nama Outlet",
    placeholder: "Outlet Jakarta",
    rightIcon: null,
  },
  { type: "tel", name: "phone", label: "Telepon", placeholder: "08xxxxxxxxxx" },
  { type: "email", name: "email", label: "Email", placeholder: "nama@contoh.com", rightIcon: null },
  {
    type: "text",
    name: "address_line",
    label: "Alamat",
    placeholder: "Jalan, No, RT/RW",
    rightIcon: null,
  },
  { type: "text", name: "city", label: "Kota", placeholder: "Jakarta", rightIcon: null },
  {
    type: "text",
    name: "province",
    label: "Provinsi",
    placeholder: "DKI Jakarta",
    rightIcon: null,
  },
  { type: "text", name: "postal_code", label: "Kode Pos", placeholder: "12345", rightIcon: null },
  { type: "switch", name: "is_active", label: "Aktif", size: "sm" },
];

export default function OutletFormDialog({ isOpen, onClose, initial, loading, onSubmit }: Props) {
  const form = useForm<FormValues>({
    resolver: zodResolver(schema),
    mode: "onChange",
    defaultValues: {
      code: initial?.code ?? "",
      name: initial?.name ?? "",
      phone: initial?.phone ?? "",
      email: initial?.email ?? "",
      address_line: initial?.address_line ?? "",
      city: initial?.city ?? "",
      province: initial?.province ?? "",
      postal_code: initial?.postal_code ?? "",
      is_active: initial?.is_active ?? true,
    },
  });

  React.useEffect(() => {
    if (!isOpen) return;
    form.reset(
      {
        code: initial?.code ?? "",
        name: initial?.name ?? "",
        phone: initial?.phone ?? "",
        email: initial?.email ?? "",
        address_line: initial?.address_line ?? "",
        city: initial?.city ?? "",
        province: initial?.province ?? "",
        postal_code: initial?.postal_code ?? "",
        is_active: initial?.is_active ?? true,
      },
      { keepDirty: false, keepTouched: false }
    );
  }, [isOpen, initial, form]);

  const handleSubmit = form.handleSubmit((vals) => {
    const payload = normalizeToNullableStrings(vals);
    onSubmit(payload);
  });

  return (
    <Modal
      isOpen={isOpen}
      onClose={() => {
        if (!loading) onClose();
      }}
      title={initial ? "Edit Outlet" : "Tambah Outlet"}
      size="lg"
    >
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
