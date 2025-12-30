import * as React from "react";
import type { TurnaroundData } from "@/features/order-service/useReports";
import Surface from "@/components/layouts/page/Surface";

type Props = {
  data?: TurnaroundData | null;
  isLoading?: boolean;
};

export default function TurnaroundCard({ data, isLoading }: Props) {
  return (
    <Surface className="p-4">
      <h3 className="text-foreground mb-4 text-lg font-semibold">Turnaround Time</h3>

      {isLoading ? (
        <div className="space-y-3">
          {[1, 2, 3, 4].map((i) => (
            <div key={i} className="space-y-1">
              <div className="h-3 w-20 animate-pulse rounded bg-gray-300" />
              <div className="h-5 w-16 animate-pulse rounded bg-gray-300" />
            </div>
          ))}
        </div>
      ) : !data?.summary ? (
        <div className="text-foreground/60 py-8 text-center text-sm">No turnaround data</div>
      ) : (
        <div className="space-y-4">
          <div>
            <div className="text-foreground/60 mb-1 text-xs">Orders Completed</div>
            <div className="text-foreground text-2xl font-bold">
              {data.summary.orders_done.toLocaleString("id-ID")}
            </div>
          </div>

          <div>
            <div className="text-foreground/60 mb-1 text-xs">Average Time</div>
            <div className="text-foreground text-2xl font-bold">
              {data.summary.avg_hours.toFixed(1)} <span className="text-base">jam</span>
            </div>
          </div>

          <div className="border-primary/10 grid grid-cols-2 gap-3 border-t pt-3">
            <div>
              <div className="text-foreground/60 mb-1 text-xs">Fastest</div>
              <div className="text-foreground text-lg font-semibold">
                {data.summary.min_hours.toFixed(1)} <span className="text-xs">jam</span>
              </div>
            </div>
            <div>
              <div className="text-foreground/60 mb-1 text-xs">Slowest</div>
              <div className="text-foreground text-lg font-semibold">
                {data.summary.max_hours.toFixed(1)} <span className="text-xs">jam</span>
              </div>
            </div>
          </div>
        </div>
      )}
    </Surface>
  );
}
