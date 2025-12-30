/* eslint-disable @typescript-eslint/no-explicit-any */
"use client";

import * as React from "react";
import { useForm, type Resolver } from "react-hook-form";
import { z } from "zod";
import { zodResolver } from "@hookform/resolvers/zod";

import Modal from "@/components/ui/Modal";
import Button from "@/components/button/Button";
import FormRenderer from "@/components/form/FormRenderer";
import type { FieldConfig, SelectOption } from "@/components/form/types";
import { api } from "@/lib/axios/api";
import type { Addon } from "@/features/order-service/useAddons";

type FormValues = {
  addon_id: string;
  is_required?: boolean;
};

const schema: z.ZodType<FormValues> = z.object({
  addon_id: z.string().uuid("Pilih addon yang valid"),
  is_required: z.boolean().optional(),
});

type Props = {
  isOpen: boolean;
  onClose: () => void;
  onSubmit: (payload: FormValues) => void;
  loading?: boolean;
};

async function loadAddons(q: string, signal?: AbortSignal): Promise<SelectOption[]> {
  const p = new URLSearchParams();
  if (q) p.set("q", q);
  p.set("is_active", "true");
  p.set("per_page", "10");
  p.set("page", "1");

  const res = await api().get(`/addons?${p.toString()}`, { signal });
  const items = (res.data?.data?.items ?? []) as Addon[];
  return items.map((x) => ({ value: x.id, label: `${x.code} — ${x.name}` }));
}

export default function AttachAddonModal({ isOpen, onClose, onSubmit, loading }: Props) {
  const resolver = zodResolver(schema) as unknown as Resolver<FormValues>;

  const form = useForm<FormValues>({
    resolver,
    mode: "onChange",
    defaultValues: { addon_id: "", is_required: false },
  });

  React.useEffect(() => {
    if (!isOpen) return;
    form.reset({ addon_id: "", is_required: false }, { keepDirty: false, keepTouched: false });
  }, [isOpen, form]);

  const fields: Array<FieldConfig<FormValues>> = [
    {
      type: "async-select",
      name: "addon_id",
      label: "Addon",
      placeholder: "Cari kode/nama addon…",
      minChars: 2,
      debounceMs: 300,
      emptyText: "Tidak ada addon",
      loadOptions: loadAddons,
    },
    { type: "switch", name: "is_required", label: "Required?", size: "sm" },
  ];

  const handleSubmit = form.handleSubmit((vals) => onSubmit(vals));

  return (
    <Modal
      isOpen={isOpen}
      onClose={() => (loading ? undefined : onClose())}
      title="Pasang Addon ke Service"
      size="lg"
    >
      <FormRenderer<FormValues>
        control={form.control}
        fields={fields}
        layout={{ mode: "grid", cols: { base: 1, md: 1, lg: 1 }, gap: "gap-4" }}
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
          loadingText="Memasang…"
        >
          Pasang
        </Button>
      </div>
    </Modal>
  );
}
