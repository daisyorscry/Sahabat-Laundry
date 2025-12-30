"use client";

import * as React from "react";
import { Control } from "react-hook-form";

import Button from "@/components/button/Button";
import TextField from "@/components/form/fields/TextField";
import Dropdown from "@/components/partials/Dropdown";
import Modal from "@/components/ui/Modal";

import type { Filters } from "./types";

type Props = {
  isOpen: boolean;
  onClose: () => void;
  control: Control<Filters>;
  nextStatus: string;
  setNextStatus: (v: string) => void;
  statusOptions: { value: string; label: string }[];
  onSave: () => Promise<void>;
  saving: boolean;
};

export default function ChangeStatusModal({
  isOpen,
  onClose,
  control,
  nextStatus,
  setNextStatus,
  statusOptions,
  onSave,
  saving,
}: Props) {
  return (
    <Modal isOpen={isOpen} onClose={onClose} title="Change Status" size="md">
      <div className="space-y-3">
        <div>
          <label className="text-foreground mb-1 block text-sm font-medium">Status Baru</label>
          <Dropdown
            value={nextStatus}
            onChange={setNextStatus}
            options={statusOptions}
            placeholder="Pilih status"
          />
        </div>
        <div>
          <TextField
            control={control}
            field={{
              type: "text",
              name: "__note",
              label: "Catatan (opsional)",
              placeholder: "Tambahkan catatan",
            }}
          />
        </div>
        <div className="flex justify-end gap-2 pt-1">
          <Button variant="outline" tone="neutral" onClick={onClose}>
            Batal
          </Button>
          <Button onClick={onSave} disabled={saving || !nextStatus}>
            Simpan
          </Button>
        </div>
      </div>
    </Modal>
  );
}
