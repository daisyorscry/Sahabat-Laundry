import * as React from "react";
import type { RevenueData } from "@/features/order-service/useReports";
import Surface from "@/components/layouts/page/Surface";

type Bucket = { date: string; revenue: number };
type Props = {
  data?: RevenueData | null;
  isLoading?: boolean;
  groupBy: "day" | "week" | "month";
  // Fallback if /report/revenue is not available
  fallbackBuckets?: Bucket[];
  fallbackTotal?: number;
};

export default function RevenueChart({ data, isLoading, groupBy, fallbackBuckets, fallbackTotal }: Props) {
  const chartData = React.useMemo(() => {
    const buckets: Bucket[] | undefined = data?.buckets ?? fallbackBuckets;
    if (!buckets || buckets.length === 0) return [];
    return buckets.map((b) => ({
      date: new Date(b.date).toLocaleDateString("id-ID", {
        day: groupBy === "day" ? "2-digit" : undefined,
        month: "short",
        year: groupBy === "month" ? "numeric" : undefined,
      }),
      revenue: b.revenue,
    }));
  }, [data, groupBy, fallbackBuckets]);

  const maxRevenue = React.useMemo(() => {
    if (!chartData.length) return 0;
    return Math.max(...chartData.map((d) => d.revenue));
  }, [chartData]);

  return (
    <Surface className="p-4">
      <div className="mb-4 flex items-center justify-between">
        <h3 className="text-foreground text-lg font-semibold">Revenue Trend</h3>
        {(data?.summary || fallbackBuckets) && (
          <div className="text-foreground text-sm">
            Total: {" "}
            <span className="font-bold">
              Rp
              {" "}
              {(data?.summary?.total_revenue ?? fallbackTotal ?? (fallbackBuckets ? fallbackBuckets.reduce((acc, b) => acc + b.revenue, 0) : 0)).toLocaleString(
                "id-ID"
              )}
            </span>
          </div>
        )}
      </div>

      {isLoading ? (
        <div className="flex h-64 items-center justify-center">
          <div className="text-foreground/60 text-sm">Loading chart...</div>
        </div>
      ) : chartData.length === 0 ? (
        <div className="flex h-64 items-center justify-center">
          <div className="text-foreground/60 text-sm">No data available</div>
        </div>
      ) : (
        <div className="relative h-64">
          {/* Simple bar chart */}
          <div className="flex h-full items-end justify-between gap-1">
            {chartData.map((item, idx) => {
              const heightPercent = maxRevenue > 0 ? (item.revenue / maxRevenue) * 100 : 0;
              return (
                <div key={idx} className="flex flex-1 flex-col items-center">
                  <div className="relative flex-1 w-full flex items-end">
                    <div
                      className="bg-primary/80 hover:bg-primary w-full rounded-t transition-all"
                      style={{ height: `${heightPercent}%` }}
                      title={`${item.date}: Rp ${item.revenue.toLocaleString("id-ID")}`}
                    />
                  </div>
                  <div className="text-foreground/60 mt-2 text-[10px]">
                    {item.date}
                  </div>
                </div>
              );
            })}
          </div>
        </div>
      )}
    </Surface>
  );
}
