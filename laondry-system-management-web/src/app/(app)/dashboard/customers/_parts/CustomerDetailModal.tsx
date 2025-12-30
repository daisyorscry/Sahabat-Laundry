"use client";

import * as React from "react";
import Button from "@/components/button/Button";
import Modal from "@/components/ui/Modal";
import {
  type Customer,
  useCustomerDetail,
  useCustomerStatistics,
} from "@/features/order-service/useCustomer";

type Props = {
  isOpen: boolean;
  onClose: () => void;
  customerId?: string | null;
};

export default function CustomerDetailModal({ isOpen, onClose, customerId }: Props) {
  const detailQ = useCustomerDetail(customerId, isOpen);
  const statsQ = useCustomerStatistics(customerId, isOpen);

  const customer = detailQ.data?.data;
  const stats = statsQ.data?.data;

  return (
    <Modal
      isOpen={isOpen}
      onClose={onClose}
      title="Detail Customer"
      size="3xl"
      footer={
        <div className="flex justify-end gap-2">
          <Button variant="outline" tone="neutral" onClick={onClose} size="sm">
            Tutup
          </Button>
        </div>
      }
    >
      {detailQ.isLoading && (
        <div className="py-8 text-center text-sm opacity-70">Memuat data customer...</div>
      )}

      {customer && (
        <div className="space-y-6">
          {/* Basic Info */}
          <div className="rounded-lg border border-[var(--color-border)] bg-[var(--color-surface)] p-4">
            <h3 className="mb-3 text-sm font-semibold uppercase tracking-wide opacity-70">
              Informasi Dasar
            </h3>
            <div className="grid grid-cols-2 gap-4">
              <div>
                <div className="text-xs opacity-60">Nama Lengkap</div>
                <div className="font-medium">{customer.full_name}</div>
              </div>
              <div>
                <div className="text-xs opacity-60">Nomor Telepon</div>
                <div className="font-medium">{customer.phone_number}</div>
              </div>
              <div>
                <div className="text-xs opacity-60">Email</div>
                <div className="font-medium">{customer.email || "-"}</div>
              </div>
              <div>
                <div className="text-xs opacity-60">Saldo</div>
                <div className="font-mono font-medium">
                  Rp {parseFloat(customer.balance).toLocaleString("id-ID")}
                </div>
              </div>
              <div>
                <div className="text-xs opacity-60">Status</div>
                <div>
                  <span
                    className={[
                      "inline-flex items-center rounded-full border px-2 py-0.5 text-[12px]",
                      customer.is_active
                        ? "border-[var(--color-emerald-400)]"
                        : "border-[var(--color-red-400)]",
                    ].join(" ")}
                  >
                    {customer.is_active ? "Aktif" : "Banned"}
                  </span>
                </div>
              </div>
              <div>
                <div className="text-xs opacity-60">Member</div>
                <div>
                  {customer.is_member ? (
                    <span className="text-[var(--color-amber-500)]">★ Member Premium</span>
                  ) : (
                    <span className="opacity-60">Regular</span>
                  )}
                </div>
              </div>
            </div>
            {customer.banned_reason && (
              <div className="mt-4 rounded bg-[var(--color-red-50)] p-3 dark:bg-[var(--color-red-900)]">
                <div className="text-xs font-semibold text-[var(--color-red-600)] dark:text-[var(--color-red-400)]">
                  Alasan Ban
                </div>
                <div className="text-sm">{customer.banned_reason}</div>
              </div>
            )}
          </div>

          {/* Addresses */}
          {customer.addresses && customer.addresses.length > 0 && (
            <div className="rounded-lg border border-[var(--color-border)] bg-[var(--color-surface)] p-4">
              <h3 className="mb-3 text-sm font-semibold uppercase tracking-wide opacity-70">
                Alamat ({customer.addresses.length})
              </h3>
              <div className="space-y-2">
                {customer.addresses.map((addr) => (
                  <div
                    key={addr.id}
                    className="rounded border border-[var(--color-border)] bg-[var(--color-bg)] p-3"
                  >
                    <div className="flex items-start justify-between">
                      <div>
                        <div className="mb-1 font-medium">{addr.label}</div>
                        <div className="text-sm opacity-80">{addr.address}</div>
                        {(addr.latitude || addr.longitude) && (
                          <div className="mt-1 text-xs opacity-60">
                            📍 {addr.latitude}, {addr.longitude}
                          </div>
                        )}
                      </div>
                      {addr.is_primary && (
                        <span className="rounded bg-[var(--color-emerald-100)] px-2 py-0.5 text-xs text-[var(--color-emerald-700)] dark:bg-[var(--color-emerald-900)] dark:text-[var(--color-emerald-300)]">
                          Primary
                        </span>
                      )}
                    </div>
                  </div>
                ))}
              </div>
            </div>
          )}

          {/* Statistics */}
          {statsQ.isLoading && (
            <div className="py-4 text-center text-sm opacity-70">Memuat statistik...</div>
          )}
          {stats && (
            <div className="rounded-lg border border-[var(--color-border)] bg-[var(--color-surface)] p-4">
              <h3 className="mb-3 text-sm font-semibold uppercase tracking-wide opacity-70">
                Statistik Order
              </h3>
              <div className="grid grid-cols-3 gap-4">
                <div className="text-center">
                  <div className="text-2xl font-bold text-[var(--color-primary)]">
                    {stats.total_orders}
                  </div>
                  <div className="text-xs opacity-60">Total Order</div>
                </div>
                <div className="text-center">
                  <div className="text-2xl font-bold text-[var(--color-emerald-500)]">
                    {stats.completed_orders}
                  </div>
                  <div className="text-xs opacity-60">Selesai</div>
                </div>
                <div className="text-center">
                  <div className="text-2xl font-bold text-[var(--color-amber-500)]">
                    {stats.pending_orders}
                  </div>
                  <div className="text-xs opacity-60">Pending</div>
                </div>
                <div className="col-span-3 border-t border-[var(--color-border)] pt-3 text-center">
                  <div className="text-xl font-bold text-[var(--color-primary)]">
                    Rp {stats.total_spending.toLocaleString("id-ID")}
                  </div>
                  <div className="text-xs opacity-60">Total Spending</div>
                </div>
                <div className="col-span-3 text-center">
                  <div className="text-lg font-semibold">
                    Rp {stats.average_order_value.toLocaleString("id-ID")}
                  </div>
                  <div className="text-xs opacity-60">Average Order Value</div>
                </div>
              </div>
              {stats.last_order_date && (
                <div className="mt-4 text-center text-xs opacity-60">
                  Order terakhir:{" "}
                  {new Date(stats.last_order_date).toLocaleDateString("id-ID", {
                    day: "numeric",
                    month: "long",
                    year: "numeric",
                  })}
                </div>
              )}
            </div>
          )}

          {/* Meta */}
          <div className="rounded-lg border border-[var(--color-border)] bg-[var(--color-surface)] p-4">
            <h3 className="mb-3 text-sm font-semibold uppercase tracking-wide opacity-70">
              Informasi Tambahan
            </h3>
            <div className="grid grid-cols-2 gap-4 text-sm">
              <div>
                <div className="text-xs opacity-60">Terdaftar</div>
                <div>
                  {new Date(customer.created_at).toLocaleDateString("id-ID", {
                    day: "numeric",
                    month: "long",
                    year: "numeric",
                  })}
                </div>
              </div>
              <div>
                <div className="text-xs opacity-60">Terakhir Diubah</div>
                <div>
                  {new Date(customer.updated_at).toLocaleDateString("id-ID", {
                    day: "numeric",
                    month: "long",
                    year: "numeric",
                  })}
                </div>
              </div>
            </div>
          </div>
        </div>
      )}
    </Modal>
  );
}
