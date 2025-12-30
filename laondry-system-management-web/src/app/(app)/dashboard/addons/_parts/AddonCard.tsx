"use client";

import Image from "next/image";

import Button from "@/components/button/Button";
import type { Addon } from "@/features/order-service/useAddons";

export default function AddonCard({
  data,
  onEdit,
  onDelete,
}: {
  data: Addon;
  onEdit: (row: Addon) => void;
  onDelete: (row: Addon) => void;
}) {
  const price = (() => {
    const v = typeof data.price === "string" ? Number(data.price) : data.price;
    if (Number.isNaN(v)) return "-";
    return new Intl.NumberFormat("id-ID", {
      style: "currency",
      currency: "IDR",
      maximumFractionDigits: 0,
    }).format(v);
  })();

  return (
    <article
      className={[
        "group relative flex flex-col overflow-hidden rounded-xl border shadow-sm",
    "border-[var(--border)] bg-[var(--surface)]",
        "transition-transform hover:-translate-y-0.5",
      ].join(" ")}
    >
      <div className="relative aspect-[4/3] w-full overflow-hidden bg-[var(--muted)]">
        {data.icon_url ? (
          <Image
            src={"https://image.idntimes.com/post/20220627/image-23eb6c357dad1bd2ebc81d52ea2db034.jpg"}
            alt={data.name}
            fill
            sizes="(max-width: 768px) 100vw, 33vw"
            className="object-cover"
            priority={false}
          />
        ) : (
          <div className="flex h-full w-full items-center justify-center text-sm text-[var(--muted-foreground)]">
            Tidak ada gambar
          </div>
        )}
        <div
          className={[
            "absolute top-3 left-3 inline-flex items-center rounded-full border px-2 py-0.5 text-[12px]",
            data.is_active
              ? "border-[var(--color-emerald-400)] bg-[var(--surface)]"
              : "border-[var(--border)] bg-[var(--surface)] opacity-75",
          ].join(" ")}
        >
          {data.is_active ? "Aktif" : "Nonaktif"}
        </div>
      </div>

      <div className="flex flex-1 flex-col gap-2 p-3">
        <div className="flex items-start justify-between gap-2">
          <h3 className="line-clamp-1 font-medium text-[var(--foreground)]">{data.name}</h3>
          <span className="shrink-0 text-xs text-[var(--muted-foreground)]">{data.code}</span>
        </div>
        {data.description ? (
          <p className="line-clamp-2 text-sm text-[var(--muted-foreground)]">{data.description}</p>
        ) : (
          <p className="line-clamp-2 text-sm text-[var(--muted-foreground)] opacity-70">—</p>
        )}

        <div className="mt-auto flex items-center justify-between pt-1">
          <span className="font-semibold tabular-nums">{price}</span>
          <div className="flex gap-2">
            <Button
              size="sm"
              roundedSize="xl"
              variant="soft"
              tone="primary"
              onClick={() => onEdit(data)}
            >
              Edit
            </Button>
            <Button
              size="sm"
              roundedSize="xl"
              variant="soft"
              tone="danger"
              onClick={() => onDelete(data)}
            >
              Hapus
            </Button>
          </div>
        </div>
      </div>
    </article>
  );
}
