"use client";

import * as React from "react";
import clsx from "clsx";
import { cubicBezier, LayoutGroup, motion } from "framer-motion";

import {
  useServiceCategoriesList,
  useServiceCategoryDetail,
  type ServiceCategory,
} from "@/features/order-service/useServiceCategory";

const uniqBy = <T extends { id: string }>(arr: T[]) => {
  const seen = new Set<string>();
  return arr.filter((x) => (seen.has(x.id) ? false : (seen.add(x.id), true)));
};

type Props = {
  value: string | null;
  onChange: (id: string | null) => void;
  className?: string;
  perPage?: number;
};

export default function CategoryTabs({ value, onChange, className, perPage = 30 }: Props) {
  const [page, setPage] = React.useState(1);
  const listQ = useServiceCategoriesList({
    q: "",
    is_active: true,
    page,
    per_page: perPage,
    sort: "name",
    order: "asc",
  });

  const [items, setItems] = React.useState<ServiceCategory[]>([]);
  React.useEffect(() => {
    const pageItems = listQ.data?.data?.items ?? [];
    if (pageItems.length) setItems((prev) => uniqBy([...prev, ...pageItems]));
  }, [listQ.data]);

  const lastPage = listQ.data?.data?.pagination?.last_page ?? 1;
  const hasMore = page < lastPage;

  const needEnsure = Boolean(value && !items.some((i) => i.id === value));
  const ensuredDetailQ = useServiceCategoryDetail(needEnsure ? value! : undefined, needEnsure);
  React.useEffect(() => {
    const cat = ensuredDetailQ.data?.data;
    if (cat && !items.some((i) => i.id === cat.id)) {
      setItems((prev) => uniqBy([cat as ServiceCategory, ...prev]));
    }
  }, [ensuredDetailQ.data, items]);

  const loadMore = React.useCallback(() => {
    if (!listQ.isFetching && hasMore) setPage((p) => p + 1);
  }, [listQ.isFetching, hasMore]);

  // scroll active chip into view (rAF biar tidak clash dengan layout anim)
  const scrollRef = React.useRef<HTMLDivElement>(null);
  const activeRef = React.useRef<HTMLButtonElement | null>(null);
  React.useLayoutEffect(() => {
    const el = activeRef.current;
    const container = scrollRef.current;
    if (!el || !container) return;
    const id = requestAnimationFrame(() => {
      const elRect = el.getBoundingClientRect();
      const cRect = container.getBoundingClientRect();
      if (elRect.left < cRect.left || elRect.right > cRect.right) {
        el.scrollIntoView({ behavior: "smooth", inline: "center", block: "nearest" });
      }
    });
    return () => cancelAnimationFrame(id);
  }, [value, items.length]);

  return (
    <div className={clsx("flex items-center gap-2", className)}>
      <div
        ref={scrollRef}
        className="relative -mx-2 flex w-full transform-gpu items-center overflow-x-auto px-2 py-1"
      >
        <LayoutGroup id="category-tabs">
          <TabChip
            active={value === null}
            label="Semua"
            onClick={() => onChange(null)}
            getActiveRef={(el) => {
              if (value === null) activeRef.current = el;
            }}
          />

          <div className="flex items-center gap-2">
            {items.map((c) => (
              <TabChip
                key={c.id}
                active={value === c.id}
                label={c.name}
                title={c.description ?? c.name}
                onClick={() => onChange(c.id)}
                getActiveRef={(el) => {
                  if (value === c.id) activeRef.current = el;
                }}
              />
            ))}
          </div>

          {hasMore ? (
            <motion.button
              type="button"
              onClick={loadMore}
              disabled={listQ.isFetching}
              whileTap={{ scale: 0.98 }}
              className="border-border text-foreground/70 hover:text-foreground/90 ml-2 rounded-full border px-3 py-1.5 text-sm whitespace-nowrap"
              aria-label="Muat lagi kategori"
            >
              {listQ.isFetching ? "Memuat…" : "Muat lagi"}
            </motion.button>
          ) : null}
        </LayoutGroup>
      </div>
    </div>
  );
}

// easing tween yang valid untuk typing framer-motion v11+
const easeSoft = cubicBezier(0.2, 0.8, 0.2, 1);
const layoutTween = { type: "tween" as const, ease: easeSoft, duration: 0.22 };

function TabChip({
  active,
  label,
  onClick,
  title,
  getActiveRef,
}: {
  active: boolean;
  label: string;
  onClick: () => void;
  title?: string;
  getActiveRef?: (el: HTMLButtonElement | null) => void;
}) {
  return (
    <motion.button
      type="button"
      title={title}
      onClick={onClick}
      aria-selected={active}
      layout="position"
      whileTap={{ scale: 0.98 }}
      transition={{ layout: layoutTween }}
      ref={active ? (el) => getActiveRef?.(el) : undefined}
      className={clsx(
        "relative inline-flex h-8 items-center rounded-full border px-3 text-sm",
        "border-border bg-surface text-foreground hover:bg-surface",
        "focus-visible:ring-2 focus-visible:ring-[var(--ring-color)] focus-visible:outline-none",
        "transform-gpu will-change-[transform]"
      )}
      data-active={active ? "" : undefined}
    >
      {active && (
        <motion.span
          layoutId="tab-active-pill"
          transition={{ layout: layoutTween }}
          className="bg-brand-500 absolute inset-0 -z-10 transform-gpu rounded-full will-change-[transform]"
        />
      )}

      <motion.span
        layout
        transition={{ layout: layoutTween }}
        className={active ? "text-on-primary" : "text-foreground"}
      >
        {label}
      </motion.span>
    </motion.button>
  );
}
