"use client";

import { AnimatePresence, motion, type Variants } from "framer-motion";
import React from "react";

type Size = "sm" | "md" | "lg" | "xl";

type Props = {
  isOpen: boolean;
  onClose: () => void;
  title?: string;
  size?: Size;
  children?: React.ReactNode;
};

const WIDTH: Record<Size, string> = {
  sm: "w-[360px]",
  md: "w-[480px]",
  lg: "w-[720px]",
  xl: "w-[960px]",
};

const backdrop: Variants = {
  hidden: { opacity: 0 },
  visible: { opacity: 1 },
  exit: { opacity: 0 },
};

const panel: Variants = {
  hidden: { x: 40, opacity: 0 },
  visible: { x: 0, opacity: 1, transition: { type: "spring", stiffness: 380, damping: 30 } },
  exit: { x: 40, opacity: 0, transition: { duration: 0.15 } },
};

export default function Drawer({ isOpen, onClose, title, size = "md", children }: Props) {
  React.useEffect(() => {
    if (isOpen) document.body.style.overflow = "hidden";
    return () => {
      document.body.style.overflow = "";
    };
  }, [isOpen]);

  React.useEffect(() => {
    if (!isOpen) return;
    const onKey = (e: KeyboardEvent) => {
      if (e.key === "Escape") onClose();
    };
    window.addEventListener("keydown", onKey);
    return () => window.removeEventListener("keydown", onKey);
  }, [isOpen, onClose]);

  return (
    <AnimatePresence>
      {isOpen && (
        <motion.div
          className="fixed inset-0 z-50 flex items-stretch justify-end bg-black/40"
          variants={backdrop}
          initial="hidden"
          animate="visible"
          exit="exit"
          onClick={onClose}
        >
          <motion.aside
            role="dialog"
            aria-modal="true"
            aria-label={title}
            className={[
              "h-full border-l border-[var(--color-border)] bg-[var(--color-surface)] p-5 shadow-2xl",
              WIDTH[size],
            ].join(" ")}
            variants={panel}
            initial="hidden"
            animate="visible"
            exit="exit"
            onClick={(e) => e.stopPropagation()}
          >
            <div className="mb-4 flex items-center justify-between">
              {title && <h2 className="text-lg font-semibold">{title}</h2>}
              <button
                type="button"
                aria-label="Tutup"
                className="inline-flex h-8 w-8 items-center justify-center rounded-md focus-visible:ring-2 ring-[var(--color-border)] outline-none"
                onClick={onClose}
              >
                <svg viewBox="0 0 24 24" className="h-5 w-5" fill="none" stroke="currentColor" strokeWidth={2} strokeLinecap="round" strokeLinejoin="round" aria-hidden>
                  <line x1="18" y1="6" x2="6" y2="18" />
                  <line x1="6" y1="6" x2="18" y2="18" />
                </svg>
              </button>
            </div>
            <div className="h-[calc(100%-56px)] overflow-auto pr-1">{children}</div>
          </motion.aside>
        </motion.div>
      )}
    </AnimatePresence>
  );
}

