"use client";

import * as React from "react";
import { Control } from "react-hook-form";

import Button from "@/components/button/Button";
import DateRangeField from "@/components/form/fields/DateRangeField";
import TextField from "@/components/form/fields/TextField";
import Dropdown from "@/components/partials/Dropdown";

import type { Filters } from "./types";
import OutletSelect from "../../outlets/_parts/OutletSelect";

type OrderTypeOpt = "" | "DROPOFF" | "PICKUP";

type Props = {
  control: Control<Filters>;
  outletId: string;
  setOutletId: (v: string) => void;
  status: string;
  setStatus: (v: string) => void;
  type: OrderTypeOpt;
  setType: (v: OrderTypeOpt) => void;
  statusOptions: { value: string; label: string }[];
  onToday: () => void;
  onThisWeek: () => void;
  onThisMonth: () => void;
};

export default function FiltersBar({
  control,
  outletId,
  setOutletId,
  status,
  setStatus,
  type,
  setType,
  statusOptions,
  onToday,
  onThisWeek,
  onThisMonth,
}: Props) {
  return (
    <div className="grid grid-cols-1 gap-4 md:grid-cols-2 lg:grid-cols-5">
      <div>
        <label className="text-foreground mb-1 block text-sm font-medium">Outlet</label>
        <OutletSelect value={outletId} onChange={setOutletId} placeholder="Semua Outlet" />
      </div>

      <div className="lg:col-span-2">
        <DateRangeField
          control={control}
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
        <label htmlFor="status" className="text-foreground mb-1 block text-sm font-medium">
          Status
        </label>
        <Dropdown
          id="status"
          value={status}
          onChange={setStatus}
          options={[{ value: "", label: "Semua Status" }, ...statusOptions]}
          placeholder="Semua Status"
        />
      </div>

      <div>
        <label htmlFor="type" className="text-foreground mb-1 block text-sm font-medium">
          Type
        </label>
        <Dropdown
          id="type"
          value={type}
          onChange={(v) => setType(v as OrderTypeOpt)}
          options={[
            { value: "", label: "Semua Tipe" },
            { value: "DROPOFF", label: "Dropoff" },
            { value: "PICKUP", label: "Pickup" },
          ]}
          placeholder="Semua Tipe"
        />
      </div>

      <div className="lg:col-span-2">
        <TextField
          control={control}
          field={{ type: "text", name: "q", label: "Cari Order No", placeholder: "Cari..." }}
        />
      </div>

      <div className="flex items-end gap-2">
        <Button variant="outline" tone="neutral" onClick={onToday}>
          Hari Ini
        </Button>
        <Button variant="outline" tone="neutral" onClick={onThisWeek}>
          Minggu Ini
        </Button>
        <Button variant="outline" tone="neutral" onClick={onThisMonth}>
          Bulan Ini
        </Button>
      </div>
    </div>
  );
}
