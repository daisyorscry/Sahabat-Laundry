"use client";

import * as React from "react";

import Button from "@/components/button/Button";
import type { Column } from "@/components/table/types";
import type { ServicePrice } from "@/features/order-service/useServicePrice";

export type MakeServicePriceColumnsOpts = {
  onEdit: (row: ServicePrice) => void;
  askDelete: (row: ServicePrice) => void;
  deletingId?: string | null;
  isDeleting?: boolean;
};

export function makeServicePriceColumns({
  onEdit,
  askDelete,
  deletingId,
  isDeleting,
}: MakeServicePriceColumnsOpts): Column<ServicePrice>[] {
  return [
    {
      id: "service",
      header: "Service",
      accessor: (r) =>
        r.service?.name
          ? `${r.service.name}${r.service.code ? ` — ${r.service.code}` : ""}`
          : r.service_id,
      sortable: true,
      width: "240px",
    },
    {
      id: "outlet",
      header: "Outlet",
      accessor: (r) =>
        r.outlet?.name
          ? `${r.outlet.name}${r.outlet.code ? ` — ${r.outlet.code}` : ""}`
          : r.outlet_id,
      sortable: true,
      width: "260px",
    },
    {
      id: "member_tier",
      header: "Tier",
      accessor: (r) => r.member_tier ?? <span className="text-slate-500 italic">NULL</span>,
      sortable: true,
      width: "120px",
    },
    {
      id: "is_express",
      header: "Express",
      accessor: (r) => (r.is_express ? "Ya" : "Tidak"),
      sortable: true,
      width: "100px",
    },
    {
      id: "price",
      header: "Harga",
      accessor: (r) => String(r.price),
      sortable: true,
      width: "140px",
    },
    {
      id: "effective_start",
      header: "Start",
      accessor: (r) => r.effective_start?.slice(0, 10) ?? r.effective_start,
      sortable: true,
      width: "130px",
    },
    {
      id: "effective_end",
      header: "End",
      accessor: (r) =>
        r.effective_end ? (
          r.effective_end.slice(0, 10)
        ) : (
          <span className="text-slate-500 italic">∞</span>
        ),
      sortable: true,
      width: "130px",
    },
    {
      id: "actions",
      header: "Aksi",
      accessor: (r) => (
        <div className="flex gap-2">
          <Button size="sm" variant="outline" tone="neutral" onClick={() => onEdit(r)}>
            Edit
          </Button>
          <Button
            size="sm"
            variant="outline"
            tone="danger"
            onClick={() => askDelete(r)}
            loading={isDeleting && deletingId === r.id}
          >
            Hapus
          </Button>
        </div>
      ),
      width: "180px",
    },
  ];
}
