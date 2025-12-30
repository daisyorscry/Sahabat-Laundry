import * as React from "react";
import type { DashboardData } from "@/features/order-service/useReports";
import Surface from "@/components/layouts/page/Surface";

type Props = {
  data?: DashboardData | null;
  isLoading?: boolean;
};

export default function OrderStatusChart({ data, isLoading }: Props) {
  const statusData = React.useMemo(() => {
    if (!data?.order_status) {
      return [
        { label: "New", value: 0, color: "bg-blue-500" },
        { label: "Processing", value: 0, color: "bg-yellow-500" },
        { label: "Ready", value: 0, color: "bg-purple-500" },
        { label: "Done", value: 0, color: "bg-green-500" },
        { label: "Canceled", value: 0, color: "bg-red-500" },
      ];
    }

    const { order_status } = data;
    return [
      { label: "New", value: order_status.new, color: "bg-blue-500" },
      { label: "Processing", value: order_status.processing, color: "bg-yellow-500" },
      { label: "Ready", value: order_status.ready, color: "bg-purple-500" },
      { label: "Done", value: order_status.done, color: "bg-green-500" },
      { label: "Canceled", value: order_status.canceled, color: "bg-red-500" },
    ];
  }, [data]);

  const total = React.useMemo(() => {
    return statusData.reduce((sum, item) => sum + item.value, 0);
  }, [statusData]);

  return (
    <Surface className="p-4">
      <h3 className="text-foreground mb-4 text-lg font-semibold">Order Status Breakdown</h3>

      {isLoading ? (
        <div className="flex h-64 items-center justify-center">
          <div className="text-foreground/60 text-sm">Loading chart...</div>
        </div>
      ) : total === 0 ? (
        <div className="flex h-64 items-center justify-center">
          <div className="text-foreground/60 text-sm">No orders yet</div>
        </div>
      ) : (
        <div className="space-y-3">
          {statusData.map((item, idx) => {
            const percent = total > 0 ? (item.value / total) * 100 : 0;
            return (
              <div key={idx}>
                <div className="mb-1 flex items-center justify-between text-sm">
                  <span className="text-foreground font-medium">{item.label}</span>
                  <span className="text-foreground/60">
                    {item.value} ({percent.toFixed(1)}%)
                  </span>
                </div>
                <div className="bg-surface-secondary h-2 w-full overflow-hidden rounded-full">
                  <div
                    className={`h-full transition-all ${item.color}`}
                    style={{ width: `${percent}%` }}
                  />
                </div>
              </div>
            );
          })}
        </div>
      )}
    </Surface>
  );
}
