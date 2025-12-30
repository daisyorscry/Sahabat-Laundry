// app/admin/addons/page.tsx
"use client";

import * as React from "react";
import Image from "next/image";

import Button from "@/components/button/Button";
import { DataGridLayout } from "@/components/dataGrid";
import HeaderBar from "@/components/layouts/page/HeaderBar";
import { PageContainer } from "@/components/layouts/page/Page";
import Surface from "@/components/layouts/page/Surface";
import { PaginationState } from "@/components/table/types";
import ConfirmModal from "@/components/ui/ConfirmModal";
import {
  Sortable,
  useAddonsList,
  useCreateAddon,
  useDeleteAddon,
  useUpdateAddon,
  type Addon,
  type CreateAddonPayload,
  type ListParams,
  type UpdateAddonPayload,
} from "@/features/order-service/useAddons";

import AddonFormModal from "./_parts/AddonFormModal";

export default function AddonsPage() {
  const [q, setQ] = React.useState("");
  const [sort, setSort] = React.useState<{ sort: Sortable; order: "asc" | "desc" }>({
    sort: "created_at",
    order: "desc",
  });

  const [pagination, setPagination] = React.useState<PaginationState>({
    page: 1,
    perPage: 20,
    total: 0,
  });

  const [openForm, setOpenForm] = React.useState(false);
  const [editing, setEditing] = React.useState<Addon | undefined>(undefined);

  const [openConfirm, setOpenConfirm] = React.useState(false);
  const [toDeleteId, setToDeleteId] = React.useState<string | null>(null);

  const listParams: ListParams = {
    q,
    sort: sort.sort,
    order: sort.order,
    page: pagination.page,
    per_page: pagination.perPage,
    is_active: null,
  };
  const listQ = useAddonsList(listParams);
  const rows: Addon[] = listQ.data?.data?.items ?? [];

  React.useEffect(() => {
    const total = listQ.data?.data?.pagination?.total ?? 0;
    setPagination((p) => ({ ...p, total }));
  }, [listQ.data]);

  const createM = useCreateAddon({ invalidateParams: listParams });
  const updateM = useUpdateAddon({ invalidateParams: listParams });
  const deleteM = useDeleteAddon({ invalidateParams: listParams });

  const onCreate = React.useCallback(() => {
    setEditing(undefined);
    setOpenForm(true);
  }, []);

  const onEdit = React.useCallback((row: Addon) => {
    setEditing(row);
    setOpenForm(true);
  }, []);

  const onSubmitForm = React.useCallback(
    (payload: CreateAddonPayload | UpdateAddonPayload) => {
      if (editing) {
        updateM.mutate({ id: editing.id, payload }, { onSuccess: () => setOpenForm(false) });
      } else {
        createM.mutate(payload as CreateAddonPayload, {
          onSuccess: () => setOpenForm(false),
        });
      }
    },
    [editing, updateM, createM]
  );

  const askDelete = React.useCallback((row: Addon) => {
    setToDeleteId(row.id);
    setOpenConfirm(true);
  }, []);

  const confirmDelete = React.useCallback(() => {
    if (!toDeleteId) return;
    deleteM.mutate({ id: toDeleteId }, { onSuccess: () => setOpenConfirm(false) });
  }, [toDeleteId, deleteM]);

  return (
    <div className="w-full">
      <PageContainer>
        <Surface padding="xl" rounded="2xl">
          <HeaderBar
            title="Addons"
            description="Kelola addon layanan. Cari, edit, tambah, hapus."
            actions={
              <Button variant="solid" tone="primary" onClick={onCreate}>
                Tambah Addon
              </Button>
            }
          />
          <DataGridLayout
            items={rows}
            loading={listQ.isFetching}
            searchable
            searchPlaceholder="cari nama addons"
            query={q}
            onQueryChange={(v) => {
              setQ(v);
              setPagination((p) => ({ ...p, page: 1 }));
            }}
            sortable
            sortKey={sort.sort}
            sortOrder={sort.order}
            onSortChange={({ sortKey, sortOrder }) => {
              setSort({ sort: sortKey as Sortable, order: sortOrder });
              setPagination((p) => ({ ...p, page: 1 }));
            }}
            sortOptions={[
              { label: "Terbaru", value: "created_at", order: "desc" },
              { label: "Terlama", value: "created_at", order: "asc" },
              { label: "Nama A–Z", value: "name", order: "asc" },
              { label: "Nama Z–A", value: "name", order: "desc" },
              { label: "Harga termurah", value: "price", order: "asc" },
              { label: "Harga termahal", value: "price", order: "desc" },
              { label: "Kode A–Z", value: "code", order: "asc" },
              { label: "Kode Z–A", value: "code", order: "desc" },
            ]}
            gridCols={{ base: 1, sm: 2, md: 3, lg: 4 }}
            emptyTitle="Belum ada addon"
            emptyDescription="Mulai dengan menambahkan addon."
            emptyAction={
              <Button variant="solid" tone="primary" onClick={onCreate}>
                Tambah Addon
              </Button>
            }
            page={pagination.page}
            perPage={pagination.perPage}
            total={pagination.total}
            onPageChange={(page) => setPagination((p) => ({ ...p, page }))}
            onPerPageChange={(per) => setPagination((p) => ({ ...p, perPage: per, page: 1 }))}
            renderItem={(data) => (
              <article className="group relative flex flex-col overflow-hidden rounded-xl border border-[var(--border)] bg-[var(--surface)] shadow-sm">
                <div className="relative aspect-[4/3] w-full overflow-hidden bg-[var(--muted)]">
                  {data.icon_url ? (
                    <Image
                      src={
                        "https://image.idntimes.com/post/20220627/image-23eb6c357dad1bd2ebc81d52ea2db034.jpg"
                      }
                      alt={data.name}
                      fill
                      sizes="(max-width: 768px) 100vw, 33vw"
                      className="object-cover"
                    />
                  ) : (
                    <div className="flex h-full w-full items-center justify-center text-sm text-[var(--muted-foreground)]">
                      Tidak ada gambar
                    </div>
                  )}
                  <div
                    className={[
                      "absolute top-3 left-3 inline-flex items-center rounded-full border px-2 py-0.5 text-[12px]",
                      data.is_active
                        ? "border-[var(--color-emerald-400)] bg-[var(--surface)]"
                        : "border-[var(--border)] bg-[var(--surface)] opacity-75",
                    ].join(" ")}
                  >
                    {data.is_active ? "Aktif" : "Nonaktif"}
                  </div>
                </div>

                <div className="flex flex-1 flex-col gap-2 p-3">
                  <div className="flex items-start justify-between gap-2">
                    <h3 className="line-clamp-1 font-medium">{data.name}</h3>
                    <span className="shrink-0 text-xs text-[var(--muted-foreground)]">
                      {data.code}
                    </span>
                  </div>
                  <p className="line-clamp-2 text-sm text-[var(--muted-foreground)]">
                    {data.description ?? "—"}
                  </p>

                  <div className="mt-auto flex items-center justify-between pt-1">
                    <span className="font-semibold tabular-nums">
                      {new Intl.NumberFormat("id-ID", {
                        style: "currency",
                        currency: "IDR",
                        maximumFractionDigits: 0,
                      }).format(typeof data.price === "string" ? Number(data.price) : data.price)}
                    </span>
                    <div className="flex gap-2">
                      <Button
                        size="sm"
                        roundedSize="xl"
                        variant="soft"
                        tone="primary"
                        onClick={() => onEdit(data)}
                      >
                        Edit
                      </Button>
                      <Button
                        size="sm"
                        roundedSize="xl"
                        variant="soft"
                        tone="danger"
                        onClick={() => askDelete(data)}
                      >
                        Hapus
                      </Button>
                    </div>
                  </div>
                </div>
              </article>
            )}
          />
        </Surface>
      </PageContainer>

      <AddonFormModal
        isOpen={openForm}
        onClose={() => (createM.isPending || updateM.isPending ? undefined : setOpenForm(false))}
        initial={editing}
        loading={createM.isPending || updateM.isPending}
        onSubmit={onSubmitForm}
      />

      <ConfirmModal
        isOpen={openConfirm}
        onClose={() => (deleteM.isPending ? undefined : setOpenConfirm(false))}
        title="Hapus Addon"
        description="Tindakan ini akan menghapus addon. Lanjutkan?"
        confirmText="Hapus"
        cancelText="Batal"
        loading={deleteM.isPending}
        onConfirm={confirmDelete}
      />
    </div>
  );
}
