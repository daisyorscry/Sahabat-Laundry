"use client";

import Button from "@/components/button/Button";
import type { Column } from "@/components/table/types";
import type { Service } from "@/features/order-service/useService";

type Actions = {
  onEdit: (row: Service) => void;
  askDelete: (row: Service) => void;
  onDetails: (row: Service) => void;
  onManageAddons: (row: Service) => void;
};

const fmtRp = (n?: string | number | null) =>
  new Intl.NumberFormat("id-ID", { style: "currency", currency: "IDR" }).format(Number(n ?? 0));

export function makeServiceColumns({
  onEdit,
  askDelete,
  onDetails,
  onManageAddons,
}: Actions): Column<Service>[] {
  return [
    { id: "name", header: "Nama", field: "name", sortable: true, width: "220px" },
    { id: "code", header: "Kode", field: "code", sortable: true, width: "140px" },

    {
      id: "category",
      header: "Kategori",
      width: "180px",
      accessor: (r) => r.category?.name ?? "—",
      sortable: false,
    },

    {
      id: "pricing_model",
      header: "Pricing",
      width: "120px",
      sortable: true,
      accessor: (r) => (r.pricing_model === "weight" ? "Per Kg" : "Per Pcs"),
    },

    {
      id: "base_price",
      header: "Base Price",
      width: "140px",
      sortable: true,
      accessor: (r) => fmtRp(r.base_price),
    },

    {
      id: "express",
      header: "Express",
      width: "110px",
      sortable: true,
      accessor: (r) => (r.is_express_available ? "Tersedia" : "Tidak"),
    },

    {
      id: "usage",
      header: "Dipakai",
      width: "110px",
      accessor: (r) => `${r.order_items_count ?? 0}x`,
      sortable: false,
    },

    {
      id: "is_active",
      header: "Aktif",
      width: "90px",
      sortable: true,
      accessor: (r) => (r.is_active ? "Ya" : "Tidak"),
    },
    {
      id: "actions",
      header: "Aksi",
      width: "300px",
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
            tone="secondary"
            onClick={() => onDetails(r)}
          >
            Details
          </Button>
          <Button
            size="sm"
            roundedSize="xl"
            variant="soft"
            tone="neutral"
            onClick={() => onManageAddons(r)}
          >
            Manage Addons
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
