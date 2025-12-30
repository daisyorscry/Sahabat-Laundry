"use client";

import * as React from "react";

type Props = {
  value?: string | null;
  className?: string;
};

export default function TypeBadge({ value, className = "" }: Props) {
  const t = (value || "").toUpperCase();

  const cls =
    t === "PICKUP"
      ? "bg-sky-100 text-sky-800 ring-1 ring-sky-200"
      : t === "DROPOFF"
      ? "bg-indigo-100 text-indigo-800 ring-1 ring-indigo-200"
      : "bg-gray-100 text-gray-700 ring-1 ring-gray-200";

  return (
    <span
      className={[
        "inline-flex items-center rounded-full px-2.5 py-1 text-[10px] font-medium uppercase tracking-wide",
        "transition-colors duration-150",
        cls,
        className,
      ].join(" ")}
    >
      {t || "-"}
    </span>
  );
}
