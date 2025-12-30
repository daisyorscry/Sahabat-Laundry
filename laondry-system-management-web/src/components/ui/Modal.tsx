// src/components/ui/Modal.tsx
"use client";

import { AnimatePresence, motion, type Variants } from "framer-motion";
import React from "react";

type Size = "sm" | "md" | "lg" | "xl" | "full";

interface ModalProps {
  isOpen: boolean;
  onClose: () => void;
  children: React.ReactNode;
  title?: string;
  size?: Size;
}

const EASE_OUT = [0.16, 1, 0.3, 1] as const;
const EASE_IN = [0.4, 0, 1, 1] as const;

const backdropVariant: Variants = {
  hidden: { opacity: 0 },
  visible: { opacity: 1 },
  exit: { opacity: 0 },
};

const modalVariant: Variants = {
  hidden: { opacity: 0, scale: 0.97 },
  visible: {
    opacity: 1,
    scale: 1,
    transition: { duration: 0.2, ease: EASE_OUT },
  },
  exit: {
    opacity: 0,
    scale: 0.97,
    transition: { duration: 0.18, ease: EASE_IN },
  },
};

const SIZE_CLASSES: Record<Size, string> = {
  sm: "max-w-sm",
  md: "max-w-md",
  lg: "max-w-2xl",
  xl: "max-w-4xl",
  full: "max-w-full mx-4",
};

const Modal: React.FC<ModalProps> = ({ isOpen, onClose, children, title, size = "md" }) => {
  // lock scroll saat open
  React.useEffect(() => {
    if (isOpen) document.body.style.overflow = "hidden";
    return () => {
      document.body.style.overflow = "";
    };
  }, [isOpen]);

  // ESC untuk close
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
          className={[
            "fixed inset-0 z-50 flex items-center justify-center",
            "bg-[var(--color-background)]/60",
            "backdrop-blur-sm",
          ].join(" ")}
          variants={backdropVariant}
          initial="hidden"
          animate="visible"
          exit="exit"
          onClick={onClose}
          aria-hidden
        >
          <motion.div
            role="dialog"
            aria-modal="true"
            aria-label={title}
            className={[
              "relative w-full",
              "rounded-xl",
              "bg-[var(--color-surface)]",
              "text-[var(--color-foreground)]",
              "border border-[var(--color-border)]",
              "shadow-2xl",
              "p-6",
              SIZE_CLASSES[size],
              "outline-none focus-visible:ring-2 ring-[var(--color-border)]",
            ].join(" ")}
            variants={modalVariant}
            initial="hidden"
            animate="visible"
            exit="exit"
            onClick={(e) => e.stopPropagation()}
          >
            <button
              type="button"
              aria-label="Tutup"
              className={[
                "absolute top-4 right-4 inline-flex h-8 w-8 items-center justify-center rounded-md",
                "text-[var(--color-foreground)]/70 hover:text-[var(--color-foreground)]",
                "focus-visible:ring-2 ring-[var(--color-border)] outline-none",
              ].join(" ")}
              onClick={onClose}
            >
              <svg
                viewBox="0 0 24 24"
                className="h-5 w-5"
                fill="none"
                stroke="currentColor"
                strokeWidth={2}
                strokeLinecap="round"
                strokeLinejoin="round"
                aria-hidden="true"
              >
                <line x1="18" y1="6" x2="6" y2="18" />
                <line x1="6" y1="6" x2="18" y2="18" />
              </svg>
            </button>

            {title && <h2 className="mb-4 text-lg font-semibold">{title}</h2>}

            <div>{children}</div>
          </motion.div>
        </motion.div>
      )}
    </AnimatePresence>
  );
};

export default Modal;
