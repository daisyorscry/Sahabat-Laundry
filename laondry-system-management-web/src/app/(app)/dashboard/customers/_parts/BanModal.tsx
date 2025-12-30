"use client";

import * as React from "react";
import { zodResolver } from "@hookform/resolvers/zod";
import { useForm } from "react-hook-form";
import { z } from "zod";

import Button from "@/components/button/Button";
import FormRenderer from "@/components/form/FormRenderer";
import type { FieldConfig } from "@/components/form/types";
import Modal from "@/components/ui/Modal";
import type { Customer } from "@/features/order-service/useCustomer";

type Props = {
  isOpen: boolean;
  onClose: () => void;
  customer?: Customer;
  loading?: boolean;
  onConfirm: (reason: string) => void;
};

const schema = z.object({
  banned_reason: z.string().min(1, "Alasan ban wajib diisi").max(500, "Maks 500 karakter"),
});
type FormValues = z.infer<typeof schema>;

const fields: Array<FieldConfig<FormValues>> = [
  {
    type: "textarea",
    name: "banned_reason",
    label: "Alasan Ban",
    placeholder: "Contoh: Spam, Abuse, Violated terms, dll",
    rows: 4,
  },
];

export default function BanModal({ isOpen, onClose, customer, loading, onConfirm }: Props) {
  const form = useForm<FormValues>({
    resolver: zodResolver(schema),
    mode: "onChange",
    defaultValues: {
      banned_reason: "",
    },
  });

  React.useEffect(() => {
    if (!isOpen) return;
    form.reset({ banned_reason: "" }, { keepDirty: false, keepTouched: false });
  }, [isOpen, form]);

  const handleSubmit = form.handleSubmit((vals) => {
    onConfirm(vals.banned_reason.trim());
  });

  return (
    <Modal
      isOpen={isOpen}
      onClose={() => {
        if (!loading) onClose();
      }}
      title="Ban Customer"
      size="lg"
    >
      <div className="mb-4 rounded-lg bg-[var(--color-amber-50)] p-4 dark:bg-[var(--color-amber-900)]">
        <p className="text-sm">
          Anda akan mem-ban customer <strong>{customer?.full_name}</strong>. Customer yang di-ban
          tidak dapat menggunakan layanan hingga di-unban kembali.
        </p>
      </div>

      <FormRenderer<FormValues>
        control={form.control}
        fields={fields}
        layout={{ mode: "grid", cols: { base: 1 }, gap: "gap-4" }}
      />

      <div className="mt-6 flex items-center justify-end gap-2">
        <Button variant="outline" tone="neutral" onClick={onClose} size="sm" disabled={!!loading}>
          Batal
        </Button>
        <Button
          variant="solid"
          tone="danger"
          size="sm"
          onClick={handleSubmit}
          disabled={!!loading || !form.formState.isValid}
          loading={loading}
          loadingText="Membanning..."
        >
          Ban Customer
        </Button>
      </div>
    </Modal>
  );
}
