// components/admin/addons/AddonsTable.columns.tsx
"use client";

import Button from "@/components/button/Button";
import type { Column } from "@/components/table/types";
import type { Addon } from "@/features/order-service/useAddons";

type Actions = {
  onEdit: (row: Addon) => void;
  askDelete: (row: Addon) => void;
};

function formatIDR(n: string | number) {
  const v = typeof n === "string" ? Number(n) : n;
  if (Number.isNaN(v)) return "-";
  return new Intl.NumberFormat("id-ID", {
    style: "currency",
    currency: "IDR",
    maximumFractionDigits: 0,
  }).format(v);
}

export function makeAddonColumns({ onEdit, askDelete }: Actions): Column<Addon>[] {
  return [
    { id: "code", header: "Kode", field: "code", sortable: true, width: "140px" },
    { id: "name", header: "Nama", field: "name", sortable: true },

    {
      id: "price",
      header: "Harga",
      field: "price",
      sortable: true,
      width: "160px",
      accessor: (r) => <span className="tabular-nums">{formatIDR(r.price)}</span>,
    },

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
      accessor: (r) => new Date(r.updated_at || r.created_at).toLocaleString(),
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
