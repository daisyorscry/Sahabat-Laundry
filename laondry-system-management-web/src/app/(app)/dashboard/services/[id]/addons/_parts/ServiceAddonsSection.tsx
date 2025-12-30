// src/app/(app)/dashboard/services/[id]/addons/_parts/ServiceAddonsSection.tsx
"use client";

import * as React from "react";

import Button from "@/components/button/Button";
import Checkbox from "@/components/partials/Checkbox";
import Dropdown from "@/components/partials/Dropdown";
import TablePanel from "@/components/table/TablePanel";
import type { Column, PaginationState, Sort } from "@/components/table/types";
import {
  useAttachServiceAddon,
  useDetachServiceAddon,
  useServiceAddons,
  useUpdateServiceAddonPivot,
  type ListParams as MapParams,
  type ServiceAddonItem,
} from "@/features/order-service/useServiceAddons";

import { useAddonCatalog } from "./useAddonCatalog";

type Props = { serviceId: string };

export default function ServiceAddonsSection({ serviceId }: Props) {
  // katalog (attach box)
  const catalog = useAddonCatalog();
  const [selected, setSelected] = React.useState<string | "">("");
  const [required, setRequired] = React.useState(false);

  // table state
  const [q, setQ] = React.useState("");
  const [reqOnly, setReqOnly] = React.useState(false);
  const [sort, setSort] = React.useState<Sort | null>({ id: "name", desc: false });
  const [pagination, setPagination] = React.useState<PaginationState>({
    page: 1,
    perPage: 10,
    total: 0,
  });

  const params: MapParams = {
    q: q || undefined,
    required_only: reqOnly,
    page: pagination.page,
    per_page: pagination.perPage,
  };

  const mapQ = useServiceAddons(serviceId, params);
  const rows: ServiceAddonItem[] = mapQ.data?.data?.items ?? [];
  const pg = mapQ.data?.data?.pagination;

  React.useEffect(() => {
    const total = pg?.total ?? 0;
    setPagination((p) => ({ ...p, total }));
  }, [pg?.total]);

  // mutations
  const attachM = useAttachServiceAddon({ serviceId, invalidateParams: params });
  const updateM = useUpdateServiceAddonPivot({ serviceId, invalidateParams: params });
  const detachM = useDetachServiceAddon({ serviceId, invalidateParams: params });

  const attach = () => {
    if (!selected) return;
    attachM.mutate(
      { serviceId, payload: { addon_id: selected, is_required: required } },
      {
        onSuccess: () => {
          setSelected("");
          setRequired(false);
        },
      }
    );
  };

  // columns untuk TablePanel
  const columns = React.useMemo<Column<ServiceAddonItem>[]>(() => {
    return [
      { id: "code", header: "Kode", field: "code", width: "160px", sortable: false },
      { id: "name", header: "Nama", field: "name", width: "260px", sortable: false },
      {
        id: "required",
        header: "Required",
        width: "140px",
        sortable: false,
        accessor: (r) => {
          const isReq = !!r.pivot?.is_required;
          return (
            <Checkbox
              checked={isReq}
              onChange={(val) =>
                updateM.mutate({
                  serviceId,
                  addonId: r.id,
                  payload: { is_required: val },
                })
              }
              size="sm"
            />
          );
        },
      },
      {
        id: "actions",
        header: "Aksi",
        width: "160px",
        accessor: (r) => (
          <div className="flex gap-2">
            <Button
              size="sm"
              variant="soft"
              tone="danger"
              onClick={() => detachM.mutate({ serviceId, addonId: r.id })}
              loading={detachM.isPending}
            >
              Lepas
            </Button>
          </div>
        ),
      },
    ];
  }, [serviceId, updateM, detachM]);

  return (
    <div className="flex flex-col gap-6">
      {/* Attach box */}
      <section
        className="bg-surface border-border rounded-2xl border p-4 shadow-sm/10 md:p-5"
        style={{ borderColor: "var(--border)" }}
        aria-labelledby="attach-addon-title"
      >
        <header className="mb-3 md:mb-4">
          <h2 id="attach-addon-title" className="text-sm font-semibold tracking-tight">
            Pasang Addon
          </h2>
          <p className="text-foreground/70 mt-1 text-xs">
            Pilih addon aktif dari katalog, tandai sebagai <em>required</em> bila wajib.
          </p>
        </header>

        <div className="grid gap-3 md:grid-cols-[1fr_auto_auto] md:items-start">
          {/* Field: Dropdown Addon */}
          <div className="flex flex-col gap-1.5">
            <label className="text-foreground/80 text-xs font-medium">Addon</label>
            <Dropdown
              id="addon-select"
              value={selected}
              onChange={(v) => setSelected(v)}
              options={catalog.options}
              placeholder="Cari addon aktif…"
              searchable
              searchValue={catalog.q}
              onSearchChange={(term) => {
                catalog.setQ(term);
                setPagination((p) => ({ ...p, page: 1 }));
              }}
              isLoading={catalog.isLoading}
              onReachBottom={() => catalog.nextPage()}
              noOptionsText={catalog.q ? "Tidak ditemukan" : "Tidak ada data"}
              aria-labelledby="attach-addon-title"
              className="w-full"
            />
            <span className="text-foreground/60 text-[11px]">
              Ketik untuk mencari. Scroll sampai bawah untuk muat lebih banyak.
            </span>
          </div>

          <div className="flex md:items-end md:pt-6">
            <Checkbox
              checked={required}
              onChange={setRequired}
              label="Wajib (required)"
              size="md"
            />
          </div>
          {/* Action: Pasang */}
          <div className="flex md:justify-end md:pt-6">
            <Button
              variant="solid"
              tone="primary"
              onClick={attach}
              disabled={!selected || attachM.isPending}
              loading={attachM.isPending}
              className="w-full md:w-auto"
            >
              Pasang
            </Button>
          </div>
        </div>
      </section>

      <TablePanel<ServiceAddonItem>
        toolbar={{
          search: {
            value: q,
            onChange: (val) => {
              setPagination((p) => ({ ...p, page: 1 }));
              setQ(val);
            },
            placeholder: "Cari addon terpasang…",
          },
          rightSlot:
            rows.length > 0 ? (
              <label className="flex items-center gap-2">
                <input
                  type="checkbox"
                  checked={reqOnly}
                  onChange={(e) => {
                    setPagination((p) => ({ ...p, page: 1 }));
                    setReqOnly(e.currentTarget.checked);
                  }}
                />
                <span className="text-sm">Hanya required</span>
              </label>
            ) : undefined,
        }}
        table={{
          data: rows,
          columns,
          keyField: "id",
          loading: mapQ.isFetching,
          loadingText: "Memuat addons terpasang…",
          emptyState: {
            variant: "ghost",
            align: "center",
            title: "Belum ada addon terpasang",
            description: "Pasang addon lewat kotak di atas.",
            size: "md",
          },
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
    </div>
  );
}
