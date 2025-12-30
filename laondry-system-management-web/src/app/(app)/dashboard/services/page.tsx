"use client";

import * as React from "react";
import { useRouter } from "next/navigation";

import Button from "@/components/button/Button";
import { DataGridLayout } from "@/components/dataGrid";
import HeaderBar from "@/components/layouts/page/HeaderBar";
import { PageContainer } from "@/components/layouts/page/Page";
import Surface from "@/components/layouts/page/Surface";
import { PaginationState } from "@/components/table/types";
import ConfirmModal from "@/components/ui/ConfirmModal";
import {
  Sortable,
  useCreateService,
  useDeleteService,
  useServicesList,
  useUpdateService,
  type CreateServicePayload,
  type ListParams,
  type Service,
  type UpdateServicePayload,
} from "@/features/order-service/useService";

import CategoryTabs from "../service-categories/_parts/CategoryTabs";
import ServiceCard from "./parts/ServiceCard";
import ServiceDetailsModal from "./parts/ServiceDetailsModal";
import ServiceFormModal from "./parts/ServiceFormModal";

export type SortState = { sort: Sortable; order: "asc" | "desc" };

export default function ServicesPage() {
  const router = useRouter();

  const [q, setQ] = React.useState("");
  const [sort, setSort] = React.useState<SortState>({ sort: "created_at", order: "desc" });

  const [pagination, setPagination] = React.useState<PaginationState>({
    page: 1,
    perPage: 10,
    total: 0,
  });

  const [pricingModel, setPricingModel] = React.useState<"weight" | "piece" | null>(null);
  const [isActive, setIsActive] = React.useState<boolean | null>(null);
  const [isExpress, setIsExpress] = React.useState<boolean | null>(null);
  const [categoryId, setCategoryId] = React.useState<string | null>(null);

  // params ke API
  const listParams: ListParams = {
    q,
    category_id: categoryId ?? undefined,
    pricing_model: pricingModel ?? undefined,
    is_active: isActive ?? undefined,
    is_express_available: isExpress ?? undefined,
    sort: sort.sort,
    order: sort.order,
    page: pagination.page,
    per_page: pagination.perPage,
  };

  // query
  const listQ = useServicesList(listParams);
  const rows: Service[] = listQ.data?.data?.items ?? [];

  React.useEffect(() => {
    const total = listQ.data?.data?.pagination?.total ?? 0;
    setPagination((p) => ({ ...p, total }));
  }, [listQ.data]);

  // mutations
  const createM = useCreateService({ invalidateParams: listParams });
  const updateM = useUpdateService({ invalidateParams: listParams });
  const deleteM = useDeleteService({ invalidateParams: listParams });

  // handlers
  const onCreate = React.useCallback(() => {
    setEditing(undefined);
    setOpenForm(true);
  }, []);

  const [openForm, setOpenForm] = React.useState(false);
  const [editing, setEditing] = React.useState<Service | undefined>(undefined);

  const onEdit = React.useCallback((row: Service) => {
    setEditing(row);
    setOpenForm(true);
  }, []);

  const onSubmitForm = React.useCallback(
    (payload: CreateServicePayload | UpdateServicePayload) => {
      if (editing) {
        updateM.mutate({ id: editing.id, payload }, { onSuccess: () => setOpenForm(false) });
      } else {
        createM.mutate(payload as CreateServicePayload, { onSuccess: () => setOpenForm(false) });
      }
    },
    [editing, updateM, createM]
  );

  const [openConfirm, setOpenConfirm] = React.useState(false);
  const [toDeleteId, setToDeleteId] = React.useState<string | null>(null);

  const askDelete = React.useCallback((row: Service) => {
    setToDeleteId(row.id);
    setOpenConfirm(true);
  }, []);

  const confirmDelete = React.useCallback(() => {
    if (!toDeleteId) return;
    deleteM.mutate({ id: toDeleteId }, { onSuccess: () => setOpenConfirm(false) });
  }, [toDeleteId, deleteM]);

  const [openDetails, setOpenDetails] = React.useState(false);
  const [detailsRow, setDetailsRow] = React.useState<Service | null>(null);

  const onDetails = React.useCallback((row: Service) => {
    setDetailsRow(row);
    setOpenDetails(true);
  }, []);

  const onManageAddons = React.useCallback(
    (row: Service) => {
      router.push(`/dashboard/services/${row.id}/addons`);
    },
    [router]
  );

  // ganti kategori via tabs ⇒ reset page
  const handleChangeCategory = React.useCallback((id: string | null) => {
    setCategoryId(id);
    setPagination((p) => ({ ...p, page: 1 }));
  }, []);

  return (
    <div className="w-full">
      <PageContainer>
        <Surface padding="md" rounded="2xl">
          <HeaderBar
            title="Services"
            description="Kelola daftar layanan laundry. Cari, tambah, edit, nonaktifkan, hapus."
            actions={
              <Button variant="solid" tone="primary" onClick={onCreate}>
                Tambah Service
              </Button>
            }
          />

          {/* Tabs kategori di atas grid */}
          <CategoryTabs value={categoryId} onChange={handleChangeCategory} className="mb-3" />

          <DataGridLayout<Service>
            items={rows}
            loading={listQ.isFetching}
            searchable
            searchPlaceholder="Cari nama/kode/desc..."
            query={q}
            onQueryChange={(v) => {
              setQ(v);
              setPagination((p) => ({ ...p, page: 1 }));
            }}
            sortable
            sortKey={sort.sort as string}
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
              { label: "Harga termurah", value: "base_price", order: "asc" },
              { label: "Harga termahal", value: "base_price", order: "desc" },
              { label: "Kode A–Z", value: "code", order: "asc" },
              { label: "Kode Z–A", value: "code", order: "desc" },
            ]}
            gridCols={{ base: 1, sm: 2, md: 3, lg: 4 }}
            emptyTitle="Belum ada service"
            emptyDescription="Mulai dengan menambahkan service baru agar data tampil di sini."
            emptyAction={
              <Button variant="solid" tone="primary" onClick={onCreate}>
                Tambah Service
              </Button>
            }
            page={pagination.page}
            perPage={pagination.perPage}
            total={pagination.total}
            onPageChange={(page) => setPagination((p) => ({ ...p, page }))}
            onPerPageChange={(per) => setPagination((p) => ({ ...p, perPage: per, page: 1 }))}
            renderItem={(s) => (
              <ServiceCard
                data={s as Service}
                onDetails={onDetails}
                onEdit={onEdit}
                onDelete={askDelete}
                onManageAddons={onManageAddons}
              />
            )}
          />
        </Surface>
      </PageContainer>

      {/* Form Modal */}
      <ServiceFormModal
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
        title="Hapus Service"
        description="Tindakan ini akan menghapus service. Lanjutkan?"
        confirmText="Hapus"
        cancelText="Batal"
        loading={deleteM.isPending}
        onConfirm={confirmDelete}
      />

      {/* Details Modal */}
      <ServiceDetailsModal
        isOpen={openDetails}
        onClose={() => setOpenDetails(false)}
        data={detailsRow}
      />
    </div>
  );
}
