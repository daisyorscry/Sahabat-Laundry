"use client";

import * as React from "react";
import { useForm } from "react-hook-form";

import Button from "@/components/button/Button";
import DateFieldComp from "@/components/form/fields/DateField";
import HeaderBar from "@/components/layouts/page/HeaderBar";
import { PageContainer } from "@/components/layouts/page/Page";
import Surface from "@/components/layouts/page/Surface";
import Label from "@/components/partials/Label";
import TablePanel from "@/components/table/TablePanel";
import { PaginationState, Sort } from "@/components/table/types";
import ConfirmModal from "@/components/ui/ConfirmModal";
import {
  useCreateServicePrice,
  useDeleteServicePrice,
  useServicePricesList,
  useUpdateServicePrice,
  type CreateServicePricePayload,
  type ListParams as PriceListParams,
  type ServicePrice,
  type UpdateServicePricePayload,
} from "@/features/order-service/useServicePrice";

import OutletSelect from "../outlets/_parts/OutletSelect";
import ServiceSelect from "../services/parts/ServiceSelect";
import { makeServicePriceColumns } from "./_parts/columns";
import ExpressSelect from "./_parts/ExpressSelect";
import MemberTierSelect from "./_parts/MemberTierSelect";
import ServicePriceFormModal from "./_parts/ServicePriceFormModal";

type FilterForm = { active_at: string };

