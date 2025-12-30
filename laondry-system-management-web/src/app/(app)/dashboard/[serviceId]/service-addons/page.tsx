// app/admin/services/[serviceId]/addons/page.tsx
"use client";

import * as React from "react";
import { useParams } from "next/navigation";

import Button from "@/components/button/Button";
import HeaderBar from "@/components/layouts/page/HeaderBar";
import { PageContainer } from "@/components/layouts/page/Page";
import Surface from "@/components/layouts/page/Surface";
import TablePanel from "@/components/table/TablePanel";
import ConfirmModal from "@/components/ui/ConfirmModal";
import { PaginationState, Sort, type Column } from "@/components/table/types";

import {
  useServiceAddons,
  useAttachServiceAddon,
  useUpdateServiceAddonPivot,
  useDetachServiceAddon,
  type ServiceAddonItem,
  type ListParams,
} from "@/features/order-service/useServiceAddons";

import { makeServiceAddonColumns } from "./_parts/columns";
import AttachAddonModal from "./_parts/ServiceAddonAttachModal";

export default function ServiceAddonsPage() {
  const params = useParams() as { serviceId?: string };
  const serviceId = params?.serviceId ?? "";

  // table state
  const [q, setQ] = React.useState("");
  const [requiredOnly, setRequiredOnly] = React.useState<boolean>(false);
  const [sort, setSort] = React.useState<Sort | null>({ id: "name", desc: false });
  const [pagination, setPagination] = React.useState<PaginationState>({
    page: 1,
    perPage: 10,
    total: 0,
  });

  // form/modal state
  const [openAttach, setOpenAttach] = React.useState(false);

  // detach confirm
  const [openConfirm, setOpenConfirm] = React.useState(false);
  const [toDetachId, setToDetachId] = React.useState<string | null>(null);

  // query params
  const listParams: ListParams = {
    q,
    required_only: requiredOnly,
    page: pagination.page,
    per_page: pagination.perPage,
  };

  // queries
  const listQ = useServiceAddons(serviceId, listParams);
  const rows: ServiceAddonItem[] = listQ.data?.data?.items ?? [];

  React.useEffect(() => {
    const total = listQ.data?.data?.pagination?.total ?? 0;
    setPagination((p) => ({ ...p, total }));
  }, [listQ.data]);

  // mutations (invalidate otomatis via opts.serviceId + invalidateParams)
  const attachM = useAttachServiceAddon({
    serviceId,
    invalidateParams: listParams,
  });
  const updatePivotM = useUpdateServiceAddonPivot({
    serviceId,
    invalidateParams: listParams,
  });
  const detachM = useDetachServiceAddon({
    serviceId,
    invalidateParams: listParams,
  });

  // handlers
  const onAttach = React.useCallback(() => setOpenAttach(true), []);
  const onSubmitAttach = React.useCallback(
    (payload: { addon_id: string; is_required?: boolean }) => {
      attachM.mutate(
        { serviceId, payload },
        { onSuccess: () => setOpenAttach(false) }
      );
    },
    [attachM, serviceId]
  );

  const onToggleRequired = React.useCallback(
    (row: ServiceAddonItem) => {
      const current = !!row.pivot?.is_required;
      updatePivotM.mutate({
        serviceId,
        addonId: row.id,
        payload: { is_required: !current },
      });
    },
    [updatePivotM, serviceId]
  );

  const askDetach = React.useCallback((row: ServiceAddonItem) => {
    setToDetachId(row.id);
    setOpenConfirm(true);
  }, []);

  const confirmDetach = React.useCallback(() => {
    if (!toDetachId) return;
    detachM.mutate(
      { serviceId, addonId: toDetachId },
      { onSuccess: () => setOpenConfirm(false) }
    );
  }, [toDetachId, detachM, serviceId]);

  // columns
  const columns = React.useMemo(
    () =>
      makeServiceAddonColumns({
        onToggleRequired,
        askDetach,
      }),
    [onToggleRequired, askDetach]
  ) as Column<ServiceAddonItem>[];

  return (
    <div className="w-full">
      <PageContainer>
        <Surface padding="md" rounded="2xl">
          <HeaderBar
            title="Service Addons"
            description="Kelola addon yang terpasang pada service ini."
            actions={
              <Button
                variant="solid"
                tone="primary"
                onClick={onAttach}
                disabled={attachM.isPending}
              >
                Pasang Addon
              </Button>
            }
          />

          <TablePanel<ServiceAddonItem>
            toolbar={{
              search: {
                value: q,
                onChange: setQ,
                placeholder: "Cari kode/nama/deskripsi addon…",
              },
              // extras: (
              //   <label className="flex items-center gap-2 text-sm">
              //     <input
              //       type="checkbox"
              //       className="accent-sky-600"
              //       checked={requiredOnly}
              //       onChange={(e) => setRequiredOnly(e.target.checked)}
              //     />
              //     Hanya yang Required
              //   </label>
              // ),
            }}
            table={{
              data: rows,
              columns,
              keyField: "id",
              loading: listQ.isFetching,
              loadingText: "Memuat addons service…",
              emptyState: {
                variant: "ghost",
                align: "center",
                title: "Belum ada addon terpasang",
                description: "Klik 'Pasang Addon' untuk menambahkan.",
                size: "md",
                primaryAction: { label: "Pasang Addon", onClick: onAttach },
              },
              sort,
              onSortChange: setSort,
              pagination,
            }}
            pagination={{
              value: pagination,
              onPageChange: (page) => setPagination((p) => ({ ...p, page })),
              onPerPageChange: (per) =>
                setPagination((p) => ({ ...p, perPage: per, page: 1 })),
            }}
          />
        </Surface>
      </PageContainer>

      {/* Attach Modal */}
      <AttachAddonModal
        isOpen={openAttach}
        onClose={() => (attachM.isPending ? undefined : setOpenAttach(false))}
        onSubmit={onSubmitAttach}
        loading={attachM.isPending}
      />

      {/* Confirm Detach */}
      <ConfirmModal
        isOpen={openConfirm}
        onClose={() => (detachM.isPending ? undefined : setOpenConfirm(false))}
        title="Lepas Addon"
        description="Tindakan ini akan melepas addon dari service. Lanjutkan?"
        confirmText="Lepas"
        cancelText="Batal"
        loading={detachM.isPending}
        onConfirm={confirmDetach}
      />
    </div>
  );
}
