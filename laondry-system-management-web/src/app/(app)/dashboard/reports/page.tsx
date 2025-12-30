"use client";

import * as React from "react";
import Button from "@/components/button/Button";
import OutletSelect from "../outlets/_parts/OutletSelect";
import { useForm, type FieldValues } from "react-hook-form";
import DateRangeField from "@/components/form/fields/DateRangeField";
import Dropdown from "@/components/partials/Dropdown";
import {
  useDashboard,
  useRevenue,
  useServiceUsage,
  useTurnaround,
  useCustomersReport,
  type ReportParams,
} from "@/features/order-service/useReports";
import DashboardCards from "./_parts/DashboardCards";
import RevenueChart from "./_parts/RevenueChart";
import OrderStatusChart from "./_parts/OrderStatusChart";
import TopServicesTable from "./_parts/TopServicesTable";
import ServiceUsageTable from "./_parts/ServiceUsageTable";
import TurnaroundCard from "./_parts/TurnaroundCard";
import CustomersReportTable from "./_parts/CustomersReportTable";
import { PageContainer } from "@/components/layouts/page/Page";
import Surface from "@/components/layouts/page/Surface";
import HeaderBar from "@/components/layouts/page/HeaderBar";

export default function ReportsPage() {
  // Default: this month
  const today = new Date();
  const firstDay = new Date(today.getFullYear(), today.getMonth(), 1);
  const lastDay = new Date(today.getFullYear(), today.getMonth() + 1, 0);

  const [outletId, setOutletId] = React.useState<string>("");
  const [dateFrom, setDateFrom] = React.useState<string>(
    firstDay.toISOString().split("T")[0] || ""
  );
  const [dateTo, setDateTo] = React.useState<string>(
    lastDay.toISOString().split("T")[0] || ""
  );
  const [groupBy, setGroupBy] = React.useState<"day" | "week" | "month">("day");

  type FilterForm = {
    range: { start?: string; end?: string };
  } & FieldValues;

  const form = useForm<FilterForm>({
    defaultValues: {
      range: { start: dateFrom, end: dateTo },
    },
  });

  const params: ReportParams = React.useMemo(
    () => ({
      outlet_id: outletId || null,
      date_from: dateFrom,
      date_to: dateTo,
    }),
    [outletId, dateFrom, dateTo]
  );

  const dashboardQ = useDashboard(params);
  const revenueQ = useRevenue({ ...params, group_by: groupBy });
  const serviceUsageQ = useServiceUsage({ ...params, order_by: "revenue", limit: 10 });
  const turnaroundQ = useTurnaround(params);
  const customersQ = useCustomersReport({ ...params, sort: "revenue", limit: 20 });

  const handleThisMonth = () => {
    const now = new Date();
    const first = new Date(now.getFullYear(), now.getMonth(), 1);
    const last = new Date(now.getFullYear(), now.getMonth() + 1, 0);
    form.setValue("range", {
      start: first.toISOString().split("T")[0] || "",
      end: last.toISOString().split("T")[0] || "",
    });
  };

  const handleThisWeek = () => {
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
  };

  const handleToday = () => {
    const now = new Date();
    const today = now.toISOString().split("T")[0] || "";
    form.setValue("range", { start: today, end: today });
  };

  // Sync DateRangeField value to local state used by queries
  const range = form.watch("range");
  React.useEffect(() => {
    const start = range?.start ? String(range.start).split("T")[0] : "";
    const end = range?.end ? String(range.end).split("T")[0] : "";
    setDateFrom(start);
    setDateTo(end);
  }, [range?.start, range?.end]);

  return (
    <>
      <HeaderBar title="Laporan & Analitik" />
      <PageContainer>
        {/* Filters */}
        <Surface className="mb-4 p-4">
          <div className="grid grid-cols-1 gap-4 md:grid-cols-2 lg:grid-cols-4">
            <div>
              <label className="text-foreground mb-1 block text-sm font-medium">Outlet</label>
              <OutletSelect
                value={outletId}
                onChange={(val) => setOutletId(val)}
                placeholder="Semua Outlet"
              />
            </div>
            <div className="lg:col-span-2">
              <DateRangeField
                control={form.control}
                field={{
                  type: "date-range",
                  name: "range",
                  label: "Tanggal",
                  mode: "date",
                  placeholder: "Pilih rentang tanggal",
                }}
              />
            </div>
            <div>
              <label htmlFor="groupBy" className="text-foreground mb-1 block text-sm font-medium">Group By</label>
              <Dropdown
                id="groupBy"
                value={groupBy}
                onChange={(v) => setGroupBy(v as "day" | "week" | "month")}
                options={[
                  { value: "day", label: "Harian" },
                  { value: "week", label: "Mingguan" },
                  { value: "month", label: "Bulanan" },
                ]}
                placeholder="Pilih grouping"
              />
            </div>
          </div>
          <div className="mt-3 flex gap-2">
            <Button variant="outline" tone="neutral" onClick={handleToday}>
              Hari Ini
            </Button>
            <Button variant="outline" tone="neutral" onClick={handleThisWeek}>
              Minggu Ini
            </Button>
            <Button variant="outline" tone="neutral" onClick={handleThisMonth}>
              Bulan Ini
            </Button>
          </div>
        </Surface>

        {/* Dashboard Cards */}
        <DashboardCards data={dashboardQ.data?.data} isLoading={dashboardQ.isLoading} />

        {/* Charts Row */}
        <div className="mt-4 grid grid-cols-1 gap-4 lg:grid-cols-2">
          <RevenueChart
            data={revenueQ.data?.data}
            isLoading={revenueQ.isLoading && !(dashboardQ.data?.data?.revenue_trend?.length)}
            groupBy={groupBy}
            fallbackBuckets={dashboardQ.data?.data?.revenue_trend}
            fallbackTotal={dashboardQ.data?.data?.summary?.total_revenue}
          />
          <OrderStatusChart
            data={dashboardQ.data?.data}
            isLoading={dashboardQ.isLoading}
          />
        </div>

        {/* Top Services & Turnaround */}
        <div className="mt-4 grid grid-cols-1 gap-4 lg:grid-cols-3">
          <div className="lg:col-span-2">
            <TopServicesTable
              data={dashboardQ.data?.data}
              isLoading={dashboardQ.isLoading}
            />
          </div>
          <TurnaroundCard data={turnaroundQ.data?.data} isLoading={turnaroundQ.isLoading} />
        </div>

        {/* Service Usage Table */}
        <div className="mt-4">
          <ServiceUsageTable data={serviceUsageQ.data?.data} isLoading={serviceUsageQ.isLoading} />
        </div>

        {/* Customers Report */}
        <div className="mt-4">
          <CustomersReportTable data={customersQ.data?.data} isLoading={customersQ.isLoading} />
        </div>
      </PageContainer>
    </>
  );
}
