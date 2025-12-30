import * as React from "react";
import type { ServiceUsageData } from "@/features/order-service/useReports";
import Surface from "@/components/layouts/page/Surface";
import DataTable from "@/components/table/DataTable";
import type { Column } from "@/components/table/types";

type Props = {
  data?: ServiceUsageData | null;
  isLoading?: boolean;
};

type ServiceUsageRow = {
  service_id: string;
  service_code: string;
  service_name: string;
  pricing_model: string;
  revenue: number;
  usage_qty: number;
};

export default function ServiceUsageTable({ data, isLoading }: Props) {
  const rows: ServiceUsageRow[] = data?.items ?? [];

  const columns: Column<ServiceUsageRow>[] = React.useMemo(
    () => [
      {
        id: "service_code",
        header: "Code",
        accessor: (row) => (
          <span className="font-mono text-sm text-foreground/80">{row.service_code}</span>
        ),
      },
      {
        id: "service_name",
        header: "Service Name",
        accessor: (row) => <span className="font-medium text-foreground">{row.service_name}</span>,
      },
      {
        id: "pricing_model",
        header: "Model",
        className: "text-center",
        accessor: (row) => (
          <span className="text-xs uppercase text-foreground/70">{row.pricing_model}</span>
        ),
      },
      {
        id: "usage_qty",
        header: "Usage",
        className: "text-right",
        accessor: (row) => (
          <span className="text-foreground">
            {row.usage_qty.toFixed(2)}{" "}
            <span className="text-xs text-foreground/60">
              {row.pricing_model === "piece" ? "pcs" : "kg"}
            </span>
          </span>
        ),
      },
      {
        id: "revenue",
        header: "Revenue",
        className: "text-right",
        accessor: (row) => (
          <span className="font-semibold text-foreground">
            Rp {row.revenue.toLocaleString("id-ID")}
          </span>
        ),
      },
    ],
    []
  );

  return (
    <Surface className="p-4">
      <h3 className="text-foreground mb-4 text-lg font-semibold">Service Usage Details</h3>
      <DataTable<ServiceUsageRow>
        data={rows}
        columns={columns}
        keyField="service_id"
        loading={isLoading}
        loadingText="Memuat data..."
        emptyState={{
          variant: "ghost",
          align: "center",
          title: "Tidak ada data",
          description: "Belum ada service usage di periode ini",
          size: "sm",
        }}
      />
    </Surface>
  );
}
