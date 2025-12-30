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
  useCreateOutlet,
  useDeleteOutlet,
  useOutletsList,
  useUpdateOutlet,
  type CreateOutletPayload,
  type ListParams,
  type Outlet,
  type UpdateOutletPayload,
} from "@/features/outlets/useOutlets";

import { makeOutletColumns } from "./_parts/columns";
import OutletDetailsModal from "./_parts/OutletDetailsModal";
import OutletFormDialog from "./_parts/OutletFormModal";

export default function OutletsPage() {
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
  const [editing, setEditing] = React.useState<Outlet | undefined>(undefined);

  // delete confirm
  const [openConfirm, setOpenConfirm] = React.useState(false);
  const [toDeleteId, setToDeleteId] = React.useState<string | null>(null);

  // details modal
  const [openDetails, setOpenDetails] = React.useState(false);
  const [detailsRow, setDetailsRow] = React.useState<Outlet | null>(null);

  // queries
  const listParams: ListParams = {
    q,
    // eslint-disable-next-line @typescript-eslint/no-explicit-any
    sort: (sort?.id as any) ?? "created_at",
    order: sort?.desc ? "desc" : "asc",
    page: pagination.page,
    per_page: pagination.perPage,
  };
  const listQ = useOutletsList(listParams);
  const rows: Outlet[] = listQ.data?.data?.items ?? [];

  React.useEffect(() => {
    const total = listQ.data?.data?.pagination?.total ?? 0;
    setPagination((p) => ({ ...p, total }));
  }, [listQ.data]);

  // mutations
  const createM = useCreateOutlet({ invalidateParams: listParams });
  const updateM = useUpdateOutlet({ invalidateParams: listParams });
  const deleteM = useDeleteOutlet({ invalidateParams: listParams });
  // const activateM = useActivateOutlet({ invalidateParams: listParams });

  // handlers
  const onCreate = React.useCallback(() => {
    setEditing(undefined);
    setOpenForm(true);
  }, []);

  const onEdit = React.useCallback((row: Outlet) => {
    setEditing(row);
    setOpenForm(true);
  }, []);

  const onSubmitForm = React.useCallback(
    (payload: CreateOutletPayload | UpdateOutletPayload) => {
      if (editing) {
        updateM.mutate({ id: editing.id, payload }, { onSuccess: () => setOpenForm(false) });
      } else {
        createM.mutate(payload as CreateOutletPayload, { onSuccess: () => setOpenForm(false) });
      }
    },
    [editing, updateM, createM]
  );

  const askDelete = React.useCallback((row: Outlet) => {
    setToDeleteId(row.id);
    setOpenConfirm(true);
  }, []);

  const confirmDelete = React.useCallback(() => {
    if (!toDeleteId) return;
    deleteM.mutate({ id: toDeleteId }, { onSuccess: () => setOpenConfirm(false) });
  }, [toDeleteId, deleteM]);

  const onDetails = React.useCallback((row: Outlet) => {
    setDetailsRow(row);
    setOpenDetails(true);
  }, []);

  // columns
  const columns = React.useMemo(
    () => makeOutletColumns({ onEdit, askDelete, onDetails }),
    [onEdit, askDelete, onDetails]
  ) as Column<Outlet>[];

  return (
    <>
      <div className="w-full">
        <PageContainer>
          <Surface padding="md" rounded="2xl">
            <HeaderBar
              title="Outlets"
              description="Kelola daftar outlet. Cari, edit, tambah, nonaktifkan, hapus."
              actions={
                <Button variant="solid" tone="primary" onClick={onCreate}>
                  Tambah Outlet
                </Button>
              }
            />

            <TablePanel<Outlet>
              toolbar={{
                search: { value: q, onChange: setQ, placeholder: "Cari nama/kode..." },
              }}
              table={{
                data: rows,
                columns,
                keyField: "id",
                loading: listQ.isFetching,
                loadingText: "Sedang mengambil data outlet…",
                emptyState: {
                  variant: "ghost",
                  align: "center",
                  title: "Belum ada outlet",
                  description: "Mulai dengan menambahkan outlet baru agar data tampil di sini.",
                  size: "md",
                  primaryAction: { label: "Tambah Outlet", onClick: onCreate },
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
        <OutletFormDialog
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
          title="Hapus Outlet"
          description="Tindakan ini akan menghapus outlet. Lanjutkan?"
          confirmText="Hapus"
          cancelText="Batal"
          loading={deleteM.isPending}
          onConfirm={confirmDelete}
        />

        {/* Details Modal */}
        <OutletDetailsModal
          isOpen={openDetails}
          onClose={() => setOpenDetails(false)}
          data={detailsRow}
        />
      </div>
    </>
  );
}
