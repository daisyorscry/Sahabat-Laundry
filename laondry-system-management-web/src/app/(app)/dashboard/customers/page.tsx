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
  useCustomersList,
  useCreateCustomer,
  useUpdateCustomer,
  useDeleteCustomer,
  useBanCustomer,
  useUnbanCustomer,
  type Customer,
  type ListParams,
  type CreateCustomerPayload,
  type UpdateCustomerPayload,
} from "@/features/order-service/useCustomer";

import { makeCustomerColumns } from "./_parts/columns";
import CustomerFormDialog from "./_parts/CustomerFormModal";
import BanModal from "./_parts/BanModal";
import CustomerDetailModal from "./_parts/CustomerDetailModal";

export default function CustomersPage() {
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
  const [editing, setEditing] = React.useState<Customer | undefined>(undefined);

  // delete confirm
  const [openConfirm, setOpenConfirm] = React.useState(false);
  const [toDeleteId, setToDeleteId] = React.useState<string | null>(null);

  // ban modal
  const [openBan, setOpenBan] = React.useState(false);
  const [toBan, setToBan] = React.useState<Customer | null>(null);

  // detail modal
  const [openDetail, setOpenDetail] = React.useState(false);
  const [detailId, setDetailId] = React.useState<string | null>(null);

  // queries
  const listParams: ListParams = {
    q,
    // eslint-disable-next-line @typescript-eslint/no-explicit-any
    sort: (sort?.id as any) ?? "created_at",
    order: sort?.desc ? "desc" : "asc",
    page: pagination.page,
    per_page: pagination.perPage,
  };
  const listQ = useCustomersList(listParams);
  const rows: Customer[] = listQ.data?.data?.items ?? [];

  React.useEffect(() => {
    const total = listQ.data?.data?.pagination?.total ?? 0;
    setPagination((p) => ({ ...p, total }));
  }, [listQ.data]);

  // mutations
  const createM = useCreateCustomer({ invalidateParams: listParams });
  const updateM = useUpdateCustomer({ invalidateParams: listParams });
  const deleteM = useDeleteCustomer({ invalidateParams: listParams });
  const banM = useBanCustomer({ invalidateParams: listParams });
  const unbanM = useUnbanCustomer({ invalidateParams: listParams });

  // handlers
  const onCreate = React.useCallback(() => {
    setEditing(undefined);
    setOpenForm(true);
  }, []);

  const onEdit = React.useCallback((row: Customer) => {
    setEditing(row);
    setOpenForm(true);
  }, []);

  const onViewDetail = React.useCallback((row: Customer) => {
    setDetailId(row.id);
    setOpenDetail(true);
  }, []);

  const onSubmitForm = React.useCallback(
    (payload: CreateCustomerPayload | UpdateCustomerPayload) => {
      if (editing) {
        updateM.mutate({ id: editing.id, payload }, { onSuccess: () => setOpenForm(false) });
      } else {
        createM.mutate(payload as CreateCustomerPayload, {
          onSuccess: () => setOpenForm(false),
        });
      }
    },
    [editing, updateM, createM]
  );

  const askDelete = React.useCallback((row: Customer) => {
    setToDeleteId(row.id);
    setOpenConfirm(true);
  }, []);

  const confirmDelete = React.useCallback(() => {
    if (!toDeleteId) return;
    deleteM.mutate({ id: toDeleteId }, { onSuccess: () => setOpenConfirm(false) });
  }, [toDeleteId, deleteM]);

  const onBan = React.useCallback((row: Customer) => {
    setToBan(row);
    setOpenBan(true);
  }, []);

  const confirmBan = React.useCallback(
    (reason: string) => {
      if (!toBan) return;
      banM.mutate({ id: toBan.id, banned_reason: reason }, { onSuccess: () => setOpenBan(false) });
    },
    [toBan, banM]
  );

  const onUnban = React.useCallback(
    (row: Customer) => {
      unbanM.mutate({ id: row.id });
    },
    [unbanM]
  );

  // columns
  const columns = React.useMemo(
    () => makeCustomerColumns({ onEdit, onViewDetail, askDelete, onBan, onUnban }),
    [onEdit, onViewDetail, askDelete, onBan, onUnban]
  ) as Column<Customer>[];

  return (
    <>
      <div className="w-full">
        <PageContainer>
          <Surface padding="md" rounded="2xl">
            <HeaderBar
              title="Customers"
              description="Kelola customer. Lihat detail, edit, ban/unban, dan hapus customer."
              actions={
                <Button variant="solid" tone="primary" onClick={onCreate}>
                  Tambah Customer
                </Button>
              }
            />

            <TablePanel<Customer>
              toolbar={{
                search: {
                  value: q,
                  onChange: setQ,
                  placeholder: "Cari nama, email, atau nomor telepon...",
                },
              }}
              table={{
                data: rows,
                columns,
                keyField: "id",
                loading: listQ.isFetching,
                loadingText: "Sedang mengambil data customer…",
                emptyState: {
                  variant: "ghost",
                  align: "center",
                  title: "Belum ada customer",
                  description: "Mulai dengan menambahkan customer baru.",
                  size: "md",
                  primaryAction: { label: "Tambah Customer", onClick: onCreate },
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
        <CustomerFormDialog
          isOpen={openForm}
          onClose={() => (createM.isPending || updateM.isPending ? undefined : setOpenForm(false))}
          initial={editing}
          loading={createM.isPending || updateM.isPending}
          onSubmit={onSubmitForm}
        />

        {/* Detail Modal */}
        <CustomerDetailModal
          isOpen={openDetail}
          onClose={() => setOpenDetail(false)}
          customerId={detailId}
        />

        {/* Ban Modal */}
        <BanModal
          isOpen={openBan}
          onClose={() => (banM.isPending ? undefined : setOpenBan(false))}
          customer={toBan ?? undefined}
          loading={banM.isPending}
          onConfirm={confirmBan}
        />

        {/* Confirm Delete */}
        <ConfirmModal
          isOpen={openConfirm}
          onClose={() => (deleteM.isPending ? undefined : setOpenConfirm(false))}
          title="Hapus Customer"
          description="Tindakan ini akan menghapus customer. Lanjutkan?"
          confirmText="Hapus"
          cancelText="Batal"
          loading={deleteM.isPending}
          onConfirm={confirmDelete}
        />
      </div>
    </>
  );
}
