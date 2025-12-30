"use client";

import Button from "@/components/button/Button";
import type { Column } from "@/components/table/types";
import type { Customer } from "@/features/order-service/useCustomer";

type Actions = {
  onEdit: (row: Customer) => void;
  onViewDetail: (row: Customer) => void;
  askDelete: (row: Customer) => void;
  onBan: (row: Customer) => void;
  onUnban: (row: Customer) => void;
};

export function makeCustomerColumns({
  onEdit,
  onViewDetail,
  askDelete,
  onBan,
  onUnban,
}: Actions): Column<Customer>[] {
  return [
    {
      id: "full_name",
      header: "Nama Lengkap",
      field: "full_name",
      sortable: true,
      width: "200px",
      accessor: (r) => (
        <div className="flex items-center gap-2">
          {r.avatar_url && (
            <img
              src={r.avatar_url}
              alt={r.full_name}
              className="h-8 w-8 rounded-full object-cover"
            />
          )}
          <div>
            <div className="font-medium">{r.full_name}</div>
            {r.is_member && (
              <span className="text-xs text-[var(--color-amber-500)]">★ Member</span>
            )}
          </div>
        </div>
      ),
    },
    {
      id: "contact",
      header: "Kontak",
      width: "220px",
      accessor: (r) => (
        <div className="text-sm">
          <div>{r.phone_number}</div>
          {r.email && <div className="text-xs opacity-70">{r.email}</div>}
        </div>
      ),
    },
    {
      id: "balance",
      header: "Saldo",
      field: "balance",
      sortable: true,
      width: "120px",
      accessor: (r) => (
        <div className="font-mono text-sm">
          Rp {parseFloat(r.balance).toLocaleString("id-ID")}
        </div>
      ),
    },
    {
      id: "addresses_count",
      header: "Alamat",
      width: "80px",
      accessor: (r) => (
        <div className="text-center text-sm">{r.addresses_count ?? 0}</div>
      ),
    },
    {
      id: "is_active",
      header: "Status",
      field: "is_active",
      sortable: true,
      width: "140px",
      accessor: (r) => (
        <div>
          <span
            className={[
              "inline-flex items-center rounded-full border px-2 py-0.5 text-[12px]",
              r.is_active
                ? "border-[var(--color-emerald-400)] bg-[var(--color-surface)]"
                : "border-[var(--color-red-400)] bg-[var(--color-surface)]",
            ].join(" ")}
          >
            {r.is_active ? "Aktif" : "Banned"}
          </span>
          {r.banned_reason && (
            <div className="mt-1 text-xs text-[var(--color-red-500)]">{r.banned_reason}</div>
          )}
        </div>
      ),
    },
    {
      id: "customer_status",
      header: "Tier",
      width: "120px",
      accessor: (r) => (
        <div className="text-sm">
          {r.customer_status ? (
            <span className="rounded border border-[var(--color-border)] bg-[var(--color-surface)] px-2 py-0.5 text-xs">
              {r.customer_status.code}
            </span>
          ) : (
            <span className="text-xs opacity-50">-</span>
          )}
        </div>
      ),
    },
    {
      id: "created_at",
      header: "Terdaftar",
      field: "created_at",
      sortable: true,
      width: "140px",
      accessor: (r) => (
        <div className="text-xs">{new Date(r.created_at).toLocaleDateString("id-ID")}</div>
      ),
    },
    {
      id: "actions",
      header: "Aksi",
      width: "360px",
      accessor: (r) => (
        <div className="flex flex-wrap gap-2">
          <Button
            size="sm"
            roundedSize="xl"
            variant="soft"
            tone="primary"
            onClick={() => onViewDetail(r)}
          >
            Detail
          </Button>
          <Button
            size="sm"
            roundedSize="xl"
            variant="soft"
            tone="secondary"
            onClick={() => onEdit(r)}
          >
            Edit
          </Button>
          {r.is_active ? (
            <Button
              size="sm"
              roundedSize="xl"
              variant="soft"
              tone="warning"
              onClick={() => onBan(r)}
            >
              Ban
            </Button>
          ) : (
            <Button
              size="sm"
              roundedSize="xl"
              variant="soft"
              tone="success"
              onClick={() => onUnban(r)}
            >
              Unban
            </Button>
          )}
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
