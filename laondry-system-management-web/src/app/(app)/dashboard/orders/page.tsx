"use client";

import * as React from "react";
import { useForm } from "react-hook-form";

import HeaderBar from "@/components/layouts/page/HeaderBar";
import { PageContainer } from "@/components/layouts/page/Page";
import Surface from "@/components/layouts/page/Surface";
import type { RowAction } from "@/components/table/types";
import type { OrderDetail } from "@/features/orders/useOrders";
import {
  useChangeOrderStatus,
  useOrderDetail,
  useOrderPrint,
  useOrders,
  useOrderStatuses,
  useOrderTimeline,
  useRecalcOrder,
} from "@/features/orders/useOrders";

import ChangeStatusModal from "./_parts/ChangeStatusModal";
import DueSoonGrid from "./_parts/DueSoonGrid";
import FiltersBar from "./_parts/FiltersBar";
import IncomingList from "./_parts/IncomingList";
import OrderDetailsDrawer from "./_parts/OrderDetailsDrawer";
import OrdersTable from "./_parts/OrdersTable";
import OrderTimelineModal from "./_parts/OrderTimelineModal";
import { BulkPrintModal, PrintModal } from "./_parts/PrintModals";
import { Filters, OrderRow, Sort } from "./_parts/types";

export default function OrdersPage() {
  // INIT RANGE (bulan ini)
  const today = new Date();
  const firstDay = new Date(today.getFullYear(), today.getMonth(), 1);
  const lastDay = new Date(today.getFullYear(), today.getMonth() + 1, 0);

  // FORM FILTER (tanpa custom hook)
  const form = useForm<Filters>({
    defaultValues: {
      q: "",
      range: {
        start: firstDay.toISOString().split("T")[0] || "",
        end: lastDay.toISOString().split("T")[0] || "",
      },
      status: "",
      type: "",
      __note: "",
    },
  });

  // STATE UTAMA (tanpa custom hook)
  const [outletId, setOutletId] = React.useState<string>("");
  const [status, setStatus] = React.useState<string>("");
  const [type, setType] = React.useState<"DROPOFF" | "PICKUP" | "">("");
  const [page, setPage] = React.useState(1);
  const [perPage, setPerPage] = React.useState(15);

  const [sort, setSort] = React.useState<Sort>({ id: "created", desc: true });
  const sortField = React.useMemo(() => {
    const id = sort?.id;
    if (id === "created") return "created_at" as const;
    if (id === "promised") return "promised_at" as const;
    if (id === "grand_total") return "grand_total" as const;
    if (id === "order_no") return "order_no" as const;
    return "created_at" as const;
  }, [sort?.id]);

  // WATCH + DEBOUNCE SEARCH
  const q = form.watch("q");
  const range = form.watch("range");
  const [debouncedQ, setDebouncedQ] = React.useState(q);
  React.useEffect(() => {
    const t = setTimeout(() => setDebouncedQ(q), 400);
    return () => clearTimeout(t);
  }, [q]);

  // QUICK RANGE (tanpa custom hook)
  const setToday = React.useCallback(() => {
    const d = new Date().toISOString().split("T")[0] || "";
    form.setValue("range", { start: d, end: d });
  }, [form]);

  const setThisWeek = React.useCallback(() => {
    const now = new Date();
    const dayOfWeek = now.getDay();
    const monday = new Date(now);
    monday.setDate(now.getDate() - dayOfWeek + (dayOfWeek === 0 ? -6 : 1));
    const sunday = new Date(monday);
    sunday.setDate(monday.getDate() + 6);
    form.setValue("range", {
      start: monday.toISOString().split("T")[0] || "",
      end: sunday.toISOString().split("T")[0] || "",
    });
  }, [form]);

  const setThisMonth = React.useCallback(() => {
    const now = new Date();
    const first = new Date(now.getFullYear(), now.getMonth(), 1);
    const last = new Date(now.getFullYear(), now.getMonth() + 1, 0);
    form.setValue("range", {
      start: first.toISOString().split("T")[0] || "",
      end: last.toISOString().split("T")[0] || "",
    });
  }, [form]);

  // PARAMS QUERY TERKINI
  const params = React.useMemo(() => {
    return {
      q: debouncedQ || undefined,
      status: status || undefined,
      outlet_id: outletId || undefined,
      type: type || undefined,
      date_from: range?.start ? String(range.start).split("T")[0] : undefined,
      date_to: range?.end ? String(range.end).split("T")[0] : undefined,
      sort: sortField,
      order: sort?.desc ? ("desc" as const) : ("asc" as const),
      page,
      per_page: perPage,
    };
  }, [
    debouncedQ,
    status,
    outletId,
    type,
    range?.start,
    range?.end,
    page,
    perPage,
    sortField,
    sort?.desc,
  ]);

  // DATA QUERIES
  const listQ = useOrders(params);
  const statusesQ = useOrderStatuses();
  const incomingQ = useOrders({
    status: "NEW",
    per_page: 8,
    page: 1,
    sort: "created_at",
    order: "desc",
  });
  const dueBaseQ = useOrders({ per_page: 50, page: 1, sort: "promised_at", order: "asc" });

  // RESET PAGE SAAT FILTER/SORT BERUBAH
  React.useEffect(() => {
    setPage(1);
  }, [debouncedQ, status, outletId, type, range?.start, range?.end, sortField, sort?.desc]);

  // DERIVED
  const items: OrderRow[] = listQ.data?.data?.items ?? [];
  const pagination = listQ.data?.data?.pagination;

  const statusOptions = React.useMemo(
    () =>
      (statusesQ.data?.data?.items ?? []).map((s) => ({
        value: s.code,
        label: `${s.code} — ${s.name}`,
      })),
    [statusesQ.data?.data?.items]
  );

  // SELECTION
  const [selected, setSelected] = React.useState<string[]>([]);
  const toggleSelect = (key: string, checked: boolean) => {
    setSelected((s) => (checked ? Array.from(new Set([...s, key])) : s.filter((k) => k !== key)));
  };
  const toggleSelectAll = (keys: string[], checked: boolean) => {
    if (checked) setSelected(keys);
    else setSelected([]);
  };

  // ROW ACTIONS & MODALS
  const [detailId, setDetailId] = React.useState<string | null>(null);
  const [timelineId, setTimelineId] = React.useState<string | null>(null);
  const [statusTargets, setStatusTargets] = React.useState<string[] | null>(null);
  const [nextStatus, setNextStatus] = React.useState<string>("");
  const [printId, setPrintId] = React.useState<string | null>(null);
  const [bulkPrintIds, setBulkPrintIds] = React.useState<string[] | null>(null);

  const detailQ = useOrderDetail(detailId, !!detailId);
  const timelineQ = useOrderTimeline(timelineId, !!timelineId);
  const printQ = useOrderPrint(printId, !!printId);
  const changeStatusM = useChangeOrderStatus();
  const recalcM = useRecalcOrder();

  const rowActions: RowAction<OrderRow>[] = React.useMemo(
    () => [
      { id: "view", label: "View", onClick: (row: OrderRow) => setDetailId(String(row.id)) },
      {
        id: "timeline",
        label: "Timeline",
        onClick: (row: OrderRow) => setTimelineId(String(row.id)),
      },
      {
        id: "status",
        label: "Change Status",
        onClick: (row: OrderRow) => {
          setStatusTargets([String(row.id)]);
          setNextStatus("");
        },
      },
      {
        id: "recalc",
        label: "Recalc",
        onClick: async (row: OrderRow) => {
          if (!confirm("Recalculate totals untuk order ini?")) return;
          await recalcM.mutateAsync({ id: String(row.id), reprice: true });
        },
      },
      { id: "print", label: "Print", onClick: (row: OrderRow) => setPrintId(String(row.id)) },
    ],
    [recalcM]
  );

  return (
    <>
      <HeaderBar title="Orders" />
      <PageContainer>
        <Surface className="mb-4 p-4">
          <FiltersBar
            control={form.control}
            outletId={outletId}
            setOutletId={(v) => setOutletId(v)}
            status={status}
            setStatus={(v) => setStatus(v)}
            type={type}
            setType={(v) => setType(v)}
            statusOptions={statusOptions}
            onToday={setToday}
            onThisWeek={setThisWeek}
            onThisMonth={setThisMonth}
          />
        </Surface>

        <IncomingList
          items={incomingQ.data?.data?.items ?? []}
          loading={incomingQ.isLoading}
          onView={(id) => setDetailId(id)}
          onTimeline={(id) => setTimelineId(id)}
          onChangeStatus={async (id, to) => {
            await changeStatusM.mutateAsync({ id, to_status: to });
          }}
          onSeeAllNew={() => setStatus("NEW")}
        />

        <DueSoonGrid
          items={dueBaseQ.data?.data?.items ?? []}
          loading={dueBaseQ.isLoading}
          onView={(id) => setDetailId(id)}
          onChangeStatus={async (id, to) => {
            await changeStatusM.mutateAsync({ id, to_status: to });
          }}
          onSortByDeadline={() => {
            setStatus("");
            setSort({ id: "promised", desc: false });
          }}
        />

        <Surface className="p-0">
          <OrdersTable
            items={items}
            pagination={pagination}
            loading={listQ.isLoading}
            sort={sort}
            onSortChange={setSort}
            selected={selected}
            onToggleSelect={toggleSelect}
            onToggleSelectAll={toggleSelectAll}
            page={page}
            perPage={perPage}
            onPageChange={setPage}
            onPerPageChange={setPerPage}
            onBulkChangeStatus={() => {
              setStatusTargets(selected);
              setNextStatus("");
            }}
            onBulkPrint={() => setBulkPrintIds(selected)}
            onClearSelection={() => setSelected([])}
            rowActions={rowActions}
          />
        </Surface>
      </PageContainer>

      {/* Details */}
      <OrderDetailsDrawer
        isOpen={!!detailId}
        onClose={() => setDetailId(null)}
        loading={detailQ.isLoading}
        data={
          detailQ.data?.data ??
          (items.find((i) => String(i.id) === String(detailId)) as unknown as
            | OrderDetail
            | undefined) ??
          undefined
        }
      />

      {/* Timeline */}
      <OrderTimelineModal
        isOpen={!!timelineId}
        onClose={() => setTimelineId(null)}
        loading={timelineQ.isLoading}
        data={timelineQ.data?.data ?? undefined}
      />

      {/* Change Status */}
      <ChangeStatusModal
        isOpen={!!statusTargets}
        onClose={() => setStatusTargets(null)}
        control={form.control}
        nextStatus={nextStatus}
        setNextStatus={setNextStatus}
        statusOptions={(statusesQ.data?.data?.items ?? []).map((s) => ({
          value: s.code,
          label: `${s.code} — ${s.name}`,
        }))}
        saving={changeStatusM.isPending}
        onSave={async () => {
          if (!statusTargets || statusTargets.length === 0 || !nextStatus) return;
          const noteVal = form.getValues("__note") as string | undefined;
          for (const id of statusTargets) {
            // eslint-disable-next-line no-await-in-loop
            await changeStatusM.mutateAsync({
              id,
              to_status: nextStatus,
              note: noteVal || undefined,
            });
          }
          setStatusTargets(null);
        }}
      />

      {/* Print */}
      <PrintModal
        isOpen={!!printId}
        onClose={() => setPrintId(null)}
        loading={printQ.isLoading}
        data={printQ.data?.data ?? undefined}
      />

      {/* Bulk Print */}
      <BulkPrintModal
        ids={bulkPrintIds ?? []}
        isOpen={!!bulkPrintIds}
        onClose={() => setBulkPrintIds(null)}
      />
    </>
  );
}
