// src/app/(app)/outlets/page.tsx
"use client";

import * as React from "react";

import Button from "@/components/button/Button";
import HeaderBar from "@/components/layouts/page/HeaderBar";
// Layout primitives
import { PageContainer } from "@/components/layouts/page/Page";
import Surface from "@/components/layouts/page/Surface";
import TablePanel from "@/components/table/TablePanel";
import { Column, PaginationState, Sort } from "@/components/table/types";
import { useFormTheme } from "@/components/theme/formTheme";

// src/app/(app)/outlets/page.tsx

// (komponen DataTable, Toolbar, Pagination sudah dipakai via TablePanel)
type Outlet = { id: string; code: string; name: string; is_active: boolean; created_at: string };

const data: Outlet[] = [
  {
    id: "outlet-1",
    code: "OUT001",
    name: "Outlet Jakarta",
    is_active: true,
    created_at: new Date("2025-01-15T10:00:00Z").toISOString(),
  },
  {
    id: "outlet-2",
    code: "OUT002",
    name: "Outlet Bandung",
    is_active: false,
    created_at: new Date("2025-02-10T14:30:00Z").toISOString(),
  },
  {
    id: "outlet-3",
    code: "OUT003",
    name: "Outlet Surabaya",
    is_active: true,
    created_at: new Date("2025-03-05T09:15:00Z").toISOString(),
  },
  {
    id: "outlet-4",
    code: "OUT004",
    name: "Outlet Medan",
    is_active: true,
    created_at: new Date("2025-04-20T08:45:00Z").toISOString(),
  },
  {
    id: "outlet-5",
    code: "OUT005",
    name: "Outlet Bali",
    is_active: false,
    created_at: new Date("2025-05-01T16:20:00Z").toISOString(),
  },
];

export default function OutletsPage() {
  useFormTheme(); // jika mau akses theme, tapi Surface sudah handle

  const [q, setQ] = React.useState("");
  const [sort, setSort] = React.useState<Sort | null>({ id: "created_at", desc: true });
  const [pagination, setPagination] = React.useState<PaginationState>({
    page: 1,
    perPage: 10,
    total: 0,
  });
  const [selected, setSelected] = React.useState<string[]>([]);
  const [loading, setLoading] = React.useState(false);
  const [rows, setRows] = React.useState<Outlet[]>([]);

  const columns: Column<Outlet>[] = [
    { id: "code", header: "Kode", field: "code", sortable: true, width: "140px" },
    { id: "name", header: "Nama Outlet", field: "name", sortable: true },
    {
      id: "is_active",
      header: "Status",
      accessor: (r) => (
        <span className={r.is_active ? "text-emerald-600" : "text-slate-500"}>
          {r.is_active ? "Aktif" : "Nonaktif"}
        </span>
      ),
      sortable: true,
      width: "120px",
    },
    {
      id: "created_at",
      header: "Dibuat",
      accessor: (r) => new Date(r.created_at).toLocaleString(),
      sortable: true,
      width: "200px",
    },
  ];

  const fetchList = React.useCallback(async () => {
    setLoading(true);
    try {
      await new Promise((r) => setTimeout(r, 500));
      const filtered = q
        ? data.filter(
            (d) =>
              d.name.toLowerCase().includes(q.toLowerCase()) ||
              d.code.toLowerCase().includes(q.toLowerCase())
          )
        : data;
      setRows(filtered);
      setPagination((p) => ({ ...p, total: filtered.length }));
    } finally {
      setLoading(false);
    }
  }, [q]);

  React.useEffect(() => {
    fetchList();
  }, [fetchList]);
  React.useEffect(() => {
    setSelected((prev) => prev.filter((id) => rows.some((r) => r.id === id)));
  }, [rows]);

  const onToggleSelect = (key: string | boolean, checked: boolean) => {
    if (typeof key === "boolean") {
      setSelected(checked ? rows.map((r) => r.id) : []);
      return;
    }
    setSelected((prev) =>
      checked ? (prev.includes(key) ? prev : [...prev, key]) : prev.filter((k) => k !== key)
    );
  };
  const onToggleSelectAll = (checked: boolean) => setSelected(checked ? rows.map((r) => r.id) : []);

  return (
    <PageContainer>
      <Surface padding="md" rounded="2xl">
        <HeaderBar
          title="Outlets"
          description="Kelola daftar outlet. Cari, filter status, pilih banyak, dan lakukan aksi."
          actions={
            <>
              <Button variant="outline" tone="neutral" onClick={() => console.log("import")}>
                Impor CSV
              </Button>
              <Button variant="solid" tone="primary" onClick={() => console.log("create")}>
                Tambah Outlet
              </Button>
            </>
          }
        />

        <TablePanel<Outlet>
          toolbar={{
            rightSlot:
              selected.length > 0 ? (
                <Button
                  variant="outline"
                  tone="neutral"
                  size="sm"
                  onClick={() => alert(`Bulk action untuk ${selected.length} item`)}
                >
                  Bulk Action
                </Button>
              ) : undefined,
            search: { value: q, onChange: setQ, placeholder: "Cari nama/kode..." },
          }}
          table={{
            data: rows,
            columns,
            keyField: "id",
            loading,
            loadingText: "Sedang mengambil data outlet…",
            emptyState: {
              variant: "ghost",
              align: "center",
              title: "Belum ada outlet",
              description: "Mulai dengan menambahkan outlet baru agar data tampil di sini.",
              size: "md",
              primaryAction: { label: "Tambah Outlet", onClick: () => console.log("empty") },
              secondaryAction: { label: "Pelajari impor CSV", href: "/docs/import" },
            },
            selectable: true,
            selectedKeys: selected,
            onToggleSelect,
            onToggleSelectAll,
            sort,
            onSortChange: setSort,
            pagination,
          }}
          pagination={{
            value: pagination,
            onPageChange: (page) => setPagination((p) => ({ ...p, page })),
            onPerPageChange: (per) => setPagination((p) => ({ ...p, perPage: per, page: 1 })),
          }}
        />
      </Surface>
    </PageContainer>
  );
}
