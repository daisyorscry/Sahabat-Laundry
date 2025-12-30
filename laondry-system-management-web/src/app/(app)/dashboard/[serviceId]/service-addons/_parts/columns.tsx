// app/admin/services/[serviceId]/addons/_parts/columns.tsx
"use client";

import Button from "@/components/button/Button";
import type { Column } from "@/components/table/types";
import type { ServiceAddonItem } from "@/features/order-service/useServiceAddons";

type Actions = {
  onToggleRequired: (row: ServiceAddonItem) => void;
  askDetach: (row: ServiceAddonItem) => void;
};

export function makeServiceAddonColumns({
  onToggleRequired,
  askDetach,
}: Actions): Column<ServiceAddonItem>[] {
  return [
    { id: "code", header: "Kode", field: "code", sortable: true, width: "140px" },
    { id: "name", header: "Nama", field: "name", sortable: true },
    {
      id: "is_active",
      header: "Aktif",
      field: "is_active",
      sortable: true,
      width: "110px",
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
      id: "is_required",
      header: "Required",
      sortable: true,
      width: "140px",
      accessor: (r) => (
        <button
          type="button"
          className={[
            "inline-flex items-center rounded-full border px-3 py-1 text-[12px]",
            r.pivot?.is_required
              ? "border-[var(--color-sky-500)] text-[var(--color-sky-700)]"
              : "border-[var(--color-border)] text-[var(--color-muted-foreground)]",
          ].join(" ")}
          onClick={() => onToggleRequired(r)}
          title="Toggle required"
        >
          {r.pivot?.is_required ? "Required" : "Optional"}
        </button>
      ),
    },
    {
      id: "attached_at",
      header: "Dipasang",
      sortable: true,
      width: "200px",
      accessor: (r) =>
        r.pivot?.attached_at ? new Date(r.pivot.attached_at).toLocaleString() : "-",
    },
    {
      id: "actions",
      header: "Aksi",
      width: "220px",
      accessor: (r) => (
        <div className="flex gap-2">
          <Button
            size="sm"
            roundedSize="xl"
            variant="soft"
            tone={r.pivot?.is_required ? "neutral" : "warning"}
            onClick={() => onToggleRequired(r)}
          >
            {r.pivot?.is_required ? "Unset Required" : "Set Required"}
          </Button>
          <Button
            size="sm"
            roundedSize="xl"
            variant="soft"
            tone="danger"
            onClick={() => askDetach(r)}
          >
            Lepas
          </Button>
        </div>
      ),
    },
  ];
}
