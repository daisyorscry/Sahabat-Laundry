import * as React from "react";
import type { CustomersReportData } from "@/features/order-service/useReports";
import Surface from "@/components/layouts/page/Surface";
import DataTable from "@/components/table/DataTable";
import type { Column } from "@/components/table/types";
import { FaMedal } from "react-icons/fa6";

type Props = {
  data?: CustomersReportData | null;
  isLoading?: boolean;
};

type CustomerReportRow = {
  customer_id: string;
  name: string;
  email: string;
  orders_count: number;
  revenue: number;
  last_order_at: string;
};

export default function CustomersReportTable({ data, isLoading }: Props) {
  const rows: CustomerReportRow[] = React.useMemo(() => data?.items ?? [], [data]);

  const columns: Column<CustomerReportRow>[] = React.useMemo(
    () => [
      {
        id: "rank",
        header: "Rank",
        width: "60px",
        accessor: (row) => {
          const idx = rows.findIndex((r) => r.customer_id === row.customer_id);
          if (idx === 0) {
            return <FaMedal className="text-amber-500" aria-label="Rank 1" />;
          }
          if (idx === 1) {
            return <FaMedal className="text-gray-400" aria-label="Rank 2" />;
          }
          if (idx === 2) {
            return <FaMedal className="text-orange-600" aria-label="Rank 3" />;
          }
          return <span className="text-foreground">{idx + 1}</span>;
        },
      },
      {
        id: "name",
        header: "Customer Name",
        accessor: (row) => <span className="font-medium text-foreground">{row.name}</span>,
      },
      {
        id: "email",
        header: "Email",
        accessor: (row) => <span className="text-foreground/70">{row.email}</span>,
      },
      {
        id: "orders_count",
        header: "Orders",
        className: "text-right",
        accessor: (row) => <span className="text-foreground">{row.orders_count}</span>,
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
      {
        id: "last_order_at",
        header: "Last Order",
        className: "text-right",
        accessor: (row) => (
          <span className="text-xs text-foreground/70">
            {new Date(row.last_order_at).toLocaleDateString("id-ID", {
              day: "2-digit",
              month: "short",
              year: "numeric",
            })}
          </span>
        ),
      },
    ],
    [rows]
  );

  return (
    <Surface className="p-4">
      <h3 className="text-foreground mb-4 text-lg font-semibold">Top Customers Activity</h3>
      <DataTable<CustomerReportRow>
        data={rows}
        columns={columns}
        keyField="customer_id"
        loading={isLoading}
        loadingText="Memuat data..."
        emptyState={{
          variant: "ghost",
          align: "center",
          title: "Tidak ada data",
          description: "Belum ada customer activity di periode ini",
          size: "sm",
        }}
      />
    </Surface>
  );
}
