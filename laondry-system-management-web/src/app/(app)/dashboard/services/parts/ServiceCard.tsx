"use client";

import * as React from "react";
import Image from "next/image";
import { FiCheck } from "react-icons/fi";

import Button from "@/components/button/Button";
import type { Service } from "@/features/order-service/useService";
import { div } from "motion/react-client";

export type ServiceCardProps = {
  data: Service;
  className?: string;
  features?: string[]; // opsional: list fitur (ceklist)
  taxNote?: string; // default: "With Tax"
  priceLabel?: string; // default: "Starts at"
  onReadMore?: (s: Service) => void; // aksi “Read More”
  onDetails?: (s: Service) => void;
  onEdit?: (s: Service) => void;
  onDelete?: (s: Service) => void;
  onManageAddons?: (s: Service) => void;
};

// util rupiah
function formatIDR(n: string | number) {
  const v = typeof n === "string" ? Number(n) : n;
  if (Number.isNaN(v)) return "-";
  return new Intl.NumberFormat("id-ID", {
    style: "currency",
    currency: "IDR",
    maximumFractionDigits: 0,
  }).format(v);
}
const muted = "text-[color-mix(in oklab,var(--color-foreground) 65%,var(--color-background))]";
const soft = "bg-[color-mix(in oklab,var(--color-foreground) 6%,var(--color-background))]";

export default function ServiceCard({
  data: s,
  className,
  features = [],
  taxNote = "With Tax",
  priceLabel = "Starts at",
  onReadMore,
  onDetails,
  onEdit,
  onDelete,
  onManageAddons,
}: ServiceCardProps) {
  const unit = s.pricing_model === "piece" ? "/pc" : "/kg";
  const price = formatIDR(s.base_price);

  return (
    <article
      className={[
        "relative flex flex-col overflow-hidden rounded-2xl border",
        "border-[var(--color-border)] bg-[var(--color-surface)] shadow-sm",
        "transition-transform hover:-translate-y-[1px]",
        className ?? "",
      ].join(" ")}
    >
      {/* Header: icon + harga kanan */}
      <div className="flex items-start gap-3 p-4 pb-2">
        {/* Icon kiri */}
        <div
          className={[
            "relative grid aspect-square w-20 place-items-center overflow-hidden",
            soft,
          ].join(" ")}
        >
          {s.icon_url ? (
            <Image
              src={
                "https://image.idntimes.com/post/20220627/image-23eb6c357dad1bd2ebc81d52ea2db034.jpg"
              }
              alt={s.name}
              fill
              unoptimized
              className="object-cover rounded-2xl"
              sizes="64px"
              priority={false}
            />
          ) : (
            <div className={`text-xs ${muted}`}>No Image</div>
          )}
        </div>

        {/* Harga kanan */}
        <div className="ml-auto flex flex-col items-end leading-none">
          <span className={`text-xs ${muted}`}>{priceLabel}</span>
          <div className="flex items-baseline gap-1">
            <span className="text-[28px] font-extrabold tracking-tight text-[var(--color-brand-500)]">
              {price}
            </span>
            <span className="text-base font-semibold text-[var(--color-foreground)]">{unit}</span>
          </div>
          <span className={`mt-0.5 text-[11px] ${muted}`}>{taxNote}</span>
        </div>
      </div>

      {/* Status badges */}
      <div className="flex items-center gap-2 px-4">
        <span
          className={[
            "inline-flex items-center rounded-full border px-2 py-0.5 text-[12px]/[16px]",
            s.is_active
              ? "border-[var(--color-emerald-400)]"
              : "border-[var(--color-border)] " + muted,
          ].join(" ")}
        >
          {s.is_active ? "Active" : "Inactive"}
        </span>
        {s.is_express_available && (
          <span className="inline-flex items-center rounded-full border border-[var(--color-border)] px-2 py-0.5 text-[12px]/[16px]">
            Express
          </span>
        )}
      </div>

      {/* Title + desc */}
      <div className="px-4 pt-3">
        <h3 className="text-lg font-semibold text-[var(--color-foreground)]">{s.name}</h3>
        <p className={`mt-1 line-clamp-2 text-sm ${muted}`}>{s.description ?? "—"}</p>

        {onReadMore && (
          <button
            className="mt-3 text-sm font-medium text-[var(--color-brand-500)] underline-offset-4 hover:underline"
            onClick={() => onReadMore(s)}
          >
            Read More
          </button>
        )}
      </div>

      {features.length > 0 && (
        <ul className="mt-3 space-y-2 px-4 pt-1 pb-2">
          {features.map((f, i) => (
            <li key={i} className="flex items-start gap-2">
                <div>{i}</div>
              <span className="mt-[2px] grid h-4 w-4 place-items-center rounded-full">
                <FiCheck className="text-[var(--color-brand-500)]" />
              </span>
              <span className="text-[15px] font-medium text-[var(--color-foreground)]">{f}</span>
            </li>
          ))}
        </ul>
      )}

      {/* Footer actions */}
      <div className="mt-3 flex items-center justify-between border-t border-[var(--color-border)] px-4 py-3">
        <div className={`text-xs ${muted}`}>
          Est. {s.est_duration_hours} jam • Min. Qty{" "}
          <span className="text-[var(--color-foreground)]">{s.min_qty ?? 0}</span>
        </div>
        <div className="flex gap-2">
          <Button
            size="sm"
            roundedSize="xl"
            variant="soft"
            tone="primary"
            onClick={() => onDetails?.(s)}
          >
            Detail
          </Button>
          <Button
            size="sm"
            roundedSize="xl"
            variant="soft"
            tone="primary"
            onClick={() => onEdit?.(s)}
          >
            Edit
          </Button>
          <Button
            size="sm"
            roundedSize="xl"
            variant="soft"
            tone="danger"
            onClick={() => onDelete?.(s)}
          >
            Hapus
          </Button>
          <Button size="sm" variant="ghost" tone="primary" onClick={() => onManageAddons?.(s)}>
            Addons
          </Button>
        </div>
      </div>
    </article>
  );
}
