"use client";

import Button from "@/components/button/Button";
import type { Column } from "@/components/table/types";
import type { Outlet } from "@/features/outlets/useOutlets";

type Actions = {
  onEdit: (row: Outlet) => void;
  askDelete: (row: Outlet) => void;
  onDetails: (row: Outlet) => void;
};

export function makeOutletColumns({ onEdit, askDelete, onDetails }: Actions): Column<Outlet>[] {
  return [
    { id: "name", header: "Nama Outlet", field: "name", sortable: true },
    { id: "email", header: "Email", field: "email", sortable: true, width: "220px" },
    { id: "city", header: "Kota", field: "city", sortable: true, width: "160px" },

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
          <Button
            size="sm"
            roundedSize="xl"
            variant="soft"
            tone="secondary"
            onClick={() => onDetails(r)}
          >
            Details
          </Button>
        </div>
      ),
    },
  ];
}
