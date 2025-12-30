import * as React from "react";
import type { DashboardData } from "@/features/order-service/useReports";
import Surface from "@/components/layouts/page/Surface";
import { FiBarChart2, FiClock, FiDollarSign, FiPackage, FiUsers } from "react-icons/fi";

type Props = {
  data?: DashboardData | null;
  isLoading?: boolean;
};

export default function DashboardCards({ data, isLoading }: Props) {
  type CardItem = {
    label: string;
    value: string;
    icon: React.ReactNode;
    color: string;
  };

  const cards = React.useMemo(() => {
    if (!data?.summary) {
      const items: CardItem[] = [
        { label: "Total Revenue", value: "Rp 0", icon: <FiDollarSign />, color: "text-green-600" },
        { label: "Total Orders", value: "0", icon: <FiPackage />, color: "text-blue-600" },
        { label: "Active Customers", value: "0", icon: <FiUsers />, color: "text-purple-600" },
        { label: "Pending Orders", value: "0", icon: <FiClock />, color: "text-orange-600" },
        { label: "Avg Order Value", value: "Rp 0", icon: <FiBarChart2 />, color: "text-pink-600" },
      ];
      return items;
    }

    const { summary } = data;
    const items: CardItem[] = [
      {
        label: "Total Revenue",
        value: `Rp ${summary.total_revenue.toLocaleString("id-ID")}`,
        icon: <FiDollarSign />,
        color: "text-green-600",
      },
      {
        label: "Total Orders",
        value: summary.total_orders.toLocaleString("id-ID"),
        icon: <FiPackage />,
        color: "text-blue-600",
      },
      {
        label: "Active Customers",
        value: summary.active_customers.toLocaleString("id-ID"),
        icon: <FiUsers />,
        color: "text-purple-600",
      },
      {
        label: "Pending Orders",
        value: summary.pending_orders.toLocaleString("id-ID"),
        icon: <FiClock />,
        color: "text-orange-600",
      },
      {
        label: "Avg Order Value",
        value: `Rp ${summary.avg_order_value.toLocaleString("id-ID")}`,
        icon: <FiBarChart2 />,
        color: "text-pink-600",
      },
    ];
    return items;
  }, [data]);

  return (
    <div className="grid grid-cols-1 gap-4 sm:grid-cols-2 lg:grid-cols-5">
      {cards.map((card, idx) => (
        <Surface key={idx} className="p-4">
          {isLoading ? (
            <>
              <div className="mb-2 h-8 w-8 animate-pulse rounded bg-gray-300" />
              <div className="mb-1 h-4 w-20 animate-pulse rounded bg-gray-300" />
              <div className="h-6 w-24 animate-pulse rounded bg-gray-300" />
            </>
          ) : (
            <>
              <div className={`mb-2 text-3xl ${card.color}`}>{card.icon}</div>
              <div className="text-foreground/60 text-xs font-medium">{card.label}</div>
              <div className="text-foreground text-xl font-bold">{card.value}</div>
            </>
          )}
        </Surface>
      ))}
    </div>
  );
}