export default function ServicePricesPage() {
  const [sort, setSort] = React.useState<Sort | null>({ id: "effective_start", desc: true });
  const [pagination, setPagination] = React.useState<PaginationState>({
    page: 1,
    perPage: 20,
    total: 0,
  });

  // filters
  const [serviceId, setServiceId] = React.useState("");
  const [outletId, setOutletId] = React.useState("");
  const [memberTier, setMemberTier] = React.useState<string>("");
  const [isExpress, setIsExpress] = React.useState<"" | "true" | "false">("");
  const [activeAt, setActiveAt] = React.useState("");

  // form modal
  const [openForm, setOpenForm] = React.useState(false);
  const [editing, setEditing] = React.useState<ServicePrice | undefined>(undefined);

  // delete confirm
  const [openConfirm, setOpenConfirm] = React.useState(false);
  const [toDeleteId, setToDeleteId] = React.useState<string | null>(null);

  // rakit params
  const listParams: PriceListParams = {
    service_id: serviceId || undefined,
    outlet_id: outletId || undefined,
    member_tier: memberTier === "" ? null : memberTier,
    is_express: isExpress === "" ? null : isExpress === "true",
    active_at: activeAt || undefined,
    // eslint-disable-next-line @typescript-eslint/no-explicit-any
    sort: (sort?.id as any) ?? "effective_start",
    order: sort?.desc ? "desc" : "asc",
    page: pagination.page,
    per_page: pagination.perPage,
  };

  // RHF buat date filter
  const filterForm = useForm<FilterForm>({ mode: "onChange", defaultValues: { active_at: "" } });
  React.useEffect(() => {
    const sub = filterForm.watch((vals, { name }) => {
      if (name === "active_at") {
        setActiveAt(vals.active_at || "");
        setPagination((p) => ({ ...p, page: 1 }));
      }
    });
    return () => sub.unsubscribe();
  }, [filterForm]);

  React.useEffect(() => {
    if ((filterForm.getValues("active_at") || "") !== (activeAt || "")) {
      filterForm.setValue("active_at", activeAt || "", { shouldDirty: false, shouldValidate: true });
    }
  }, [activeAt, filterForm]);

  // query list
  const listQ = useServicePricesList(listParams);
  const rows: ServicePrice[] = listQ.data?.data?.items ?? [];
  React.useEffect(() => {
    const total = listQ.data?.data?.pagination?.total ?? 0;
    setPagination((p) => ({ ...p, total }));
  }, [listQ.data]);

  // mutations
  const createM = useCreateServicePrice({ invalidateParams: listParams });
  const updateM = useUpdateServicePrice({ invalidateParams: listParams });
  const deleteM = useDeleteServicePrice({ invalidateParams: listParams });

  // handlers CRUD
  const onCreate = React.useCallback(() => {
    setEditing(undefined);
    setOpenForm(true);
  }, []);
  const onEdit = React.useCallback((row: ServicePrice) => {
    setEditing(row);
    setOpenForm(true);
  }, []);
  const onSubmitForm = React.useCallback(
    (payload: CreateServicePricePayload | UpdateServicePricePayload) => {
      if (editing) {
        updateM.mutate({ id: editing.id, payload }, { onSuccess: () => setOpenForm(false) });
      } else {
        createM.mutate(payload as CreateServicePricePayload, { onSuccess: () => setOpenForm(false) });
      }
    },
    [editing, updateM, createM]
  );
  const askDelete = React.useCallback((row: ServicePrice) => {
    setToDeleteId(row.id);
    setOpenConfirm(true);
  }, []);
  const confirmDelete = React.useCallback(() => {
    if (!toDeleteId) return;
    deleteM.mutate({ id: toDeleteId }, { onSuccess: () => setOpenConfirm(false) });
  }, [toDeleteId, deleteM]);

  // columns
  const columns = React.useMemo(
    () => makeServicePriceColumns({ onEdit, askDelete, deletingId: toDeleteId, isDeleting: deleteM.isPending }),
    [onEdit, askDelete, toDeleteId, deleteM.isPending]
  );

  // bulk upload
  const fileInputRef = React.useRef<HTMLInputElement | null>(null);
  const [bulkLoading, setBulkLoading] = React.useState(false);
  const onClickBulk = () => fileInputRef.current?.click();
  const onChangeBulk = async (e: React.ChangeEvent<HTMLInputElement>) => {
    const file = e.target.files?.[0];
    if (!file) return;
    setBulkLoading(true);
    try {
      const fd = new FormData();
      fd.append("file", file);
      await fetch("/service-prices/bulk", { method: "POST", body: fd });
    } finally {
      setBulkLoading(false);
    }
  };

  // reset filter
  const hasFilters =
    (serviceId && serviceId !== "") ||
    (outletId && outletId !== "") ||
    memberTier !== "" ||
    isExpress !== "" ||
    activeAt !== "";
  const resetFilters = React.useCallback(() => {
    setServiceId("");
    setOutletId("");
    setMemberTier("");
    setIsExpress("");
    setActiveAt("");
    filterForm.reset({ active_at: "" }, { keepDirty: false, keepTouched: false });
    setPagination((p) => ({ ...p, page: 1 }));
  }, [filterForm]);

  return (
    <div className="w-full">
      <PageContainer>
        <Surface padding="md" rounded="2xl">
          <HeaderBar
            title="Service Prices"
            description="Kelola harga layanan per outlet/tier/express dengan periode efektif."
            actions={
              <div className="flex flex-wrap gap-2">
                <label className="sr-only" htmlFor="bulkCsv">
                  Bulk CSV
                </label>
                <input
                  id="bulkCsv"
                  ref={fileInputRef}
                  type="file"
                  accept=".csv,text/csv"
                  className="hidden"
                  onChange={onChangeBulk}
                />
                <Button variant="outline" tone="neutral" onClick={onClickBulk} disabled={bulkLoading}>
                  Impor CSV
                </Button>
                <Button variant="solid" tone="primary" onClick={onCreate}>
                  Tambah Harga
                </Button>
              </div>
            }
          />

          <TablePanel<ServicePrice>
            toolbar={{
              rightSlot: (
                <div className="flex w-full flex-col gap-2">
                  {/* row 1: filters (responsif) */}
                  <div className="grid grid-cols-1 gap-2 sm:grid-cols-2 lg:grid-cols-5">
                    <div className="min-w-0">
                      <Label className="mb-1 block">Service</Label>
                      <ServiceSelect
                        value={serviceId}
                        onChange={(id) => {
                          setServiceId(id);
                          setPagination((p) => ({ ...p, page: 1 }));
                        }}
                        ensureId={serviceId || null}
                        placeholder="Pilih service"
                      />
                    </div>

                    <div className="min-w-0">
                      <Label className="mb-1 block">Outlet</Label>
                      <OutletSelect
                        value={outletId}
                        onChange={(id) => {
                          setOutletId(id);
                          setPagination((p) => ({ ...p, page: 1 }));
                        }}
                        ensureId={outletId || null}
                        placeholder="Pilih outlet"
                      />
                    </div>

                    <div className="min-w-0">
                      <Label className="mb-1 block">Member Tier</Label>
                      <MemberTierSelect
                        value={memberTier}
                        onChange={(v) => {
                          setMemberTier(v);
                          setPagination((p) => ({ ...p, page: 1 }));
                        }}
                      />
                    </div>

                    <div className="min-w-0">
                      <Label className="mb-1 block">Express</Label>
                      <ExpressSelect
                        value={isExpress}
                        onChange={(v) => {
                          setIsExpress(v);
                          setPagination((p) => ({ ...p, page: 1 }));
                        }}
                        placeholder="Semua"
                      />
                    </div>

                    <div className="min-w-0">
                      <DateFieldComp
                        control={filterForm.control}
                        field={{
                          type: "date",
                          name: "active_at",
                          label: "Active at",
                          mode: "date",
                          placeholder: "Pilih tanggal…",
                          min: "2000-01-01",
                          max: "2100-12-31",
                        }}
                      />
                    </div>
                  </div>

                  {/* row 2: actions for filters */}
                  <div className="flex flex-wrap items-center justify-end gap-2">
                    <Button
                      variant="outline"
                      tone="neutral"
                      size="sm"
                      disabled={!hasFilters}
                      onClick={resetFilters}
                    >
                      Reset Filter
                    </Button>
                  </div>
                </div>
              ),
            }}
            table={{
              data: rows,
              columns,
              keyField: "id",
              loading: listQ.isFetching,
              loadingText: "Sedang mengambil data harga…",
              emptyState: {
                variant: "ghost",
                align: "center",
                title: "Belum ada harga",
                description: "Mulai dengan menambahkan service price.",
                size: "md",
                primaryAction: { label: "Tambah Harga", onClick: onCreate },
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
      <ServicePriceFormModal
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
        title="Hapus Harga"
        description="Tindakan ini akan menghapus harga. Lanjutkan?"
        confirmText="Hapus"
        cancelText="Batal"
        loading={deleteM.isPending}
        onConfirm={confirmDelete}
      />
    </div>
  );
}