"use client";

import Button from "@/components/button/Button";

import Modal from "./Modal";

type Props = {
  isOpen: boolean;
  onClose: () => void;
  onConfirm: () => void;
  title?: string;
  description?: string;
  confirmText?: string;
  cancelText?: string;
  loading?: boolean;
};

export default function ConfirmModal({
  isOpen,
  onClose,
  onConfirm,
  title = "Konfirmasi",
  description,
  confirmText = "Ya",
  cancelText = "Batal",
  loading,
}: Props) {
  return (
    <Modal isOpen={isOpen} onClose={() => (!loading ? onClose() : undefined)} title={title}>
      {description && <p className="mb-6 text-sm">{description}</p>}

      <div className="mt-4 flex justify-end gap-2">
        <Button variant="outline" tone="neutral" onClick={onClose} disabled={!!loading}>
          {cancelText}
        </Button>
        <Button
          variant="solid"
          tone="danger"
          onClick={onConfirm}
          disabled={!!loading}
          loading={loading}
          loadingText="Memproses..."
        >
          {confirmText}
        </Button>
      </div>
    </Modal>
  );
}
