"use client";

import * as React from "react";

import Dropdown, { type Option } from "@/components/partials/Dropdown";
import {
  useServiceCategoriesList,
  useServiceCategoryDetail,
  type ServiceCategory,
} from "@/features/order-service/useServiceCategory";

const uniqBy = <T extends { id: string }>(arr: T[]) => {
  const seen = new Set<string>();
  return arr.filter((x) => (seen.has(x.id) ? false : (seen.add(x.id), true)));
};

// debounce hook sederhana
function useDebounced<T>(value: T, delay = 600) {
  const [v, setV] = React.useState(value);
  React.useEffect(() => {
    const id = setTimeout(() => setV(value), delay);
    return () => clearTimeout(id);
  }, [value, delay]);
  return v;
}

type Props = {
  value?: string | "";
  onChange?: (id: string) => void;
  disabled?: boolean;
  placeholder?: string;
  ensureId?: string | null;
};

export default function CategorySelect({
  value = "",
  onChange,
  disabled,
  placeholder = "Pilih kategori",
  ensureId,
}: Props) {
  const [searchRaw, setSearchRaw] = React.useState("");
  const debounced = useDebounced(searchRaw, 600);

  const MIN_CHARS = 2;
  const qCommitted = React.useMemo(() => {
    const t = debounced.trim();
    return t.length >= MIN_CHARS ? t : "";
  }, [debounced]);

  const [page, setPage] = React.useState(1);
  const perPage = 20;

  // ketika query committed berubah → reset paging & items
  React.useEffect(() => {
    setPage(1);
    setItems([]);
  }, [qCommitted]);

  // query list (hanya tergantung qCommitted & page)
  const listQ = useServiceCategoriesList({
    q: qCommitted,
    is_active: true,
    page,
    per_page: perPage,
    sort: "name",
    order: "asc",
  });

  const [items, setItems] = React.useState<ServiceCategory[]>([]);
  React.useEffect(() => {
    const pageItems = listQ.data?.data?.items ?? [];
    if (pageItems.length) {
      setItems((prev) => uniqBy([...prev, ...pageItems]));
    }
  }, [listQ.data]);

  const lastPage = listQ.data?.data?.pagination?.last_page ?? 1;
  const hasMore = page < lastPage;

  // ensure selected category saat edit
  const needEnsure = Boolean(ensureId && !items.some((i) => i.id === ensureId));
  const ensuredDetailQ = useServiceCategoryDetail(needEnsure ? ensureId! : undefined, needEnsure);
  React.useEffect(() => {
    const cat = ensuredDetailQ.data?.data;
    if (cat && !items.some((i) => i.id === cat.id)) {
      setItems((prev) => uniqBy([cat as ServiceCategory, ...prev]));
    }
  }, [ensuredDetailQ.data, items]);

  const options: Option<string>[] = React.useMemo(
    () => items.map((c) => ({ value: c.id, label: c.name })),
    [items]
  );

  const handleReachBottom = React.useCallback(() => {
    if (!listQ.isFetching && hasMore) setPage((p) => p + 1);
  }, [listQ.isFetching, hasMore]);

  return (
    <Dropdown
      value={(value ?? "") as string}
      onChange={(v) => onChange?.(v)}
      options={options}
      disabled={disabled}
      placeholder={placeholder}
      searchable
      searchPlaceholder={MIN_CHARS > 1 ? `Cari (${MIN_CHARS}+ huruf)…` : "Cari…"}
      searchValue={searchRaw}
      onSearchChange={setSearchRaw}
      isLoading={listQ.isFetching}
      onReachBottom={handleReachBottom}
      noOptionsText={
        qCommitted ? (listQ.isFetching ? "Memuat…" : "Tidak ada hasil") : "Tidak ada kategori"
      }
    />
  );
}
