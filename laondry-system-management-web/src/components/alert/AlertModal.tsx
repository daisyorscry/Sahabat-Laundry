"use client";

import React, { useEffect, useRef } from "react";
import { createPortal } from "react-dom";
import { FiAlertTriangle, FiCheckCircle, FiInfo, FiX, FiXCircle } from "react-icons/fi";

import type { AlertOptions, AlertType } from "./AlertContext";

type Props = { visible: boolean; options: AlertOptions; onClose: () => void };

const ACCENT: Record<AlertType, string> = {
  success: "#22C55E",
  danger: "#EF4444",
  warning: "#F59E0B",
  info: "#3B82F6",
};

const ICON: Record<AlertType, React.ReactNode> = {
  success: <FiCheckCircle className="h-5 w-5" />,
  danger: <FiXCircle className="h-5 w-5" />,
  warning: <FiAlertTriangle className="h-5 w-5" />,
  info: <FiInfo className="h-5 w-5" />,
};

const AlertModal: React.FC<Props> = ({ visible, options, onClose }) => {
  const mountedRef = useRef(false);
  const containerRef = useRef<HTMLElement | null>(null);

  useEffect(() => {
    mountedRef.current = true;
    containerRef.current = document.body;
    return () => {
      mountedRef.current = false;
    };
  }, []);

  // ESC untuk menutup
  useEffect(() => {
    if (!visible) return;
    const onKey = (e: KeyboardEvent) => {
      if (e.key === "Escape" && options.dismissible !== false) onClose();
    };
    window.addEventListener("keydown", onKey);
    return () => window.removeEventListener("keydown", onKey);
  }, [visible, options.dismissible, onClose]);

  if (!mountedRef.current || !visible || !containerRef.current) return null;

  const type: AlertType = options.type ?? "info";
  const accent = ACCENT[type];
  const buttons = options.buttons?.length ? options.buttons : [{ text: "OK" }];

  const title =
    options.title ||
    (type === "success"
      ? "Sukses"
      : type === "danger"
        ? "Error"
        : type === "warning"
          ? "Peringatan"
          : "Info");

  const modal = (
    <div className="fixed inset-0 z-[9999] flex items-center justify-center">
      {/* Backdrop */}
      <div
        className="data-[enter]:animate-fade-in data-[leave]:animate-fade-out absolute inset-0 bg-black/40"
        onClick={() => (options.dismissible !== false ? onClose() : null)}
      />

      {/* Card */}
      <div
        className="relative z-10 w-[92%] max-w-[560px] rounded-2xl border border-slate-200 bg-white p-4 shadow-xl ring-1 ring-slate-100/60 dark:border-slate-800 dark:bg-slate-900 dark:ring-0"
        style={options.containerStyle}
        role="dialog"
        aria-modal="true"
        aria-labelledby="alert-title"
      >
        <button
          onClick={() => (options.dismissible !== false ? onClose() : null)}
          className="absolute top-3 right-3 rounded-md p-1 text-slate-400 hover:bg-slate-100 hover:text-slate-600 dark:hover:bg-slate-800 dark:hover:text-slate-200"
          aria-label="Tutup"
        >
          <FiX className="h-5 w-5" />
        </button>

        <div className="mb-1 flex items-center gap-3">
          <div
            className="grid h-8 w-8 place-items-center rounded-lg"
            style={{ backgroundColor: `${accent}22`, color: accent }}
            aria-hidden
          >
            {ICON[type]}
          </div>
          <h2
            id="alert-title"
            className="text-base font-semibold text-slate-900 dark:text-slate-100"
          >
            {title}
          </h2>
        </div>

        {!!options.message && (
          <p className="mt-1 text-sm text-slate-600 dark:text-slate-300">{options.message}</p>
        )}

        <div className="mt-4 flex justify-end gap-2">
          {buttons.map((b, i) => {
            const ghost = !!b.ghost;
            return (
              <button
                key={`${b.text}-${i}`}
                onClick={() => {
                  b.onPress?.();
                  onClose();
                }}
                className={[
                  "min-w-[96px] rounded-lg px-4 py-2 text-sm font-semibold transition",
                  ghost ? "border bg-transparent" : "text-white",
                ].join(" ")}
                style={ghost ? { borderColor: accent, color: accent } : { backgroundColor: accent }}
              >
                {b.text}
              </button>
            );
          })}
        </div>
      </div>
    </div>
  );

  return createPortal(modal, containerRef.current);
};

export default AlertModal;
