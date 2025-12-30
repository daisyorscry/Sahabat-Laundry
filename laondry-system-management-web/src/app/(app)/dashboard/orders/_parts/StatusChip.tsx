"use client";

import * as React from "react";

type Props = {
  value?: string | null;
  className?: string;
};

export default function StatusChip({ value, className = "" }: Props) {
  const s = (value || "").toUpperCase();

  // warna chip lebih cerah + halus
  const cls =
    s === "NEW"
      ? "bg-blue-100 text-blue-800 ring-1 ring-blue-200"
      : s === "PROCESSING"
        ? "bg-amber-100 text-amber-800 ring-1 ring-amber-200"
        : s === "READY"
          ? "bg-violet-100 text-violet-800 ring-1 ring-violet-200"
          : s === "DONE" || s === "COMPLETED"
            ? "bg-emerald-100 text-emerald-800 ring-1 ring-emerald-200"
            : s === "CANCELED" || s === "CANCELLED"
              ? "bg-rose-100 text-rose-800 ring-1 ring-rose-200"
              : "bg-gray-100 text-gray-700 ring-1 ring-gray-200";

  return (
    <span
      className={[
        "inline-flex items-center rounded-full px-2.5 py-1 text-[10px] font-medium tracking-wide uppercase",
        "transition-colors duration-150",
        cls,
        className,
      ].join(" ")}
    >
      {s || "-"}
    </span>
  );
}
