import * as React from "react";
import type { DashboardData } from "@/features/order-service/useReports";
import Surface from "@/components/layouts/page/Surface";
import DataTable from "@/components/table/DataTable";
import type { Column } from "@/components/table/types";
import { FaMedal } from "react-icons/fa6";

type Props = {
  data?: DashboardData | null;
  isLoading?: boolean;
};

type TopServiceRow = {
  name: string;
  revenue: number;
};

export default function TopServicesTable({ data, isLoading }: Props) {
  const rows: TopServiceRow[] = React.useMemo(() => data?.top_services ?? [], [data]);

  const columns: Column<TopServiceRow>[] = React.useMemo(
    () => [
      {
        id: "rank",
        header: "Rank",
        width: "60px",
        accessor: (row) => {
          const idx = rows.findIndex((r) => r.name === row.name);
          if (idx === 0) {
            return <FaMedal className="text-amber-500" aria-label="Rank 1" />;
          }
          if (idx === 1) {
            return <FaMedal className="text-gray-400" aria-label="Rank 2" />;
          }
          if (idx === 2) {
            return <FaMedal className="text-orange-600" aria-label="Rank 3" />;
          }
          return <span className="text-foreground">#{idx + 1}</span>;
        },
      },
      {
        id: "name",
        header: "Service Name",
        accessor: (row) => <span className="font-medium text-foreground">{row.name}</span>,
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
    [rows]
  );

  return (
    <Surface className="p-4">
      <h3 className="text-foreground mb-4 text-lg font-semibold">Top 5 Services by Revenue</h3>
      <DataTable<TopServiceRow>
        data={rows}
        columns={columns}
        keyField="name"
        loading={isLoading}
        loadingText="Memuat data..."
        emptyState={{
          variant: "ghost",
          align: "center",
          title: "Tidak ada data",
          description: "Belum ada services di periode ini",
          size: "sm",
        }}
      />
    </Surface>
  );
}
