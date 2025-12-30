"use client";

import Button from "@/components/button/Button";
import type { Column } from "@/components/table/types";
import type { ServiceCategory } from "@/features/order-service/useServiceCategory";

type Actions = {
  onEdit: (row: ServiceCategory) => void;
  askDelete: (row: ServiceCategory) => void;
};

export function makeServiceCategoryColumns({
  onEdit,
  askDelete,
}: Actions): Column<ServiceCategory>[] {
  return [
    { id: "code", header: "Kode", field: "code", sortable: true, width: "140px" },
    { id: "name", header: "Nama", field: "name", sortable: true },
    { id: "description", header: "Deskripsi", field: "description", sortable: false },
    {
      id: "is_active",
      header: "Aktif",
      field: "is_active",
      sortable: true,
      width: "120px",
      accessor: (r) => (
        <span
          className={[
            "inline-flex items-center rounded-full border px-2 py-0.5 text-[12px]",
            r.is_active
              ? "border-[var(--color-emerald-400)] bg-[var(--color-surface)]"
              : "border-[var(--color-border)] bg-[var(--color-surface)] opacity-70",
          ].join(" ")}
        >
          {r.is_active ? "Aktif" : "Nonaktif"}
        </span>
      ),
    },
    {
      id: "updated_at",
      header: "Diubah",
      field: "updated_at",
      sortable: true,
      width: "200px",
      accessor: (r) => new Date(r.updated_at).toLocaleString(),
    },
    {
      id: "actions",
      header: "Aksi",
      width: "280px",
      accessor: (r) => (
        <div className="flex gap-2">
          <Button
            size="sm"
            roundedSize="xl"
            variant="soft"
            tone="primary"
            onClick={() => onEdit(r)}
          >
            Edit
          </Button>
          <Button
            size="sm"
            roundedSize="xl"
            variant="soft"
            tone="danger"
            onClick={() => askDelete(r)}
          >
            Hapus
          </Button>
        </div>
      ),
    },
  ];
}
