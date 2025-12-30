// src/app/(app)/dashboard/services/[id]/addons/_parts/useAddonCatalog.ts
"use client";

import * as React from "react";

import { useAddonsList } from "@/features/order-service/useAddons";

export function useAddonCatalog() {
  const [q, setQ] = React.useState("");
  const [page, setPage] = React.useState(1);
  const per_page = 20;

  const [debounced, setDebounced] = React.useState(q);
  React.useEffect(() => {
    const t = setTimeout(() => setDebounced(q), 350);
    return () => clearTimeout(t);
  }, [q]);

  const listQ = useAddonsList({
    q: debounced || undefined,
    is_active: true,
    page,
    per_page,
    sort: "name",
    order: "asc",
  });

  // options aggregator
  const [options, setOptions] = React.useState<{ label: string; value: string }[]>([]);
  React.useEffect(() => {
    setPage(1);
    setOptions([]);
  }, [debounced]);

  React.useEffect(() => {
    const items = listQ.data?.data?.items ?? [];
    if (!items.length) return;
    setOptions((prev) => {
      const seen = new Set(prev.map((p) => p.value));
      const next = items
        .filter((i) => !seen.has(i.id))
        .map((i) => ({ label: `${i.name} (${i.code})`, value: i.id }));
      return prev.concat(next);
    });
  }, [listQ.data]);

  const pg = listQ.data?.data?.pagination;
  const hasMore = (pg?.current_page ?? 1) < (pg?.last_page ?? 1);

  return {
    options,
    isLoading: listQ.isFetching,
    q,
    setQ,
    nextPage: () => hasMore && setPage((p) => p + 1),
    hasMore,
  };
}
