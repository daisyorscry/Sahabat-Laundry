"use client";

import * as React from "react";
import { zodResolver } from "@hookform/resolvers/zod";
import { useForm } from "react-hook-form";
import { z } from "zod";

import Button from "@/components/button/Button";
import FormRenderer from "@/components/form/FormRenderer";
import type { FieldConfig } from "@/components/form/types";
import Modal from "@/components/ui/Modal";
import type {
  CreateCustomerPayload,
  Customer,
  UpdateCustomerPayload,
} from "@/features/order-service/useCustomer";

type Props = {
  isOpen: boolean;
  onClose: () => void;
  initial?: Customer;
  loading?: boolean;
  onSubmit: (payload: CreateCustomerPayload | UpdateCustomerPayload) => void;
};

const createSchema = z.object({
  full_name: z.string().min(1, "Nama lengkap wajib").max(255, "Maks 255 karakter"),
  email: z.union([z.string().email("Email tidak valid"), z.literal(""), z.null()]).optional(),
  phone_number: z.string().min(1, "Nomor telepon wajib").max(20, "Maks 20 karakter"),
  password: z.union([z.string().min(6, "Minimal 6 karakter"), z.literal(""), z.null()]).optional(),
  pin: z
    .union([z.string().min(4, "Minimal 4 digit").max(6, "Maks 6 digit"), z.literal(""), z.null()])
    .optional(),
  is_active: z.boolean().optional(),
  is_member: z.boolean().optional(),
  balance: z.union([z.number(), z.string()]).optional(),
});

const updateSchema = createSchema.partial();

type FormValues = z.infer<typeof createSchema>;

function normalize(
  v: FormValues,
  isEdit: boolean
): CreateCustomerPayload | UpdateCustomerPayload {
  const base: any = {
    full_name: v.full_name?.trim(),
    email: v.email && v.email.trim() !== "" ? v.email.trim() : null,
    phone_number: v.phone_number?.trim(),
    is_active: v.is_active ?? true,
    is_member: v.is_member ?? false,
    balance: typeof v.balance === "string" ? parseFloat(v.balance) || 0 : v.balance || 0,
  };

  if (!isEdit) {
    base.password = v.password && v.password.trim() !== "" ? v.password : null;
    base.pin = v.pin && v.pin.trim() !== "" ? v.pin : null;
  } else {
    if (v.password && v.password.trim() !== "") base.password = v.password;
    if (v.pin && v.pin.trim() !== "") base.pin = v.pin;
  }

  return base;
}

const createFields: Array<FieldConfig<FormValues>> = [
  { type: "text", name: "full_name", label: "Nama Lengkap", placeholder: "John Doe" },
  { type: "email", name: "email", label: "Email", placeholder: "john@example.com" },
  { type: "text", name: "phone_number", label: "Nomor Telepon", placeholder: "08123456789" },
  { type: "password", name: "password", label: "Password", placeholder: "Minimal 6 karakter" },
  { type: "text", name: "pin", label: "PIN", placeholder: "4-6 digit" },
  { type: "number", name: "balance", label: "Saldo Awal", placeholder: "0", step: "1000" },
  { type: "switch", name: "is_member", label: "Member Premium", size: "sm" },
  { type: "switch", name: "is_active", label: "Aktif", size: "sm" },
];

const updateFields: Array<FieldConfig<FormValues>> = [
  { type: "text", name: "full_name", label: "Nama Lengkap", placeholder: "John Doe" },
  { type: "email", name: "email", label: "Email", placeholder: "john@example.com" },
  { type: "text", name: "phone_number", label: "Nomor Telepon", placeholder: "08123456789" },
  {
    type: "password",
    name: "password",
    label: "Password Baru",
    placeholder: "Kosongkan jika tidak ingin mengubah",
  },
  {
    type: "text",
    name: "pin",
    label: "PIN Baru",
    placeholder: "Kosongkan jika tidak ingin mengubah",
  },
  { type: "number", name: "balance", label: "Saldo", placeholder: "0", step: "1000" },
  { type: "switch", name: "is_member", label: "Member Premium", size: "sm" },
  { type: "switch", name: "is_active", label: "Aktif", size: "sm" },
];

export default function CustomerFormDialog({ isOpen, onClose, initial, loading, onSubmit }: Props) {
  const isEdit = !!initial;
  const form = useForm<FormValues>({
    resolver: zodResolver(isEdit ? updateSchema : createSchema),
    mode: "onChange",
    defaultValues: {
      full_name: initial?.full_name ?? "",
      email: initial?.email ?? "",
      phone_number: initial?.phone_number ?? "",
      password: "",
      pin: "",
      is_active: initial?.is_active ?? true,
      is_member: initial?.is_member ?? false,
      balance: initial?.balance ? parseFloat(initial.balance) : 0,
    },
  });

  React.useEffect(() => {
    if (!isOpen) return;
    form.reset(
      {
        full_name: initial?.full_name ?? "",
        email: initial?.email ?? "",
        phone_number: initial?.phone_number ?? "",
        password: "",
        pin: "",
        is_active: initial?.is_active ?? true,
        is_member: initial?.is_member ?? false,
        balance: initial?.balance ? parseFloat(initial.balance) : 0,
      },
      { keepDirty: false, keepTouched: false }
    );
  }, [isOpen, initial, form]);

  const handleSubmit = form.handleSubmit((vals) => {
    onSubmit(normalize(vals, isEdit));
  });

  return (
    <Modal
      isOpen={isOpen}
      onClose={() => {
        if (!loading) onClose();
      }}
      title={initial ? "Edit Customer" : "Tambah Customer"}
      size="2xl"
    >
      <FormRenderer<FormValues>
        control={form.control}
        fields={isEdit ? updateFields : createFields}
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
          {initial ? "Simpan Perubahan" : "Tambah Customer"}
        </Button>
      </div>
    </Modal>
  );
}
