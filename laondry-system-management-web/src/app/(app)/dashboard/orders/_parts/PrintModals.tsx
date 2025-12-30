"use client";

import * as React from "react";
import Modal from "@/components/ui/Modal";
import type { OrderDetail } from "@/features/orders/useOrders";

export function PrintModal({
  isOpen,
  onClose,
  loading,
  data,
}: {
  isOpen: boolean;
  onClose: () => void;
  loading: boolean;
  data?: { order: OrderDetail; printed_at: string };
}) {
  return (
    <Modal isOpen={isOpen} onClose={onClose} title="Print Preview" size="xl">
      {loading ? (
        <div className="text-foreground/60 text-sm">Memuat…</div>
      ) : data ? (
        <div className="space-y-2 text-sm">
          <div className="opacity-70">Printed at: {new Date(data.printed_at).toLocaleString("id-ID")}</div>
          <pre className="bg-surface-secondary max-h-96 overflow-auto rounded p-3">
            {JSON.stringify(data.order, null, 2)}
          </pre>
        </div>
      ) : (
        <div className="text-foreground/60 text-sm">Data tidak tersedia</div>
      )}
    </Modal>
  );
}

export function BulkPrintModal({ ids, isOpen, onClose }: { ids: string[] | null; isOpen: boolean; onClose: () => void }) {
  return (
    <Modal isOpen={isOpen} onClose={onClose} title="Bulk Print Preview" size="xl">
      <div className="space-y-3 text-sm">
        {!ids || ids.length === 0 ? <div className="text-foreground/60">Tidak ada pilihan</div> : <BulkPrintContent ids={ids} />}
      </div>
    </Modal>
  );
}

function BulkPrintContent({ ids }: { ids: string[] }) {
  const [results, setResults] = React.useState<{ id: string; data?: { order: OrderDetail; printed_at: string } | undefined; error?: string }[]>([]);
  const [loading, setLoading] = React.useState(false);

  React.useEffect(() => {
    let cancelled = false;
    async function run() {
      setLoading(true);
      const out: { id: string; data?: { order: OrderDetail; printed_at: string } | undefined; error?: string }[] = [];
      for (const id of ids) {
        try {
          const { api } = await import("@/lib/axios/api");
          // eslint-disable-next-line no-await-in-loop
          const res = await api().get(`/orders/${id}/print`);
          out.push({ id, data: res.data?.data });
        } catch (e: unknown) {
          const msg = e instanceof Error ? e.message : String(e);
          out.push({ id, error: msg || "Gagal memuat" });
        }
        if (cancelled) break;
      }
      if (!cancelled) setResults(out);
      if (!cancelled) setLoading(false);
    }
    run();
    return () => {
      cancelled = true;
    };
  }, [ids]);

  if (loading && results.length === 0) return <div className="text-foreground/60">Memuat…</div>;
  return (
    <div className="max-h-[70vh] space-y-3 overflow-auto pr-1">
      {results.map((r) => (
        <div key={r.id} className="rounded border p-2">
          <div className="mb-1 text-xs opacity-70">Order ID: {r.id}</div>
          {r.error ? (
            <div className="text-rose-600">{r.error}</div>
          ) : (
            <pre className="bg-surface-secondary overflow-auto rounded p-2 text-xs">{JSON.stringify(r.data, null, 2)}</pre>
          )}
        </div>
      ))}
    </div>
  );
}
