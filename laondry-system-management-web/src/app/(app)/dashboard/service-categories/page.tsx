"use client";

import * as React from "react";

import Button from "@/components/button/Button";
import HeaderBar from "@/components/layouts/page/HeaderBar";
import { PageContainer } from "@/components/layouts/page/Page";
import Surface from "@/components/layouts/page/Surface";
import TablePanel from "@/components/table/TablePanel";
import { PaginationState, Sort, type Column } from "@/components/table/types";
import ConfirmModal from "@/components/ui/ConfirmModal";

import {
  useServiceCategoriesList,
  useCreateServiceCategory,
  useUpdateServiceCategory,
  useDeleteServiceCategory,
  // useActivateServiceCategory,
  type ServiceCategory,
  type ListParams,
  type CreateServiceCategoryPayload,
  type UpdateServiceCategoryPayload,
} from "@/features/order-service/useServiceCategory";

import { makeServiceCategoryColumns } from "./_parts/columns";
import ServiceCategoryFormDialog from "./_parts/ServiceCategoryFormModal";

export default function ServiceCategoriesPage() {
  // table state
  const [q, setQ] = React.useState("");
  const [sort, setSort] = React.useState<Sort | null>({ id: "created_at", desc: true });
  const [pagination, setPagination] = React.useState<PaginationState>({
    page: 1,
    perPage: 10,
    total: 0,
  });

  // form state
  const [openForm, setOpenForm] = React.useState(false);
  const [editing, setEditing] = React.useState<ServiceCategory | undefined>(undefined);

  // delete confirm
  const [openConfirm, setOpenConfirm] = React.useState(false);
  const [toDeleteId, setToDeleteId] = React.useState<string | null>(null);

  // queries
  const listParams: ListParams = {
    q,
    // eslint-disable-next-line @typescript-eslint/no-explicit-any
    sort: (sort?.id as any) ?? "created_at",
    order: sort?.desc ? "desc" : "asc",
    page: pagination.page,
    per_page: pagination.perPage,
  };
  const listQ = useServiceCategoriesList(listParams);
  const rows: ServiceCategory[] = listQ.data?.data?.items ?? [];

  React.useEffect(() => {
    const total = listQ.data?.data?.pagination?.total ?? 0;
    setPagination((p) => ({ ...p, total }));
  }, [listQ.data]);

  // mutations
  const createM = useCreateServiceCategory({ invalidateParams: listParams });
  const updateM = useUpdateServiceCategory({ invalidateParams: listParams });
  const deleteM = useDeleteServiceCategory({ invalidateParams: listParams });
  // const activateM = useActivateServiceCategory({ invalidateParams: listParams });

  // handlers
  const onCreate = React.useCallback(() => {
    setEditing(undefined);
    setOpenForm(true);
  }, []);

  const onEdit = React.useCallback((row: ServiceCategory) => {
    setEditing(row);
    setOpenForm(true);
  }, []);

  const onSubmitForm = React.useCallback(
    (payload: CreateServiceCategoryPayload | UpdateServiceCategoryPayload) => {
      if (editing) {
        updateM.mutate({ id: editing.id, payload }, { onSuccess: () => setOpenForm(false) });
      } else {
        createM.mutate(payload as CreateServiceCategoryPayload, {
          onSuccess: () => setOpenForm(false),
        });
      }
    },
    [editing, updateM, createM]
  );

  const askDelete = React.useCallback((row: ServiceCategory) => {
    setToDeleteId(row.id);
    setOpenConfirm(true);
  }, []);

  const confirmDelete = React.useCallback(() => {
    if (!toDeleteId) return;
    deleteM.mutate({ id: toDeleteId }, { onSuccess: () => setOpenConfirm(false) });
  }, [toDeleteId, deleteM]);

  // columns
  const columns = React.useMemo(
    () => makeServiceCategoryColumns({ onEdit, askDelete }),
    [onEdit, askDelete]
  ) as Column<ServiceCategory>[];

  return (
    <>
      <div className="w-full">
        <PageContainer>
          <Surface padding="md" rounded="2xl">
            <HeaderBar
              title="Service Categories"
              description="Kelola kategori layanan. Cari, edit, tambah, hapus."
              actions={
                <Button variant="solid" tone="primary" onClick={onCreate}>
                  Tambah Kategori
                </Button>
              }
            />

            <TablePanel<ServiceCategory>
              toolbar={{
                search: { value: q, onChange: setQ, placeholder: "Cari kode/nama/deskripsi..." },
              }}
              table={{
                data: rows,
                columns,
                keyField: "id",
                loading: listQ.isFetching,
                loadingText: "Sedang mengambil data kategori…",
                emptyState: {
                  variant: "ghost",
                  align: "center",
                  title: "Belum ada kategori",
                  description: "Mulai dengan menambahkan kategori layanan.",
                  size: "md",
                  primaryAction: { label: "Tambah Kategori", onClick: onCreate },
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
          </Surface>
        </PageContainer>

        {/* Form Modal */}
        <ServiceCategoryFormDialog
          isOpen={openForm}
          onClose={() => (createM.isPending || updateM.isPending ? undefined : setOpenForm(false))}
          initial={editing}
          loading={createM.isPending || updateM.isPending}
          onSubmit={onSubmitForm}
        />

        {/* Confirm Delete */}
        <ConfirmModal
          isOpen={openConfirm}
          onClose={() => (deleteM.isPending ? undefined : setOpenConfirm(false))}
          title="Hapus Kategori"
          description="Tindakan ini akan menghapus kategori. Lanjutkan?"
          confirmText="Hapus"
          cancelText="Batal"
          loading={deleteM.isPending}
          onConfirm={confirmDelete}
        />
      </div>
    </>
  );
}
