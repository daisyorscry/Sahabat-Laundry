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
  CreateServiceCategoryPayload,
  ServiceCategory,
  UpdateServiceCategoryPayload,
} from "@/features/order-service/useServiceCategory";

type Props = {
  isOpen: boolean;
  onClose: () => void;
  initial?: ServiceCategory;
  loading?: boolean;
  onSubmit: (payload: CreateServiceCategoryPayload | UpdateServiceCategoryPayload) => void;
};

const schema = z.object({
  code: z.string().min(1, "Kode wajib").max(50, "Maks 50 karakter"),
  name: z.string().min(1, "Nama wajib").max(100, "Maks 100 karakter"),
  description: z.union([z.string().max(500), z.literal(""), z.null()]).optional(),
  is_active: z.boolean().optional(),
});
type FormValues = z.infer<typeof schema>;

function normalize(v: FormValues): CreateServiceCategoryPayload | UpdateServiceCategoryPayload {
  return {
    code: v.code.trim(),
    name: v.name.trim(),
    description: v.description ? v.description : null,
    is_active: v.is_active ?? true,
  };
}

const fields: Array<FieldConfig<FormValues>> = [
  { type: "text", name: "code", label: "Kode", placeholder: "CAT001" },
  { type: "text", name: "name", label: "Nama Kategori", placeholder: "Cuci Kiloan" },
  { type: "textarea", name: "description", label: "Deskripsi", placeholder: "Opsional", rows: 4 },
  { type: "switch", name: "is_active", label: "Aktif", size: "sm" },
];

export default function ServiceCategoryFormDialog({
  isOpen,
  onClose,
  initial,
  loading,
  onSubmit,
}: Props) {
  const form = useForm<FormValues>({
    resolver: zodResolver(schema),
    mode: "onChange",
    defaultValues: {
      code: initial?.code ?? "",
      name: initial?.name ?? "",
      description: initial?.description ?? "",
      is_active: initial?.is_active ?? true,
    },
  });

  React.useEffect(() => {
    if (!isOpen) return;
    form.reset(
      {
        code: initial?.code ?? "",
        name: initial?.name ?? "",
        description: initial?.description ?? "",
        is_active: initial?.is_active ?? true,
      },
      { keepDirty: false, keepTouched: false }
    );
  }, [isOpen, initial, form]);

  const handleSubmit = form.handleSubmit((vals) => {
    onSubmit(normalize(vals));
  });

  return (
    <Modal
      isOpen={isOpen}
      onClose={() => {
        if (!loading) onClose();
      }}
      title={initial ? "Edit Kategori" : "Tambah Kategori"}
      size="lg"
    >
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
