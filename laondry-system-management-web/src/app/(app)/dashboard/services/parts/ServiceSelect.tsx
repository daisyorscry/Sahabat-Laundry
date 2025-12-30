"use client";

import * as React from "react";

import Dropdown, { type Option } from "@/components/partials/Dropdown";
import {
  useServiceDetail,
  useServicesList,
  type Service,
} from "@/features/order-service/useService";

const uniqBy = <T extends { id: string }>(arr: T[]) => {
  const seen = new Set<string>();
  return arr.filter((x) => (seen.has(x.id) ? false : (seen.add(x.id), true)));
};

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

export default function ServiceSelect({
  value = "",
  onChange,
  disabled,
  placeholder = "Pilih service",
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

  React.useEffect(() => {
    setPage(1);
    setItems([]);
  }, [qCommitted]);

  const listQ = useServicesList({
    q: qCommitted,
    is_active: true,
    page,
    per_page: perPage,
    sort: "name",
    order: "asc",
  });

  const [items, setItems] = React.useState<Service[]>([]);
  React.useEffect(() => {
    const pageItems = listQ.data?.data?.items ?? [];
    if (pageItems.length) {
      setItems((prev) => uniqBy([...prev, ...pageItems]));
    }
  }, [listQ.data]);

  const lastPage = listQ.data?.data?.pagination?.last_page ?? 1;
  const hasMore = page < lastPage;

  // ensure selected service saat edit
  const needEnsure = Boolean(ensureId && !items.some((i) => i.id === ensureId));
  const ensuredDetailQ = useServiceDetail(needEnsure ? ensureId! : undefined, needEnsure);
  React.useEffect(() => {
    const svc = ensuredDetailQ.data?.data;
    if (svc && !items.some((i) => i.id === svc.id)) {
      setItems((prev) => uniqBy([svc as Service, ...prev]));
    }
  }, [ensuredDetailQ.data, items]);

  const options: Option<string>[] = React.useMemo(
    () =>
      items.map((s) => ({
        value: s.id,
        label: s.name ? `${s.name}${s.code ? ` — ${s.code}` : ""}` : s.id,
      })),
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
        qCommitted ? (listQ.isFetching ? "Memuat…" : "Tidak ada hasil") : "Tidak ada service"
      }
    />
  );
}
